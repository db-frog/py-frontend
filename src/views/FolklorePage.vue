<template>
  <Header />
  <div class="page-container">
    <button
        @click="showFilters = !showFilters"
        v-show="!isDesktop"
        class="md:hidden p-2 m-2 bg-blue-600 text-white rounded"
        aria-label="Show or Hide filters on mobile"
    >
      {{ showFilters ? 'Hide Filters' : 'Show Filters' }}
    </button>

    <div class="sidebar-filters" v-show="showFilters || isDesktop">
      <h1 class="hidden"> Filters: </h1>
      <SidebarFilters>
        <template #filters>
          <!-- View Section -->
          <SidebarFilter label="View" :collapsible="false">
            <label>
              View:
              <select class="bg-gray-100" v-model="currentViewMode" @change="async () => await handleViewChange()">
                <option :value="ViewMode.Table" selected>Table</option>
                <option :value="ViewMode.Map">Map</option>
                <option :value="ViewMode.Index">Index</option>
              </select>
            </label>
          </SidebarFilter>


          <!-- Random Item Section -->
          <SidebarFilter label="Random Item" :collapsible="false" v-if="currentViewMode != ViewMode.Map">
            <button @click="handleFetchRandom"
                    class="text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-lg text-sm w-fit px-5 py-2.5 me-2 mb-2"
                    aria-label="Populate the table with a random folklore item">
              Generate
            </button>
          </SidebarFilter>

          <SidebarFilter v-if="currentViewMode == ViewMode.Map" label="Timeline Configuration" :collapsible="false">
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
          <SidebarFilter v-if="currentViewMode == ViewMode.Index" label="Folder" :collapsible="false">
            <label v-for="(folderNames, index) in namesPerFolder" :key="index">
              <select class="bg-gray-100 block mt-2" v-model="currentFolderPath[index]" @change="async () => await handleFolderChange(index)">
                <option selected value="">Select</option>
                <option v-for="folder_name in folderNames" :key="folder_name" :value="folder_name">
                  {{ folder_name }}
                </option>
              </select>
            </label>
            <button @click="() => handleApplyFilters(handleFetchCollections, handleFetchIndex)"
                    class="text-blue-700 hover:text-white border hover:bg-blue-800 font-medium rounded-lg text-sm w-fit py-2.5 px-2.5 my-2 text-center mb-2 me-2"
                    aria-label="Fetch Selected Folder"
            >Fetch Folder</button>
          </SidebarFilter>

          <!-- Filters Section -->
          <SidebarFilter :collapsible="true" label="Text Search" :default-expanded="true" v-if="currentViewMode != ViewMode.Index">
            <div>
              <input type="text"
                     aria-label="Text search"
                     v-model="selectedFilters['cleaned_full_text']"
                     v-on:keyup.enter="handleApplyFilters(handleFetchCollections, handleFetchIndex)"
                     class="bg-gray-100 border-x-0 border-gray-300 w-full text-center text-gray-900 text-md">
            </div>
          </SidebarFilter>

          <!-- Dynamic Field Filters -->
          <SidebarFilter
                v-if="currentViewMode != ViewMode.Index"
                v-for="field in filterableFields"
                :key="field.key"
                :label="field.label"
                :collapsible="true"
                :defaultExpanded="false">
            <ul>
              <li v-for="(option, index) in uniqueOptions[field.key]" :key="option + index">
                <label>
                  <input type="checkbox" aria-label={{field.label}} :value="option" v-model="selectedFilters[field.path]" />
                  {{ option }}
                </label>
              </li>
            </ul>
          </SidebarFilter>

          <SidebarFilter class="sticky bottom-0 bg-white z-10" :collapsible="false" v-if="currentViewMode != ViewMode.Index" label="">
            <button @click="() => handleApplyFilters(handleFetchCollections, handleFetchIndex)"
                    class="text-blue-700 hover:text-white border hover:bg-blue-800 font-medium rounded-lg text-sm w-full py-2.5 px-2.5 my-2 text-center mb-2 me-2"
                    aria-label="Apply Selected Filters"
            >Apply Filters</button>
            <button @click="() => clearFilters()"
                    class="text-blue-700 hover:text-white border hover:bg-blue-800 font-medium rounded-lg text-sm w-full py-2.5 px-2.5 text-center mb-2 me-2"
                    aria-label="Clear Filters"
            >Clear Filters</button>
          </SidebarFilter>
      </template>
    </SidebarFilters>
    </div>

    <!-- Main Content -->
    <div class="content-area">
      <h1 class="hidden"> Table: </h1>
      <h2 class="hidden"> Current Filters on Table: </h2>
      <div
        v-if="(activeChips.length) && (currentViewMode != ViewMode.Index)"
        class="chip-bar mb-4 overflow-x-auto whitespace-nowrap px-2"
      >
        <span
          v-for="chip in activeChips"
          :key="chip.id"
          class="inline-flex items-center bg-gray-200 rounded-full px-3 py-1 mx-0.5 text-sm"
        >
          <span class="mr-2">{{ chip.label }}: {{ chip.value }}</span>
          <span
            @click="removeChip(chip)"
            class="text-gray-600 hover:text-gray-800 hover:cursor-pointer font-bold focus:outline-none"
            aria-label="Remove this filter"
          >×</span>
        </span>
      </div>
      <!-- Data Container -->
      <div class="table-container">
        <!-- Table view -->
        <DynamicTable
            v-if="currentViewMode == ViewMode.Table"
            :rows="paginatedCollections"
            :fields="fields"
            :onRowClick="openModal"
            :isLoading="isLoading"
            :caption="folkloreCaptionFilters"
        />
        <!-- Map view -->
        <DynamicMap
          v-if="currentViewMode == ViewMode.Map"
          :getData="fetchFilteredMapData"
          :timeState="timeState"
          :reload="flipToReloadMap"
          :fields="fields"
          :onRowClick="openModal"
          :isLoading="isLoading"
        />
        <!-- Index view -->
        <DynamicTable
          v-if="currentViewMode == ViewMode.Index"
          :rows="indexDisplayCollection"
          :fields="fields"
          :onRowClick="openModal"
          :isLoading="isLoading"
          :caption="folkloreCaptionIndex"
        />
      </div>

      <!-- Pagination for Table View -->
      <div class="pagination-container" v-if="currentViewMode == ViewMode.Table">
        <div>
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
        </div>
        <div v-if="totalPages > 1" v-for="(page, index) in displayPages" :key="index">
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
      <div class="pagination-container" v-if="currentViewMode == ViewMode.Map" aria-labelledby="pagination">
        <h2 id="pagination" class="hidden">Pagination</h2>
        <div v-for="(interval, index) in displayTime" :key="index">
          <span v-if="interval[0] === '...'">...</span>
          <button
              v-else
              class="page-number"
              :class="{ active: timeState.currentYear === interval[0] }"
              @click="goToTimeIndex(Number(interval[0]))"
          >
            {{ interval[0] }} - {{ interval[1] }}
          </button>
        </div>
      </div>

      <!-- Modal -->
      <FolkloreModal v-if="showModal" :collection="selectedRow" :onClose="closeModal" />
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, computed, ref, onMounted, onUnmounted} from "vue";
import { useFolkloreCollections, ViewMode } from "@/composables/useFolkloreCollections";
import DynamicMap from "@/components/DynamicMap.vue";
import DynamicTable from "@/components/DynamicTable.vue";
import FolkloreModal from "@/components/FolkloreModal.vue";
import SidebarFilters from "@/components/SidebarFilters.vue";
import SidebarFilter from "@/components/SidebarFilter.vue";
import {
  useHandleFetchRandom,
  useGoToPageIndex,
  useClearFilters,
  useHandleFetchCollections,
  useHandleFolderChange,
  useHandleViewChange,
  useHandleFetchIndex,
} from "@/composables/useFolkloreUtils";
import { usePagination } from "@/composables/usePagination";
import Header from "@/components/Header.vue";

