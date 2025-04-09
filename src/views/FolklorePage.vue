<template>
  <div class="page-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="filter-section">
        <h3>View</h3>
        <select v-model="isTableView" @change="async () =>{ if (isTableView) await fetchInitialCollections() }">
          <option :value="true" selected>Table</option>
          <option :value="false">Map</option>
        </select>
      </div>
      <div class="filter-section" v-if="isTableView">
        <h3>Pagination</h3>
        <label>
              Items per page
              <input
                type="number"
                min="1"
                max="20"
                v-model="paginationState.itemsPerPage"
                style="width: 3rem;"
              />
        </label>
        <br>
        <label>
              Current page
              <input
                type="number"
                min="1"
                :max="totalPages"
                v-model="displayCurrentPage"
                style="width: 3rem;"
              />
        </label>
        <button @click="resetUserPagination">Reset</button>
      </div>

      <div class="filter-section" v-else>
        <h3>Timeline Configuration</h3>
        <label>
              Timeline Start Year
              <input
                type="number"
                min="0"
                v-model="timeState.startYear"
                :max="timeState.endYear - timeState.timeWindow"
                style="width: 4rem;"
              />
        </label>
        <br>
        <label>
              Timeline End Year
              <input
                type="number"
                :min="timeState.startYear + timeState.timeWindow"
                v-model="timeState.endYear"
                style="width: 4rem;"
              />
        </label>
        <br>
        <label>
              Window Size (years)
              <input
                type="number"
                min="1"
                v-model="timeState.timeWindow"
                style="width: 3rem;"
              />
        </label>
        <button @click="resetUserTime">Reset</button>
      </div>

      <div class="filter-section">
        <h3>Filters</h3>
        <button @click="handleFetchCollections()" class="filter-button">Apply Filters</button>
        <button @click="clearFilters()" class="filter-button">Clear Filters</button>
      </div>
      <div
        v-for="field of fields.filter(f => f.filterable)"
        :key="field.key"
        class="filter-section"
      >
        <h3 class="filter-header">{{ field.label }}</h3>
        <span class="expand-collapse-btn" v-if="isFieldExpand[field.key]" @click="isFieldExpand[field.key] = false">[-]</span>
        <span class="expand-collapse-btn" v-else @click="isFieldExpand[field.key] = true">[+]</span>
        <ul v-if="isFieldExpand[field.key]">
          <li
            v-for="(option, index) in uniqueOptions[field.key]"
            :key="option + index"
          >
            <label>
              <input
                type="checkbox"
                :value="option"
                v-model="selectedFilters[field.path]"
              />
              {{ option }}
            </label>
          </li>
        </ul>
      </div>
      <div class="filter-section">
        <h3 class="filter-header">Text Search</h3>
        <span class="expand-collapse-btn" v-if="isFieldExpand['search-text']" @click="isFieldExpand['search-text'] = false">[-]</span>
        <span class="expand-collapse-btn" v-else @click="isFieldExpand['search-text'] = true">[+]</span>
        <div v-if="isFieldExpand['search-text']">
          <span>Includes: </span>
          <input type="text" v-model="selectedFilters['cleaned_full_text']"/>
        </div>
      </div>
      
      <div class="filter-section">
        <h3>Random Item</h3>
        <button @click="handleFetchRandom">Generate</button>
        <button @click="undoRandom">Show all</button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="content-area">
      <h1>Berkeley Folklore Archive</h1>

        <!-- Table Container with Fixed Height -->
        <div class="table-container">
          <DynamicTable
            :rows="paginatedCollections"
            :fields="fields"
            :onRowClick="openModal"
            :isLoading="isLoading"
            v-if="isTableView"
          />

          <DynamicMap
            :getData="fetchFilteredMapData"
            :timeState="timeState"
            :reload="flipToReloadMap"
            :fields="fields"
            :onRowClick="openModal"
            :isLoading="isLoading"
            v-if="!isTableView"
          />
        </div>
        

        <!-- Pagination, Modal, etc. -->
        <div class="pagination-container" v-if="totalPages > 1 && isTableView">
          <div v-for="(page, index) in displayPages" :key="index">
            <!-- Ellipses -->
            <span v-if="page === '...'">...</span>
            <!-- Page Number -->
            <span
              v-else
              class="page-number"
              :class="{ active: paginationState.currentPage + 1 === page }"
              @click="goToPageIndex(page)"
            >
              {{ page }}
            </span>
          </div>
        </div>

        <!-- Time interval buttons for map view -->
         <div class="pagination-container" v-if="!isTableView">
          <div v-for="(interval, index) in displayTime" :key="index">
            <!-- Ellipses -->
            <span v-if="interval[0] === '...'">...</span>
            <!-- Time Interval -->
            <span
              v-else
              class="page-number"
              :class="{ active: timeState.currentYear === interval[0] }"
              @click="goToTimeIndex(Number(interval[0]))"
            >
              {{ interval[0] }} - {{ interval[1] }}
            </span>
          </div>
         </div>

      <FolkloreModal
        v-if="showModal"
        :collection="selectedRow"
        :onClose="closeModal"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, computed, ref, onMounted} from "vue";
