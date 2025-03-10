<template>
  <div class="page-container">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div
        v-for="field of fields.filter(f => f.filterable)"
        :key="field.key"
        class="filter-section"
      >
        <h3>{{ field.label }}</h3>
        <ul>
          <li
            v-for="(option, index) in uniqueOptions[field.key]"
            :key="option + index"
          >
            <label>
              <input
                type="checkbox"
                :value="option"
                v-model="selectedFilters[field.key]"
              />
              {{ option }}
            </label>
          </li>
        </ul>
      </div>
      <div class="filter-section">
        <h3>Pagination</h3>
        <label>
              Maximum items
              <input
                type="number"
                min="1"
                v-model="paginationState.userRequestedMaximumItems"
                :max="collections.length"
                style="width: 3rem;"
              />
        </label>
        <br>
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
        />
      </div>

      <!-- Pagination, Modal, etc. -->
      <div class="pagination-container" v-if="totalPages > 1">
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
import DynamicTable from "@/components/DynamicTable.vue";
import FolkloreModal from "@/components/FolkloreModal.vue";

export default defineComponent({
  name: "FolklorePage",
  components: {
    DynamicTable,
    FolkloreModal,
  },
  setup() {
    const {
      collections,
      isNormalMode,
      fields,
      selectedFilters,
      paginationState,
      uniqueOptions,
      totalPages,
      paginatedCollections,
      fetchCollections,
      fetchInitialCollections,
      fetchRandom,
      goToPage,
    } = useFolkloreCollections();

    // Use a local state for loading
    const isLoading = ref(true);

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

    async function handleFetchRandom() {
      isLoading.value = true;
      fetchRandom();
      isLoading.value = false;
    }

    function resetUserPagination() {
      paginationState.value.userRequestedMaximumItems = collections.value.length;
      paginationState.value.itemsPerPage = 20;
      paginationState.value.currentPage = 0;
    }

    function undoRandom() {
      isLoading.value = true;
      isNormalMode.value = true;
      isLoading.value = false;
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

    function goToPageIndex(page: number | string) {
      if (typeof page === "number") {
        isLoading.value = true;
        goToPage(page - 1);
        isLoading.value = false;
      }
    }

    // Load collections on component mount
    onMounted(async () => {
      try {
        isLoading.value = true;
        await fetchInitialCollections(); // fetch data
      } finally {
        isLoading.value = false;
      }
    });

    return {
      collections,
      isNormalMode,
      fields,
      selectedFilters,
      paginationState,
      uniqueOptions,
      totalPages,
      paginatedCollections,
      fetchCollections,
      goToPage,
      displayPages,
      goToPageIndex,
      isLoading,
      resetUserPagination,
      handleFetchRandom,
      displayCurrentPage,
      undoRandom,

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