export default defineComponent({
  name: "FolklorePage",
  components: {
    Header,
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
      randomCollections,
      indexCollections,
      fields,
      selectedFilters,
      appliedFilters,
      flipToReloadMap,
      lastUsedSelectedFilters,
      paginationState,
      timeState,
      uniqueOptions,
      totalPages,
      paginatedCollections,
      fetchInitialCollections,
      fetchFilteredMapData,
      fetchInitialFolders,
      fetchFolderContents,
      fetchIndexCollectionsForFolder,
      currentViewMode,
      fetchRandom,
      goToPage,
      populateUniqueOptions,
      namesPerFolder,
      currentFolderPath,
    } = useFolkloreCollections();

    const isLoading = ref(true);
    const showModal = ref(false);
    const showFilters = ref(false);
    const isDesktop  = ref(window.innerWidth >= 768);
    const selectedRow = ref(undefined);
    const folkloreCaptionFilters = "Items of Folklore Matching Selected Filters"
    const folkloreCaptionIndex = "Items of Folklore Matching Selected Index Categories"

    const handleFetchCollections = useHandleFetchCollections(
      selectedFilters,
      lastUsedSelectedFilters,
      isLoading,
      currentViewMode,
      flipToReloadMap,
      fetchInitialCollections
    )
    const handleFetchIndex = useHandleFetchIndex(
      indexCollections,
      currentFolderPath,
      fetchIndexCollectionsForFolder
    )

    function onResize() {
      isDesktop.value = window.innerWidth >= 768;
    }

    // Computed array for filterable fields
    const filterableFields = computed(() => fields.filter((f) => f.filterable));

    const activeChips = computed(() => {
      const filters = appliedFilters.value as Record<string, any>;
      const chips: Array<{ id: string; label: string; value: string; path: string }> = [];

      // text‐search chip
      const txt = (filters.cleaned_full_text as string) || "";
      if (txt.trim()) {
        chips.push({
          id: "cleaned_full_text",
          label: "Text",
          value: txt,
          path: "cleaned_full_text",
        });
      }

      // one chip per checked box
      filterableFields.value.forEach((f) => {
        const arr = (filters[f.path] as string[]) || [];
        arr.forEach((v) => {
          chips.push({
            id: `${f.key}-${v}`,
            label: f.label,
            value: v,
            path: f.path,
          });
        });
      });

      return chips;
    });
  function removeChip(chip: { path: string; value: string }) {
      const filters = appliedFilters.value;

      if (chip.path === "cleaned_full_text") {
        filters.cleaned_full_text = "";
      } else {
        filters[chip.path] = (filters[chip.path] as string[]).filter(
          (x) => x !== chip.value
        );
      }

      selectedFilters.value = JSON.parse(JSON.stringify(appliedFilters.value));

      if (currentViewMode.value === ViewMode.Index) {
        handleFetchIndex();
      } else {
        handleFetchCollections();
      }
    }

    function openModal(row: any) {
      selectedRow.value = row;
      showModal.value = true;
    }

    function closeModal() {
      showModal.value = false;
      selectedRow.value = undefined;
    }

    async function handleApplyFilters(fetchCollections: () => Promise<void>, fetchIndexCollections: () => Promise<void>) {
      isRandomCollection.value = false;
      appliedFilters.value = JSON.parse(JSON.stringify(selectedFilters.value));
      if (currentViewMode.value == ViewMode.Index) {
        await fetchIndexCollections();
      } else {
        await fetchCollections();
      }
    }
  
    const indexDisplayCollection = computed(() => {
      if (isRandomCollection.value) {
        return randomCollections.value;
      }
      return indexCollections.value;
    });

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
      window.addEventListener('resize', onResize);
      try {
        await fetchInitialCollections();
        await populateUniqueOptions();
        await fetchInitialFolders();
      } catch (err) {
        console.error(err);
      } finally {
        isLoading.value = false;
      }
    });

    onUnmounted(() => {
      window.removeEventListener('resize', onResize);
    });

    return {
      collections,
      indexCollections,
      indexDisplayCollection,
      isRandomCollection,
      fields,
      filterableFields,
      activeChips,
      removeChip,
      selectedFilters,
      paginationState,
      timeState,
      uniqueOptions,
      totalPages,
      paginatedCollections,
      isLoading,
      folkloreCaptionIndex,
      folkloreCaptionFilters,
      currentViewMode,
      namesPerFolder,
      currentFolderPath,
      displayCurrentPage,
      displayPages,
      displayTime,
      goToPageIndex,
      goToTimeIndex,
      fetchInitialCollections,
      fetchInitialFolders,
      fetchFilteredMapData,
      handleApplyFilters,
      flipToReloadMap,
      handleFetchCollections,
      handleFetchRandom: useHandleFetchRandom(isLoading, fetchRandom),
      handleFolderChange: useHandleFolderChange(namesPerFolder, currentFolderPath, fetchFolderContents),
      handleViewChange: useHandleViewChange(currentViewMode, fetchInitialFolders, fetchInitialCollections),
      handleFetchIndex,
      clearFilters: useClearFilters(selectedFilters),
      showModal,
      showFilters,
      isDesktop,
      selectedRow,
      openModal,
      closeModal,
      ViewMode,
    };
  },
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  background-color: var(--color-primary-white);
  max-height: 100vh;
  padding: 1rem;
}