import { useFolkloreCollections } from "@/composables/useFolkloreCollections";
import DynamicMap from "@/components/DynamicMap.vue";
import DynamicTable from "@/components/DynamicTable.vue";
import FolkloreModal from "@/components/FolkloreModal.vue";

export default defineComponent({
  name: "FolklorePage",
  components: {
    DynamicTable,
    DynamicMap,
    FolkloreModal,
  },
  setup() {
    const {
      collections,
      isRandomCollection,
      fields,
      selectedFilters,
      flipToReloadMap,
      lastUsedSelectedFilters,
      paginationState,
      timeState,
      uniqueOptions,
      totalPages,
      paginatedCollections,
      fetchInitialCollections,
      fetchFilteredMapData,
      isTableView,
      fetchRandom,
      goToPage,
      populateUniqueOptions,
    } = useFolkloreCollections();

    // Use a local state for loading
    const isLoading = ref(true);

    // Tracks expand / collapse state for field filters
    const isFieldExpand = ref<Record<string, boolean>>({
      "search-text": true,
    });
    
    fields.forEach((field) => {
      if (field.filterable) {
        isFieldExpand.value[field.key] = true;
      }
    })

    // Modal state
    const showModal = ref(false);
    const selectedRow = ref(undefined);

    function openModal(row: any) {
      selectedRow.value = row;
      showModal.value = true;
    }
    function closeModal() {
      showModal.value = false;
      selectedRow.value = undefined;
    }

    // Utility Functions
    async function handleFetchRandom() {
      isLoading.value = true;
      await fetchRandom();
      isLoading.value = false;
    }

    async function handleFetchCollections() {
      if (JSON.stringify(lastUsedSelectedFilters.value) === JSON.stringify(selectedFilters.value)) {
        return;
      }
      isLoading.value = true;
      // Map view doesn't need paginated data
      if (isTableView.value) {
        await fetchInitialCollections();
      }
      flipToReloadMap.value = !flipToReloadMap.value;
      isLoading.value = false;
    }

    function resetUserPagination() {
      paginationState.value.itemsPerPage = 20;
      paginationState.value.currentPage = 0;
    }

    function resetUserTime() {
      timeState.value.startYear = 1960;
      timeState.value.endYear = new Date().getFullYear(),
      timeState.value.timeWindow = 500;
      timeState.value.currentYear = 1960;
    }

    function undoRandom() {
      isLoading.value = true;
      isRandomCollection.value = false;
      isLoading.value = false;
    }

    function clearFilters() {
      selectedFilters.value = {
          "folklore.genre": [],
          "folklore.language_of_origin": [],
          "location_collected.city": [],
          "folklore.place_mentioned.city": [],
          "cleaned_full_text": "",
        };
    }

    const displayCurrentPage = computed({
      get: () => paginationState.value.currentPage + 1,
      set: (page: number) => goToPageIndex(page),
    });

    // Pagination with page numbers / ellipses
    const displayPages = computed(() => {
      const total = totalPages.value;
      const current = paginationState.value.currentPage + 1;
      const pages: (number | string)[] = [];

      if (total <= 5) {
        for (let i = 1; i <= total; i++) pages.push(i);
        return pages;
      }

      pages.push(1, 2);
      if (current > 4) pages.push("...");
      const start = Math.max(3, current - 1);
      const end = Math.min(total - 2, current + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (current < total - 3) pages.push("...");
      pages.push(total - 1, total);

      // Remove duplicates
      return pages.filter((p, i, arr) => p !== arr[i - 1]);
    });

    // Pagination with page numbers / ellipses
    const displayTime = computed(() => {
      const startYear = timeState.value.startYear;
      const endYear = timeState.value.endYear;
      const timeWindow = timeState.value.timeWindow;
      const currentYear = timeState.value.currentYear;

      const total = Math.ceil((endYear - startYear) / timeWindow);
      const currentIndex = Math.floor((currentYear - startYear) / timeWindow);
      const intervals: (number | string)[][] = [];

      const toRange = (index: number) => {
        const start = startYear + index * timeWindow;
        const end = Math.min(start + timeWindow, endYear);
        return [start, end];
      }

      if (total <= 5) {
        for (let i = 0; i < total; i++) {
          intervals.push(toRange(i));
        }
        return intervals;
      }

      intervals.push(toRange(0), toRange(1));
      if (currentIndex > 3) intervals.push(["...", "..."]);
      const start = Math.max(2, currentIndex - 1);
      const end = Math.min(total - 2, currentIndex + 1);
      for (let i = start; i <= end; i++) {
        intervals.push(toRange(i));
      }
      if (currentIndex < total - 4) intervals.push(["...", "..."]);
      intervals.push(toRange(total - 2), toRange(total - 1));
      // Remove duplicates
      return intervals.filter((p, i, arr) => JSON.stringify(p) !== JSON.stringify(arr[i - 1]));
    });

    function goToPageIndex(page: number | string) {
      if (typeof page === "number") {
        isLoading.value = true;
        goToPage(page - 1);
        isLoading.value = false;
      }
    }

    function goToTimeIndex(year: number) {
      timeState.value.currentYear = year;
    }

    // Load collections on component mount
    onMounted(async () => {
      try {
        isLoading.value = true;
        await fetchInitialCollections(); // fetch data
        await populateUniqueOptions(); // fetch filters
      } finally {
        isLoading.value = false;
      }
    });

    return {
      // Data
      collections,
      isRandomCollection,
      fields,
      selectedFilters,
      paginationState,
      timeState,
      uniqueOptions,
      totalPages,
      paginatedCollections,
      isLoading,
      isTableView,
      isFieldExpand,
      flipToReloadMap,

      // Functions
      goToPage,
      displayPages,
      displayTime,
      goToPageIndex,
      goToTimeIndex,
      resetUserPagination,
      resetUserTime,
      fetchInitialCollections,
      fetchFilteredMapData,
      handleFetchRandom,
      handleFetchCollections,
      displayCurrentPage,
      undoRandom,
      clearFilters,

      // modal
      showModal,
      selectedRow,
      openModal,
      closeModal,
    };
  },
});
</script>

<style scoped>
/*
   The main container will be a row-based flex layout
   so the sidebar and content are side-by-side.
*/
.page-container {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  font-family: Arial, sans-serif;
  background-color: var(--color-primary-white);
  min-height: 100vh;
  padding: 1rem;
}
.page-container h1 {
  color: var(--color-primary-blue);
}

.sidebar {
  width: 250px;
  height: 700px;
  overflow-y: auto;
  list-style-type: none;
  background-color: var(--color-primary-white);
  border: 2px solid var(--color-primary-blue);
  border-radius: 6px;
  padding: 1rem;
  color: var(--color-primary-blue);
}

/*
   Each filter-section gets a max-height and scroll
   so multiple filters don't push each other around.
*/
.filter-section {
  list-style-type: none;
  max-height: 250px;
  overflow-y: auto;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-primary-blue);
  padding-bottom: 0.5rem;
}
.filter-section h3 {
  margin-top: 0;
  color: var(--color-primary-yellow);
  position: sticky;
  top: 0;
  background-color: var(--color-primary-white);
  z-index: 1;
}
.filter-section input[type="checkbox"] {
  accent-color: var(--color-primary-blue);
}
.filter-section label {
  cursor: pointer;
}
.filter-section ul {
  list-style-type: none;
}
.filter-section button {
  background-color: var(--color-primary-blue);
  color: var(--color-primary-white);
  display: block;
  margin-top: 0.5rem;
}
.filter-section button:hover {
  background-color: var(--color-secondary-darknavy);
  cursor: pointer;
}

