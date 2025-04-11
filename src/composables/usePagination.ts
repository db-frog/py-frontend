import { computed } from "vue";
import type { Ref } from "vue";

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  userRequestedMaximumItems: number;
}

export function usePagination(
  paginationState: Ref<PaginationState>,
  totalPages: Ref<number>,
  goToPageIndex: (page: number | string) => void
) {
  const displayCurrentPage = computed({
    get: () => paginationState.value.currentPage + 1,
    set: (page: number) => goToPageIndex(page),
  });

  const displayPages = computed(() => {
    const total = totalPages.value;
    const current = paginationState.value.currentPage + 1;
    const pages: (number | string)[] = [];

    if (total <= 5) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1, 2);
    if (current > 4) pages.push("...");
    const start = Math.max(3, current - 1);
    const end = Math.min(total - 2, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 3) pages.push("...");
    pages.push(total - 1, total);

    return pages.filter((p, i, arr) => p !== arr[i - 1]);
  });

  return { displayCurrentPage, displayPages };
}