@media (max-width: 768px) {
  .page-container {
    flex-direction: column;
    gap: 0;
  }
}

.content-area {
  flex: 1;
  width: 1000px;
  display: flex;
  flex-direction: column;
}

.table-container {
  height: 70vh;
  overflow-y: auto;
  overflow-x: auto;
  border: 2px solid var(--color-primary-blue);
  border-radius: 4px;
  margin-bottom: 1rem;
  background-color: var(--color-primary-white);
  color: var(--color-secondary-darknavy);
}

@media (max-width: 768px) {
  .content-area {
    width: 100%;
  }

  .table-container {
    width: 100%;
    margin: 20px auto 20px auto;
  }
}

.pagination-container {
  flex: 1;
  display: flex;
  height: 10vh;
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
}

.page-number.active {
  font-weight: bold;
  background-color: var(--color-primary-yellow);
  color: var(--color-secondary-darknavy);
  border-color: var(--color-primary-blue);
}

.chip-bar::-webkit-scrollbar {
  height: 6px;
}
.chip-bar::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.2);
  border-radius: 3px;
}

button {
  background-color: var(--color-primary-blue);
  color: var(--color-primary-yellow);
  border-color: var(--color-secondary-darknavy)
}

button:hover {
  background-color: var(--color-secondary-darknavy);
  cursor: pointer;
}

</style>