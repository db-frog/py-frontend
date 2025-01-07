<template>
  <div class="page-wrapper">
    <!-- Sidebar with Filters -->
    <aside class="sidebar">
      <!-- For each field in uniqueOptions -->
      <div v-for="(options, fieldName) in uniqueOptions" :key="fieldName" class="filter-section">
        <h2>{{ fieldName }}</h2>
        <ul>
          <li
            v-for="(option, idx) in options"
            :key="option + idx"
          >
            <label>
              <input
                type="checkbox"
                :value="option"
                v-model="selectedFilters[fieldName]"
              />
              {{ option }}
            </label>
          </li>
        </ul>
      </div>
    </aside>
    <div class="main-container">
      <h1>Berkeley Folklore Archive</h1>
      <div v-if="error" class="error">
        Error: {{ error }}
      </div>
      <!-- Table Container with Fixed Height -->
      <div class="table-container">
      <!-- Table with Folklore Collections -->
        <table class="modern-table">
        <thead>
          <tr>
            <th>Contributor Name</th>
            <th>Contributor Age</th>
            <th>Contributor Gender</th>
            <th>Folklore Item</th>
            <th>Genre</th>
            <th>Language of Origin</th>
            <th>Collector Name</th>
            <th>Date Collected</th>
            <th>Location Collected</th>
            <th>Get PDF</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="collection in paginatedCollections"
              :key="collection._id"
              @click="openModal(collection)">
            <td>{{ collection.contributor.name }}</td>
            <td>{{ collection.contributor.age_bucket }}</td>
            <td>{{ collection.contributor.gender || 'N/A' }}</td>
            <td>{{ collection.folklore.item }}</td>
            <td>{{ collection.folklore.genre }}</td>
            <td>{{ collection.folklore.language_of_origin || 'N/A' }}</td>
            <td>{{ collection.collector.name }}</td>
            <td>{{ formatDate(collection.date_collected) }}</td>
            <td>{{ formatLocation(collection.location_collected) }}</td>
              <td>
                <a
                  :href="`https://env-2986297.us.reclaim.cloud/folklore/${collection._id}/download`"
                  @click.stop
                >
                  Download
                </a>
              </td>
          </tr>
        </tbody>
      </table>
      </div>

      <!-- Loading / No Data State -->
      <div v-if="paginatedCollections.length === 0 && filteredCollections.length > 0">
        <p>No data available for this page.</p>
      </div>
      <div v-else-if="collections.length === 0">
        <p>Loading...</p>
      </div>

      <!-- Adaptive Page Numbers -->
      <div v-if="totalPages > 1" class="pagination-container">
        <div v-for="(page, index) in displayPages" :key="index">
          <!-- Ellipses -->
          <span v-if="page === '...'">...</span>
          <!-- Page Number -->
          <span
            v-else
            class="page-number"
            :class="{ active: currentPage + 1 === page }"
            @click="onPageClick(page)"
          >
            {{ page }}
          </span>
        </div>
      </div>

      <!-- Modal (Shown when showModal is true) -->
      <transition name="fade">
        <div class="modal-backdrop" v-if="showModal" @click="closeModal">
          <div class="modal-content" @click.stop>
            <h2>Folklore Details</h2>
            <p><strong>Contributor Name:</strong> {{ selectedRow?.contributor.name }}</p>
            <p><strong>Age:</strong> {{ selectedRow?.contributor.age_bucket }}</p>
            <p><strong>Gender:</strong> {{ selectedRow?.contributor.gender || 'N/A' }}</p>
            <p><strong>Folklore Item:</strong> {{ selectedRow?.folklore.item }}</p>
            <p><strong>Genre:</strong> {{ selectedRow?.folklore.genre }}</p>
            <p><strong>Language of Origin:</strong> {{ selectedRow?.folklore.language_of_origin || 'N/A' }}</p>
            <p><strong>Collector Name:</strong> {{ selectedRow?.collector.name }}</p>
            <p>
              <strong>Date Collected:</strong>
              {{ selectedRow ? formatDate(selectedRow.date_collected) : '' }}
            </p>
            <p>
              <strong>Location Collected:</strong>
              {{ selectedRow ? formatLocation(selectedRow.location_collected) : '' }}
            </p>
            <p><strong>Places Mentioned:</strong>
              <span v-for="(place, idx) in selectedRow?.folklore.place_mentioned" :key="idx">
                {{ selectedRow ? formatLocation(place) : '' }}
              </span>
            </p>
            <p><strong>Full Text:</strong> {{ selectedRow?.cleaned_full_text }}</p>
            <h2>Student's Analysis</h2>
              <p><strong>Interpretation:</strong> {{ selectedRow?.analysis.interpretation || 'N/A' }}</p>
              <p><strong>Collector Comments:</strong> {{ selectedRow?.analysis.collector_comments || 'N/A' }}</p>
              <p><strong>Use Context:</strong> {{ selectedRow?.analysis.context.use_context || 'N/A' }}</p>
              <p><strong>Cultural Background:</strong> {{ selectedRow?.analysis.context.cultural_background || 'N/A' }}</p>
              <p><strong>Collection Context:</strong> {{ selectedRow?.analysis.context.collection_context || 'N/A' }}</p>
            <button class="close-btn" @click="closeModal">Close</button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, ref, onMounted, computed, watch} from "vue";
