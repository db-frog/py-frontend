<template>
  <header class="bg-white">
    <nav class="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Global">
      <div class="flex lg:flex-1">
        <img class="h-22 w-auto" src="../assets/bfa.svg" alt="">
      </div>
      <div class="flex lg:flex-1 lg:justify-end">
        <AuthButton>Log in <span aria-hidden="true">&rarr;</span></AuthButton>
      </div>
    </nav>
  </header>

  <div class="page-container">
    <SidebarFilters>
      <template #filters>
        <!-- View Section -->
        <SidebarFilter label="View" :collapsible="false">
          <select class="bg-gray-100" v-model="isTableView" @change="async () => { if (isTableView) await fetchInitialCollections() }">
            <option :value="true" selected>Table</option>
            <option :value="false">Map</option>
          </select>
        </SidebarFilter>

        <!-- Pagination or Map Timeline Section -->
        <SidebarFilter v-if="isTableView" label="Pagination" :collapsible="false">
          <label>
            Maximum items:
            <input
              type="number"
              min="1"
              class="bg-gray-100 border-x-0 border-gray-300 text-center text-gray-900 text-md"
              v-model="paginationState.userRequestedMaximumItems"
              :max="collections.length"
            />
          </label>
          <br />
          <label>
            Items per page:
            <input
              type="number"
              min="1"
              max="20"
              v-model="paginationState.itemsPerPage"
              class="bg-gray-100 border-x-0 border-gray-300 text-center text-gray-900 text-md"
            />
          </label>
          <br />
          <label>
            Current page:
            <input
              type="number"
              min="1"
              :max="totalPages"
              v-model="displayCurrentPage"
              class="bg-gray-100 border-x-0 border-gray-300 text-center text-gray-900 text-md"
            />
          </label>
          <br />
        </SidebarFilter>
        <SidebarFilter v-else label="Timeline Configuration" :collapsible="false">
          <label>
            Start Year:
            <input
              type="number"
              min="0"
              v-model="timeState.startYear"
              :max="timeState.endYear - timeState.timeWindow"
              class="bg-gray-50 border-x-0 border-gray-300 text-center text-gray-900 text-sm"
            />
          </label>
          <br />
          <label>
            End Year:
            <input
              type="number"
              :min="timeState.startYear + timeState.timeWindow"
              v-model="timeState.endYear"
              :max="9999"
              class="bg-gray-50 border-x-0 border-gray-300 text-center text-gray-900 text-sm"
            />
          </label>
          <br />
          <label>
            Display Start Year:
            <input
              type="number"
              :min="timeState.startYear"
              :max="timeState.endYear - timeState.timeWindow"
              v-model="timeState.currentYear"
              class="bg-gray-50 border-x-0 border-gray-300 text-center text-gray-900 text-sm"
            />
          </label>
          <br />
          <label>
            Time Window (years):
            <input
              type="number"
              min="1"
              v-model="timeState.timeWindow"
              :max="9999"
              class="bg-gray-50 border-x-0 border-gray-300 text-center text-gray-900 text-sm"
            />
          </label>
        </SidebarFilter>

        <!-- Filters Section -->
        <SidebarFilter label="Filters" :collapsible="false">
          <button @click="handleFetchCollections"
          class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm w-fit py-2.5 px-2.5 text-center mb-2 me-2"
          >Apply Filters</button>
          <button @click="clearFilters"
          class="text-blue-700 hover:text-white border border-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm w-fit py-2.5 px-2.5 text-center mb-2 me-2"
          >Clear Filters</button>
        </SidebarFilter>

        <!-- Dynamic Field Filters -->
        <SidebarFilter
          v-for="field in filterableFields"
          :key="field.key"
          :label="field.label"
          :collapsible="true"
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

        <!-- Random Item Section -->
        <SidebarFilter label="Random Item" :collapsible="false">
          <button @click="handleFetchRandom"
          class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm w-fit px-5 py-2.5 me-2 mb-2">
            Generate
          </button>
          <button @click="undoRandom"
          class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm w-fit px-5 py-2.5 me-2 mb-2">
            Show all
          </button>
        </SidebarFilter>
      </template>
    </SidebarFilters>

    <!-- Main Content -->
    <div class="content-area">
      <!-- Data Container -->
      <div class="table-container">
        <!-- Table view -->
        <DynamicTable
          v-if="isTableView"
          :rows="paginatedCollections"
          :fields="fields"
          :onRowClick="openModal"
          :isLoading="isLoading"
        />
        <!-- Map view -->
        <DynamicMap
          v-else
          :getData="fetchFilteredMapData"
          :timeState="timeState"
          :reload="flipToReloadMap"
          :fields="fields"
          :onRowClick="openModal"
          :isLoading="isLoading"
        />
      </div>

      <!-- Pagination for Table View -->
      <div class="pagination-container" v-if="totalPages > 1 && isTableView">
        <div v-for="(page, index) in displayPages" :key="index">
          <span v-if="page === '...'">...</span>
          <button
            v-else
            class="page-number"
            :class="{ active: paginationState.currentPage + 1 === page }"
            @click="goToPageIndex(page)"
          >
            {{ page }}
          </button>
        </div>
      </div>

      <!-- Timeline intervals for Map View -->
      <div class="pagination-container" v-if="!isTableView">
        <div v-for="(interval, index) in displayTime" :key="index">
          <span v-if="interval[0] === '...'">...</span>
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

      <!-- Modal -->
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
  useGoToPageIndex,
} from "@/composables/useFolkloreUtils";
import { usePagination } from "@/composables/usePagination";
import AuthButton from "@/components/AuthButton.vue";

