import { ref, computed, watch } from "vue";
import type { FolkloreCollection } from "@/types";

/**
 * A field definition to indicate:
 *  - key: unique identifier for the field (e.g. "genre", "language_of_origin")
 *  - label: human-readable label ("Genre", "Language of Origin", etc.)
 *  - path: object path in the FolkloreCollection to read from (e.g. "folklore.genre")
 *  - filterable: whether this field is filterable (and thus appears as checkboxes in the UI)
 */
export interface FieldDefinition {
  key: string;
  label: string;
  path: string;       // Path in the FolkloreCollection object (dot notation)
  filterable?: boolean;
}

export function useFolkloreCollections() {
  // -----------------------------------
  // Reactive State
  // -----------------------------------
  const collections = ref<FolkloreCollection[]>([]);
  const randomCollections = ref<FolkloreCollection[]>([]);
  const isRandomCollection = ref<boolean>(false);
  const isTableView = ref<boolean>(true);
  const uniqueOptions = ref<Record<string, string[]>>({});

  // We'll store filters in an object: { fieldKey: string[] }
  // E.g.: { genre: ['Legend', 'Myth'], language_of_origin: ['Spanish'] }
  const selectedFilters = ref<Record<string, string[]>>({
          genre: [],
          language_of_origin: [],
          // add other filterable fields here as needed
        });
  
  const paginationState = ref<Record<string, number>>({
    userRequestedMaximumItems: 0,
    itemsPerPage: 20,
    currentPage: 0
  });

  // Define the fields we want to display/filter
  const fields: FieldDefinition[] = [
    {
      key: "contributor_name",
      label: "Contributor Name",
      path: "contributor.name",
    },
    {
      key: "age_bucket",
      label: "Contributor Age",
      path: "contributor.age_bucket",
    },
    {
      key: "gender",
      label: "Contributor Gender",
      path: "contributor.gender",
    },
    {
      key: "item",
      label: "Folklore Item",
      path: "folklore.item",
    },
    {
      key: "genre",
      label: "Genre",
      path: "folklore.genre",
      filterable: true,
    },
    {
      key: "language_of_origin",
      label: "Language of Origin",
      path: "folklore.language_of_origin",
      filterable: true,
    },
    {
      key: "collector_name",
      label: "Collector Name",
      path: "collector.name",
    },
    {
      key: "date_collected",
      label: "Date Collected",
      path: "date_collected",
    },
    {
      key: "location_collected",
      label: "Location Collected",
      path: "location_collected.city", // or a custom approach
    },
  ];

  // -----------------------------------
  // Fetching Filtered Data
  // -----------------------------------
  async function fetchInitialCollections() {
    try {
      const filtersJson = encodeURIComponent(JSON.stringify(selectedFilters.value));
      const numEntriesResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/folklore/count?filters=${filtersJson}`);
      if (!numEntriesResponse.ok) throw new Error("Failed to fetch data");
      const numEntries = await numEntriesResponse.json();
      collections.value = new Array(numEntries).fill(null);

      // Load first five pages of data
      for (let page = 1; page <= 5; page++) {
        const dataResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/folklore/paginated?page=${page}&page_size=20&filters=${filtersJson}`);
        if (!dataResponse.ok) throw new Error("Failed to fetch data");
        const data = await dataResponse.json();
        const startIndex = (page - 1) * 20;
        const endIndex = Math.min(startIndex + data.length, numEntries);
        data.forEach((entry: FolkloreCollection, index: number) => {
          const targetIndex = startIndex + index;
          if (targetIndex < endIndex) {
            collections.value[targetIndex] = entry;
          } else {
            return;
          }
        });
      }
      
      paginationState.value.currentPage = 0; // Set to first page
      paginationState.value.userRequestedMaximumItems = collections.value.length;
      isRandomCollection.value = false;
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchRandom() {
    const filtersJson = encodeURIComponent(JSON.stringify(selectedFilters.value));
    const dataResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/folklore/random?filters=${filtersJson}`);
    if (!dataResponse.ok) throw new Error("Failed to fetch data");
    const data = await dataResponse.json();
    randomCollections.value = data;
    paginationState.value.currentPage = 0; // reset to first page
    isRandomCollection.value = true;
  }

  // -----------------------------------
  // Filtering Logic
  // -----------------------------------

  // Paginated result
  const paginatedCollections = computed(() => {
    const startIndex = paginationState.value.currentPage * paginationState.value.itemsPerPage;
    const endIndex = startIndex + paginationState.value.itemsPerPage;
    const relevant_collections = isRandomCollection.value ? randomCollections.value : collections.value;
    return relevant_collections.slice(0, paginationState.value.userRequestedMaximumItems).slice(startIndex, endIndex);
  });

  // Total pages
  const totalPages = computed(() => {
    const relevant_collections = isRandomCollection.value ? randomCollections.value : collections.value;
    let entriesLength = Math.min(relevant_collections.length, paginationState.value.userRequestedMaximumItems);
    return Math.ceil(entriesLength / paginationState.value.itemsPerPage);
  });

  // -----------------------------------
  // Helpers
  // -----------------------------------
  function getNestedValue(obj: any, path: string) {
    // e.g. path = "folklore.genre"
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  }

  // Transition to a new page and fetch data if necessary
  async function goToPage(pageIndex: number) {
    paginationState.value.currentPage = pageIndex;
    if (collections.value[pageIndex * paginationState.value.itemsPerPage] == null) {
      const filtersJson = encodeURIComponent(JSON.stringify(selectedFilters.value));
      const path = `${import.meta.env.VITE_BACKEND_API}/folklore/paginated?page=${pageIndex}&page_size=${paginationState.value.itemsPerPage}&filters=${filtersJson}`;
      const dataResponse = await fetch(path);
      if (!dataResponse.ok) throw new Error("Failed to fetch data");
      const data = await dataResponse.json();
      data.forEach((entry: FolkloreCollection, index: number) => {
        let i : number = pageIndex * paginationState.value.itemsPerPage + index;
        if (i >= collections.value.length) {
          return;
        }
        collections.value[i] = entry;
      });
    }
  }

  async function populateUniqueOptions() {
    if (Object.keys(uniqueOptions.value).length != 0) {
      return;
    }
    const dataResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/folklore/filters`);
    if (!dataResponse.ok) throw new Error("Failed to fetch filters");
    const endpointResult = await dataResponse.json();
    const final: Record<string, string[]> = {};
    for (const key of Object.keys(endpointResult)) {
      final[key] = endpointResult[key].sort();
    }
    uniqueOptions.value = final;
  }

  // Reset page when filters change
  watch(
    selectedFilters,
    () => {
      fetchInitialCollections();
      paginationState.value.currentPage = 0;
    },
    { deep: true }
  );

  // -----------------------------------
  // Return from composable
  // -----------------------------------
  return {
    // Data
    collections,
    randomCollections,
    isRandomCollection,
    fields,
    selectedFilters,
    paginationState,
    uniqueOptions,
    isTableView,

    // Computed
    paginatedCollections,
    totalPages,

    // Methods
    fetchInitialCollections,
    fetchRandom,
    goToPage,
    populateUniqueOptions,
  };
}