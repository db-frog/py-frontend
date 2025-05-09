import { ref, computed, watch } from "vue";
import type { FolkloreCollection } from "@/types";
import type { PaginationState } from "@/composables/usePagination.ts";
import { useOidc } from "@/composables/useOidc.ts";

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
  hidden?: boolean;
  showMobile?: boolean;
}

export enum ViewMode { Table, Index, Map }

export function useFolkloreCollections() {
  // -----------------------------------
  // User/Authentication Integration
  // -----------------------------------
  // Import the user info from your useOidc composable
  const { signOut } = useOidc();

  // Encodes the filters object as a URL-encoded JSON string.
  const encodeFilters = (filters: Record<string, any>): string => {
    return encodeURIComponent(JSON.stringify(filters));
  };

  // Fetch helper ensuring cookies are included.
  const fetchWithAuth = (url: string, init: RequestInit = {}): Promise<Response> => {
    return fetch(url, {...init, credentials: 'include'}).then(function (response) {
      if (response.ok) {
        return response;
      } else {
        // If we receive an access forbidden response, redirect to sign out
        if (response.status === 401)
          console.log("Signed out due to inactivity")
          signOut()
          return response;
      }
    })
  };

  // -----------------------------------
  // Reactive State
  // -----------------------------------
  const collections = ref<FolkloreCollection[]>([]);
  const randomCollections = ref<FolkloreCollection[]>([]);
  const isRandomCollection = ref<boolean>(false);
  const indexCollections = ref<FolkloreCollection[]>([]);
  const currentViewMode = ref<ViewMode>(ViewMode.Table);
  const currentFolderPath = ref<string[]>([""]);
  const namesPerFolder = ref<string[][]>([[]]);
  const uniqueOptions = ref<Record<string, string[]>>({});

  const selectedFilters = ref<Record<string, string[] | string>>({
          "folklore.genre": [],
          "folklore.language_of_origin": [],
          "location_collected.city": [],
          "folklore.place_mentioned.city": [],
          // add other filterable fields here as needed
          "cleaned_full_text": "",
        });
  const appliedFilters = ref<Record<string, any>>(
    JSON.parse(JSON.stringify(selectedFilters.value))
  );

  // To prevent repeat API calls with same filters as last call's
  const lastUsedSelectedFilters = ref<Record<string, string[] | string>>();
  // This is a workaround for the map to re-render when filters change. Value doesn't matter.
  const flipToReloadMap = ref(false);
  
  // For table view
  const paginationState = ref<PaginationState>({
    currentPage: 0,
    itemsPerPage: 20
  });

  // For map view
  const timeState = ref<Record<string, number>>({
    startYear: 1960,
    endYear: new Date().getFullYear(),
    timeWindow: 10,
    currentYear: 1960,
  });

  // Define the fields we want to display/filter
  const fields: FieldDefinition[] = [
    {
      key: "item",
      label: "Item of Folklore",
      path: "folklore.item",
      showMobile: true,
    },
    {
      key: "genre",
      label: "Genre",
      path: "folklore.genre",
      filterable: true,
      showMobile: false,
    },
    {
      key: "language_of_origin",
      label: "Language of Origin",
      path: "folklore.language_of_origin",
      filterable: true,
      showMobile: false,
    },
    {
      key: "date_collected",
      label: "Date Collected",
      path: "date_collected",
      showMobile: false,
    },
    {
      key: "location_collected",
      label: "Location Collected",
      path: "location_collected.city", // or a custom approach
      filterable: true,
      showMobile: false,
    },
    {
      key: "place_mentioned",
      label: "City Mentioned",
      path: "folklore.place_mentioned.city",
      filterable: true,
      hidden: true,
      showMobile: false,
    },
  ];

  // -----------------------------------
  // Fetching Filtered Data
  // -----------------------------------
  async function fetchInitialCollections() {
    try {
      const filtersJson = encodeFilters(selectedFilters.value);
      const countUrl = `${import.meta.env.VITE_BACKEND_API}/folklore/count?filters=${filtersJson}`;

      const numEntriesResponse = await fetchWithAuth(countUrl);

      if (!numEntriesResponse.ok) throw new Error("Failed to fetch data");
      const numEntries = await numEntriesResponse.json();
      collections.value = new Array(numEntries).fill(null);

      // Load first five pages of data
      for (let page = 1; page <= 5; page++) {
        const pageUrl = `${import.meta.env.VITE_BACKEND_API}/folklore/paginated?page=${page}&page_size=20&filters=${filtersJson}`;
        const dataResponse = await fetchWithAuth(pageUrl);
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
      lastUsedSelectedFilters.value = JSON.parse(JSON.stringify(selectedFilters.value)); // deepcopy
      isRandomCollection.value = false;
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchFilteredMapData() {
    const filtersJson = encodeFilters(selectedFilters.value);
    const url = `${import.meta.env.VITE_BACKEND_API}/folklore/?filters=${filtersJson}`;
    const dataResponse = await fetchWithAuth(url);
    if (!dataResponse.ok) throw new Error("Failed to fetch data");
    return await dataResponse.json();
}

  async function fetchRandom() {
    let dataResponse;
    // Pass folder path for index view, filters for map / table view
    if (currentViewMode.value == ViewMode.Index) {
      // Remove empty strings from currentFolderPath
      const firstEmptyIndex = currentFolderPath.value.indexOf("");
      const cleaned_folder_path = currentFolderPath.value.slice(0, firstEmptyIndex === -1 ? currentFolderPath.value.length : firstEmptyIndex);
      const folder_path_str = encodeURIComponent(JSON.stringify(cleaned_folder_path));
      dataResponse = await fetchWithAuth(`${import.meta.env.VITE_BACKEND_API}/folklore/random?folder_path_str=${folder_path_str}`);
    } else {
      const filtersJson = encodeURIComponent(JSON.stringify(selectedFilters.value));
      dataResponse = await fetchWithAuth(`${import.meta.env.VITE_BACKEND_API}/folklore/random?filters=${filtersJson}`);
    }

    if (!dataResponse.ok) throw new Error("Failed to fetch data");
    const data = await dataResponse.json();
    randomCollections.value = data;
    paginationState.value.currentPage = 0; // reset to first page
    isRandomCollection.value = true;
  }

  async function fetchFolderContents(cleanedFolderPath: string[]): Promise<string[]> {
    const folder_path_str = encodeURIComponent(JSON.stringify(cleanedFolderPath));
    const url = `${import.meta.env.VITE_BACKEND_API}/folklore/folderContents`
              + `?folder_path_str=${folder_path_str}&return_elems=False`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error("Failed to fetch folder contents");
    return await res.json();
  }

  async function fetchIndexCollectionsForFolder(
    cleanedFolderPath: string[]
  ): Promise<FolkloreCollection[]> {
    const folder_path_str = encodeURIComponent(JSON.stringify(cleanedFolderPath));
    const url = `${import.meta.env.VITE_BACKEND_API}/folklore/folderContents`
              + `?folder_path_str=${folder_path_str}&return_elems=True`;
    const res = await fetchWithAuth(url);
    if (!res.ok) throw new Error("Failed to fetch index collections");
    return await res.json();
  }

  async function fetchInitialFolders() {
    appliedFilters.value = JSON.parse(JSON.stringify(selectedFilters.value));
    const dataResponse = await fetchWithAuth(`${import.meta.env.VITE_BACKEND_API}/folklore/folderContents?return_elems=False`);
    if (!dataResponse.ok) throw new Error("Failed to fetch data");
    const data : string[] = await dataResponse.json();
    namesPerFolder.value = [data];
  }

  // -----------------------------------
  // Filtering Logic
  // -----------------------------------

  // Paginated result
  const paginatedCollections = computed(() => {
    const startIndex = paginationState.value.currentPage * paginationState.value.itemsPerPage;
    const endIndex = startIndex + paginationState.value.itemsPerPage;
    const relevant_collections = isRandomCollection.value ? randomCollections.value : collections.value;
    return relevant_collections.slice(startIndex, endIndex);
  });

  // Total pages
  const totalPages = computed(() => {
    const relevant_collections = isRandomCollection.value ? randomCollections.value : collections.value;
    return Math.ceil(relevant_collections.length / paginationState.value.itemsPerPage);
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
      const filtersJson = encodeFilters(selectedFilters.value);
      const url = `${import.meta.env.VITE_BACKEND_API}/folklore/paginated?page=${pageIndex}&page_size=${paginationState.value.itemsPerPage}&filters=${filtersJson}`;
      const dataResponse = await fetchWithAuth(url);
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
    let field_to_path_dict : Record<string, string> = {};
    fields.forEach((field_info) => {
      if (field_info.filterable) {
        field_to_path_dict[field_info.key] = field_info.path;
      }
    });
    const field_to_path_str = encodeURIComponent(JSON.stringify(field_to_path_dict));
    const url = `${import.meta.env.VITE_BACKEND_API}/folklore/filters?field_to_path=${field_to_path_str}`;
    const dataResponse = await fetchWithAuth(url);
    if (!dataResponse.ok) throw new Error("Failed to fetch filters");
    const endpointResult = await dataResponse.json();
    const final: Record<string, string[]> = {};
    for (const key of Object.keys(endpointResult)) {
      final[key] = Array.from(new Set<string>(endpointResult[key])).sort();
    }
    uniqueOptions.value = final;
  }

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
    appliedFilters,
    lastUsedSelectedFilters,
    uniqueOptions,
    currentViewMode,
    // Table View Data
    paginationState,
    // Map View Data
    timeState,
    flipToReloadMap,
    // Index View Data
    namesPerFolder,
    currentFolderPath,
    indexCollections,

    // Computed
    paginatedCollections,
    totalPages,

    // Methods
    fetchInitialCollections,
    fetchInitialFolders,
    fetchRandom,
    fetchFilteredMapData,
    goToPage,
    populateUniqueOptions,
    fetchFolderContents,
    fetchIndexCollectionsForFolder,
  };
}