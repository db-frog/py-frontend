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
  fetchFolderContents: (folderPath: string[]) => Promise<string[]>
) {
  return async function handleFolderChange(index: number) {
    // truncate history
    namesPerFolder.value = namesPerFolder.value.slice(0, index + 1);
    currentFolderPath.value = currentFolderPath.value.slice(0, index + 1);

    // compute cleaned path
    const fp = currentFolderPath.value;
    const firstEmpty = fp.indexOf("");
    const cleaned = fp.slice(0, firstEmpty === -1 ? fp.length : firstEmpty);

    // nothing to do if last slot is blank
    if (fp.length > 0 && fp[fp.length - 1] === "") return;

    // fetch subfolders from upstream
    const subfolders = await fetchFolderContents(cleaned);

    if (subfolders.length === 0 || subfolders[0] === "") return;
    namesPerFolder.value.push(subfolders);
    currentFolderPath.value.push("");
  };
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
  fetchIndexCollectionsForFolder: (folderPath: string[]) => Promise<FolkloreCollection[]>
) {
  return async function handleFetchIndexCollection() {

    const fp = currentFolderPath.value;
    const firstEmpty = fp.indexOf("");
    const cleaned = fp.slice(0, firstEmpty === -1 ? fp.length : firstEmpty);

    // fetch full objects from upstream
    const items = await fetchIndexCollectionsForFolder(cleaned);
    indexCollections.value = items;
  };
}