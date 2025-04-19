import type { Ref } from "vue";
import { ViewMode } from "@/composables/useFolkloreCollections";
import type { FolkloreCollection } from "@/types";

export function useHandleFetchRandom(
  isLoading: Ref<boolean>,
  fetchRandom: () => Promise<void>
) {
  return async function handleFetchRandom() {
    isLoading.value = true;
    await fetchRandom();
    isLoading.value = false;
  };
}

export function useHandleFetchCollections(
  selectedFilters: Ref<any>,
  lastUsedSelectedFilters: Ref<any>,
  isLoading: Ref<boolean>,
  currentViewMode: Ref<ViewMode>,
  flipToReloadMap: Ref<boolean>,
  fetchInitialCollections: () => Promise<void>,
) {
  // Handle fetching collections:
  // • If in table view, fetch paginated data.
  // • Otherwise (map view), toggle a reload flag.
  return async function handleFetchCollections() {
    if (
      JSON.stringify(lastUsedSelectedFilters.value) ===
      JSON.stringify(selectedFilters.value)
    ) {
      return;
    }
    isLoading.value = true;
    if (currentViewMode.value == ViewMode.Table) {
      await fetchInitialCollections();
    }
    flipToReloadMap.value = !flipToReloadMap.value;
    isLoading.value = false;
  };
}

export function useResetUserPagination(
  paginationState: Ref<any>
) {
  return function resetUserPagination() {
    paginationState.value.itemsPerPage = 20;
    paginationState.value.currentPage = 0;
  };
}

export function useUndoRandom(
  isLoading: Ref<boolean>,
  isRandomCollection: Ref<boolean>
) {
  return function undoRandom() {
    isLoading.value = true;
    isRandomCollection.value = false;
    isLoading.value = false;
  };
}

export function useClearFilters(selectedFilters: Ref<any>) {
  return function clearFilters() {
    selectedFilters.value = {
      "folklore.genre": [],
      "folklore.language_of_origin": [],
      "location_collected.city": [],
      "folklore.place_mentioned.city": [],
      "cleaned_full_text": "",
    };
  };
}

export function useGoToPageIndex(
  isLoading: Ref<boolean>,
  goToPage: (page: number) => void
) {
  return function goToPageIndex(page: number | string) {
    if (typeof page === "number") {
      isLoading.value = true;
      goToPage(page - 1);
      isLoading.value = false;
    }
  };
}

export function useHandleFolderChange(
  namesPerFolder: Ref<string[][]>,
  currentFolderPath: Ref<string[]>,
) {
  return async function handleFolderChange(index: number) {
    // Cut off the folders after the changed one
    namesPerFolder.value = namesPerFolder.value.slice(0, index + 1);
    currentFolderPath.value = currentFolderPath.value.slice(0, index + 1);
    const firstEmptyIndex = currentFolderPath.value.indexOf("");
    const cleaned_folder_path = currentFolderPath.value.slice(0, firstEmptyIndex === -1 ? currentFolderPath.value.length : firstEmptyIndex);
    if (currentFolderPath.value.length >= 1 && currentFolderPath.value[currentFolderPath.value.length - 1] == "") {
      return;
    }
    // Get subfolders in the current folder
    const folder_path_str = encodeURIComponent(JSON.stringify(cleaned_folder_path));
    const dataResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/folklore/folderContents?folder_path_str=${folder_path_str}&return_elems=False`);
    if (!dataResponse.ok) throw new Error("Failed to fetch data");
    const data: string[] = await dataResponse.json();
    if (data.length == 0 || data[0] == "") {
      return;
    }
    
    namesPerFolder.value.push(data);
    currentFolderPath.value.push("");
  }
}

export function useHandleViewChange(
  currentViewMode: Ref<ViewMode>,
  fetchInitialCollections: () => Promise<void>,
  fetchInitialFolders: () => Promise<void>
) {
  return async function handleViewChange() {
    if (currentViewMode.value == ViewMode.Table) {
      await fetchInitialCollections();
    }
    if (currentViewMode.value == ViewMode.Index) {
      await fetchInitialFolders();
    }
  }
}

export function useHandleFetchIndex(
  indexCollections: Ref<FolkloreCollection[]>,
  currentFolderPath: Ref<string[]>,
) {
  return async function handleFetchIndexCollection() {
    const firstEmptyIndex = currentFolderPath.value.indexOf("");
    const cleaned_folder_path = currentFolderPath.value.slice(0, firstEmptyIndex === -1 ? currentFolderPath.value.length : firstEmptyIndex);
    const folder_path_str = encodeURIComponent(JSON.stringify(cleaned_folder_path));
    const dataResponse = await fetch(`${import.meta.env.VITE_BACKEND_API}/folklore/folderContents?folder_path_str=${folder_path_str}&return_elems=True`);
    if (!dataResponse.ok) throw new Error("Failed to fetch data");
    indexCollections.value = await dataResponse.json();
  }
}