import type { FolkloreCollection } from "../types";

export default defineComponent({
  name: "FolkloreCollectionTable",
  setup() {
    // -------------------------------------------------
    // Reactive Data
    // -------------------------------------------------
    const collections = ref<FolkloreCollection[]>([]);
    const error = ref<string | null>(null);

    // A dictionary-like object, where each key is a field name (e.g. "genre", "language_of_origin")
    // and the value is an array of selected strings.
    const selectedFilters = ref<Record<string, string[]>>({
      genre: [],
      language_of_origin: [],
    });

    // Pagination
    const currentPage = ref<number>(0);
    const itemsPerPage = 20; // Show 20 items per page

    // Modal State
    const showModal = ref<boolean>(false);
    const selectedRow = ref<FolkloreCollection | null>(null);

    // -------------------------------------------------
    // Methods
    // -------------------------------------------------
    // Fetch collections (with optional genre)
    const fetchCollections = async () => {
      try {
        let path = "/api/folklore/";
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        collections.value = data;
        currentPage.value = 0; // Reset to page 0 when new data loads
      } catch (err: any) {
        error.value = err.message;
      }
    };

    // Format the date
    const formatDate = (date: string): string => {
      return new Date(date).toLocaleDateString();
    };

    // Format the location
    const formatLocation = (location: FolkloreCollection["location_collected"]): string => {
      return [location.city, location.state, location.country].filter(Boolean).join(", ");
    };

    // Go to a specific page (0-based index)
    const goToPage = (pageIndex: number) => {
      currentPage.value = pageIndex;
    };

    // Helper method to handle page clicks
    const onPageClick = (page: number | string) => {
      if (typeof page === "number") {
        goToPage(page - 1);
      }
    };

    // Open Modal for a row
    const openModal = (collection: FolkloreCollection) => {
      selectedRow.value = collection;
      showModal.value = true;
    };

    // Close the modal
    const closeModal = () => {
      showModal.value = false;
      selectedRow.value = null;
    };

    // -------------------------------------------------
    // Computed Properties
    // -------------------------------------------------
    // A dictionary of field -> array of unique possible values
    const uniqueOptions = computed(() => {
      // We'll gather unique values for each field of interest
      const result: Record<string, string[]> = {
        genre: [],
        language_of_origin: [],
      };

      // Use a Set for each field
      const genreSet = new Set<string>();
      const languageSet = new Set<string>();

      collections.value.forEach((c) => {
        if (c.folklore.genre) {
          genreSet.add(c.folklore.genre);
        }
        if (c.folklore.language_of_origin) {
          languageSet.add(c.folklore.language_of_origin);
        }
      });

      // Convert to sorted arrays
      result.genre = Array.from(genreSet).sort();
      result.language_of_origin = Array.from(languageSet).sort();

      return result;
    });

    // Filtered by selected options
    const filteredCollections = computed(() => {
      let result = collections.value;

      // Loop over each field in selectedFilters
      for (const field of Object.keys(selectedFilters.value)) {
        const filterValues = selectedFilters.value[field];

        // Skip if no values are selected for this field
        if (filterValues.length === 0) continue;

        // Filter the data
        result = result.filter((col) => {
          // We'll assume the fields we care about exist on `col.folklore`
          // For more advanced usage, you might map field -> actual path in the data.
          const val = (col.folklore as any)[field];
          // If `val` is a simple string, just check for inclusion
          // If you needed arrays, you'd do more logic here.
          return val && filterValues.includes(val);
        });
      }

      return result;
    });

    // Pagination: slice the filtered list
    const paginatedCollections = computed(() => {
      const startIndex = currentPage.value * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return filteredCollections.value.slice(startIndex, endIndex);
    });

    // Total pages based on filtered data
    const totalPages = computed(() => {
      return Math.ceil(filteredCollections.value.length / itemsPerPage);
    });

    // Adaptive pagination (like before)
    const displayPages = computed<(number | string)[]>(() => {
      const total = totalPages.value;
      const current = currentPage.value + 1; // Convert to 1-based
      const pages: (number | string)[] = [];

      if (total <= 5) {
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
        return pages;
      }

      // Pages 1 and 2
      pages.push(1);
      pages.push(2);

      // Ellipsis if needed
      if (current > 4) {
        pages.push("...");
      }

      // Middle pages
      const start = Math.max(3, current - 1);
      const end = Math.min(total - 2, current + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (current < total - 3) {
        pages.push("...");
      }

      // Last two pages
      pages.push(total - 1);
      pages.push(total);

      // Remove duplicates
      const uniquePages: (number | string)[] = [];
      for (let i = 0; i < pages.length; i++) {
        if (i === 0 || pages[i] !== pages[i - 1]) {
          uniquePages.push(pages[i]);
        }
      }

      return uniquePages;
    });

    // -------------------------------------------------
    // Lifecycle Hooks
    // -------------------------------------------------
    onMounted(() => {
      fetchCollections(); // Load initial data
    });

    // Reset pagination when user changes filtering options
    watch(
      selectedFilters,
      () => {
        currentPage.value = 0;
      },
        // ensure that changes in  nested arrays (selectedFilters.value[fieldName]) trigger the watch callback
      { deep: true }
    );

    return {
      // Reactive
      collections,
      error,
      selectedFilters,
      currentPage,
      showModal,
      selectedRow,

      // Computed
      uniqueOptions,
      filteredCollections,
      paginatedCollections,
      totalPages,
      displayPages,

      // Methods
      fetchCollections,
      formatDate,
      formatLocation,
      onPageClick,
      openModal,
      closeModal,
    };
  },
});
</script>

<style scoped>
/* Layout: sidebar + main content */
.page-wrapper {
  display: flex;
  gap: 1rem;
  font-family: Arial, sans-serif;
}
/* Sidebar with genre filters */
.sidebar {
  width: 250px;
  min-width: 200px;
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 4px;

  /* fixed height and scroll */
  height: 400px;
  overflow-y: auto;
.sidebar h2 {
  margin-top: 0;
}
.sidebar ul {
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.sidebar li {
  margin-bottom: 0.5rem;
}

/* Main Container */
.main-container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  font-family: Arial, sans-serif;
  padding: 1rem;
}

/* Error Message */
.error {
  color: red;
  font-weight: bold;
}

/* Table Container with fixed width & height */
.table-container {
  width: 1000px;       /* Fixed width for table container */
  height: 400px;       /* Fixed height */
  overflow-y: auto;    /* Vertical scroll if needed */
  overflow-x: auto;    /* Horizontal scroll if content exceeds width */
  margin-bottom: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Modern Table Styles */
.modern-table {
  width: 1000px;      /* Exactly match container width or use a smaller width */
  border-collapse: collapse;
  background-color: #fff;
}

.modern-table thead {
  background-color: #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.modern-table th,
.modern-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #eee;
  /* Force text to truncate if there's overflow */
  overflow: hidden;
}

/* Fixed Row Height */
.modern-table tbody tr {
  height: 50px; /* Adjust as desired */
  transition: background-color 0.2s ease-in-out;
  cursor: pointer;
}
.modern-table tbody tr:hover {
  background-color: #fafafa;
}

/* Genre Cell Clickable for Re-Fetching (stop event) */
.clickable-genre {
  color: blue;
  text-decoration: underline;
  cursor: pointer;
}

/* Pagination Styles */
.pagination-container {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 1rem;
}
.page-number {
  cursor: pointer;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.page-number.active {
  font-weight: bold;
  background-color: #ddd;
}

/* Modal Styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background-color: #fff;
  width: 90%;
  max-height: 90%;
  overflow-y: auto;    /* Vertical scroll if needed */
  max-width: 600px;
  border-radius: 4px;
  padding: 1rem;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
  position: relative;
}

.close-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

/* Fade Transition for Modal */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>