export default defineComponent({
  name: "FolklorePage",
  components: {
    AuthButton,
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

    const isLoading = ref(true);
    const showModal = ref(false);
    const selectedRow = ref(null);

    // Computed array for filterable fields
    const filterableFields = computed(() => fields.filter((f) => f.filterable));

    function openModal(row: any) {
      selectedRow.value = row;
      showModal.value = true;
    }
    function closeModal() {
      showModal.value = false;
      selectedRow.value = null;
    }

    // Handle fetching collections:
    // • If in table view, fetch paginated data.
    // • Otherwise (map view), toggle a reload flag.
    async function handleFetchCollections() {
      if (JSON.stringify(lastUsedSelectedFilters.value) === JSON.stringify(selectedFilters.value)) {
        return;
      }
      isLoading.value = true;
      if (isTableView.value) {
        await fetchInitialCollections();
      }
      flipToReloadMap.value = !flipToReloadMap.value;
      isLoading.value = false;
    }

    function resetUserTime() {
      timeState.value.startYear = 1960;
      timeState.value.endYear = new Date().getFullYear();
      timeState.value.timeWindow = 10;
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
      };
    }

    const goToPageIndex = useGoToPageIndex(isLoading, goToPage);
    const { displayCurrentPage, displayPages } = usePagination(paginationState, totalPages, goToPageIndex);

    // Computed timeline intervals for map view
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
      };

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
      return intervals.filter((p, i, arr) => JSON.stringify(p) !== JSON.stringify(arr[i - 1]));
    });

    function goToTimeIndex(year: number) {
      timeState.value.currentYear = year;
    }

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
      timeState,
      uniqueOptions,
      totalPages,
      paginatedCollections,
      isLoading,
      isTableView,
      displayCurrentPage,
      displayPages,
      displayTime,
      goToPageIndex,
      goToTimeIndex,
      fetchInitialCollections,
      fetchFilteredMapData,
      flipToReloadMap,
      handleFetchCollections,
      handleFetchRandom: useHandleFetchRandom(isLoading, fetchRandom),
      resetUserTime,
      undoRandom,
      clearFilters,
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
  flex: 1;
  display: flex;
  flex-direction: row;
  gap: 8px;
  justify-content: center;
}

.page-number {
  cursor: pointer;
  padding: 4px 8px;
  min-width: 40px; /* Ensure the button is at least 40px wide */
  text-align: center; /* Center the text inside */
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

button {
  background-color: var(--color-primary-blue);
  color: var(--color-primary-white);
}

button:hover {
  background-color: var(--color-secondary-darknavy);
  cursor: pointer;
}

</style>