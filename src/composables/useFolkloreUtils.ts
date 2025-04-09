import type { Ref } from "vue";

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
  fetchInitialCollections: () => Promise<void>,
  paginationState: Ref<any>
) {
  return async function handleFetchCollections() {
    if (
      JSON.stringify(lastUsedSelectedFilters.value) ===
      JSON.stringify(selectedFilters.value)
    ) {
      return;
    }
    isLoading.value = true;
    await fetchInitialCollections();
    paginationState.value.currentPage = 0;
    isLoading.value = false;
  };
}

export function useResetUserPagination(
  collections: Ref<any[]>,
  paginationState: Ref<any>
) {
  return function resetUserPagination() {
    paginationState.value.userRequestedMaximumItems = collections.value.length;
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