.filter-button {
  width: 100%;
  padding: 0.5rem;
}

.filter-header {
  display: inline-flex;
  width: 90%;
}

.expand-collapse-btn {
  margin-top: 0;
  position: sticky;
  top: 0;
  z-index: 1;
}

.expand-collapse-btn:hover {
  color: var(--color-secondary-darknavy);
  cursor: pointer;
}
/*
   The remainder of horizontal space after the sidebar.
*/
.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/*
   Fix height and allow scroll.
*/
.table-container {
  width: 1000px;       /* Fixed width for table container */
  height: 600px;       /* Fixed height */
  overflow-y: auto;    /* Vertical scroll if needed */
  overflow-x: auto;    /* Horizontal scroll if content exceeds width */
  border: 2px solid var(--color-primary-blue);
  border-radius: 4px;
  margin-bottom: 1rem;
  background-color: var(--color-primary-white);
  color: var(--color-secondary-darknavy);
}

/*
   Pagination or other content can be below the table,
   not interfering with the table container's scrollbar.
*/
.pagination-container {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.page-number {
  cursor: pointer;
  padding: 4px 8px;
  border: 1px solid var(--color-primary-blue);
  border-radius: 4px;
  background-color: var(--color-primary-blue);
  color: var(--color-primary-white);
}
.page-number:hover {
  background-color: var(--color-secondary-orange);
  border-color: var(--color-secondary-orange);
}
.page-number.active {
  font-weight: bold;
  background-color: var(--color-primary-yellow);
  color: var(--color-secondary-darknavy);
  border-color: var(--color-primary-blue);
}
</style>