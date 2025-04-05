<template>
  <div class="page-container">
    <SidebarFilters>
      <template #filters>
        <!-- View Section -->
        <SidebarFilter label="View" :collapsible="false">
          <select v-model="isTableView">
            <option :value="true">Table</option>
            <option :value="false">Map</option>
          </select>
        </SidebarFilter>

        <!-- Filters Section -->
        <SidebarFilter label="Filters" :collapsible="false">
          <button @click="handleFetchCollections" class="filter-button">Apply Filters</button>
          <button @click="clearFilters" class="filter-button">Clear Filters</button>
        </SidebarFilter>

        <!-- Dynamic Field Filters -->
        <SidebarFilter
          v-for="field in filterableFields"
          :key="field.key"
          :label="field.label"
        >
          <ul>
            <li v-for="(option, index) in uniqueOptions[field.key]" :key="option + index">
              <label>
                <input type="checkbox" :value="option" v-model="selectedFilters[field.path]" />
                {{ option }}
              </label>
            </li>
          </ul>
        </SidebarFilter>

        <!-- Pagination Section -->
        <SidebarFilter label="Pagination" :collapsible="false">
          <label>
            Maximum items
            <input type="number" min="1" v-model="paginationState.userRequestedMaximumItems" :max="collections.length" style="width: 3rem;" />
          </label>
          <br />
          <label>
            Items per page
            <input type="number" min="1" max="20" v-model="paginationState.itemsPerPage" style="width: 3rem;" />
          </label>
          <br />
          <label>
            Current page
            <input type="number" min="1" :max="totalPages" v-model="displayCurrentPage" style="width: 3rem;" />
          </label>
          <button @click="resetUserPagination">Reset</button>
        </SidebarFilter>

        <!-- Random Item Section -->
        <SidebarFilter label="Random Item" :collapsible="false">
          <button @click="handleFetchRandom">Generate</button>
          <button @click="undoRandom">Show all</button>
        </SidebarFilter>
      </template>
    </SidebarFilters>

    <!-- Main Content -->
    <div class="content-area">
      <h1>Berkeley Folklore Archive</h1>
      <div class="table-container">
        <DynamicTable
          v-if="isTableView"
          :rows="paginatedCollections"
          :fields="fields"
          :onRowClick="openModal"
          :isLoading="isLoading"
        />
        <DynamicMap
          v-else
          :rows="paginatedCollections"
          :fields="fields"
          :onRowClick="openModal"
          :isLoading="isLoading"
        />
      </div>
      <div class="pagination-container" v-if="totalPages > 1">
        <div v-for="(page, index) in displayPages" :key="index">
          <span v-if="page === '...'">...</span>
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
      <FolkloreModal v-if="showModal" :collection="selectedRow" :onClose="closeModal" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from "vue";
import { useFolkloreCollections } from "@/composables/useFolkloreCollections";
import DynamicMap from "@/components/DynamicMap.vue";
import DynamicTable from "@/components/DynamicTable.vue";
import FolkloreModal from "@/components/FolkloreModal.vue";
import SidebarFilters from "@/components/SidebarFilters.vue";
import SidebarFilter from "@/components/SidebarFilter.vue";
import {
  useHandleFetchRandom,
  useHandleFetchCollections,
  useResetUserPagination,
  useUndoRandom,
  useClearFilters,
  useGoToPageIndex,
} from "@/composables/useFolkloreUtils";
import { usePagination } from "@/composables/usePagination";

export default defineComponent({
  name: "FolklorePage",
  components: {
    DynamicTable,
    DynamicMap,
    FolkloreModal,
    SidebarFilters,
    SidebarFilter,
  },
  setup() {
    const {
      collections,
      isRandomCollection,
      fields,
      selectedFilters,
      lastUsedSelectedFilters,
      paginationState,
      uniqueOptions,
      totalPages,
      paginatedCollections,
      fetchInitialCollections,
      isTableView,
      fetchRandom,
      goToPage,
      populateUniqueOptions,
    } = useFolkloreCollections();

    const filterableFields = computed(() => fields.filter((f) => f.filterable));

    const isLoading = ref(true);
    const showModal = ref(false);
    const selectedRow = ref(null);

    function openModal(row: any) {
      selectedRow.value = row;
      showModal.value = true;
    }
    function closeModal() {
      showModal.value = false;
      selectedRow.value = null;
    }

    const handleFetchRandom = useHandleFetchRandom(isLoading, fetchRandom);
    const handleFetchCollections = useHandleFetchCollections(
      selectedFilters,
      lastUsedSelectedFilters,
      isLoading,
      fetchInitialCollections,
      paginationState
    );
    const resetUserPagination = useResetUserPagination(collections, paginationState);
    const undoRandom = useUndoRandom(isLoading, isRandomCollection);
    const clearFilters = useClearFilters(selectedFilters);
    const goToPageIndex = useGoToPageIndex(isLoading, goToPage);

    // Extracted pagination logic
    const { displayCurrentPage, displayPages } = usePagination(
      paginationState,
      totalPages,
      goToPageIndex
    );

    onMounted(async () => {
      isLoading.value = true;
      try {
        await fetchInitialCollections();
        await populateUniqueOptions();
      } catch (err) {
        console.error(err);
      } finally {
        isLoading.value = false;
      }
    });

    return {
      collections,
      isRandomCollection,
      fields,
      filterableFields,
      selectedFilters,
      paginationState,
      uniqueOptions,
      totalPages,
      paginatedCollections,
      isLoading,
      isTableView,
      displayCurrentPage,
      displayPages,
      handleFetchRandom,
      handleFetchCollections,
      resetUserPagination,
      undoRandom,
      clearFilters,
      goToPageIndex,
      showModal,
      selectedRow,
      openModal,
      closeModal,
    };
  },
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  font-family: Arial, sans-serif;
  background-color: var(--color-primary-white);
  min-height: 100vh;
  padding: 1rem;
}

@media (max-width: 768px) {
  .page-container {
    flex-direction: column;
  }
  .table-container {
    width: 100%;
  }
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.table-container {
  width: 1000px;
  height: 600px;
  overflow-y: auto;
  overflow-x: auto;
  border: 2px solid var(--color-primary-blue);
  border-radius: 4px;
  margin-bottom: 1rem;
  background-color: var(--color-primary-white);
  color: var(--color-secondary-darknavy);
}

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

.filter-button {
  width: 100%;
  padding: 0.5rem;
}
</style>