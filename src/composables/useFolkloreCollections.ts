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

  // We'll store filters in an object: { fieldKey: string[] }
  // E.g.: { genre: ['Legend', 'Myth'], language_of_origin: ['Spanish'] }
  const selectedFilters = ref<Record<string, string[]>>({
          genre: [],
          language_of_origin: [],
          // add other filterable fields here as needed
        });

  const currentPage = ref(0);
  const itemsPerPage = ref(20);

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
  // Fetching Data
  // -----------------------------------
  async function fetchCollections() {
    try {
      let path = "/api/folklore/";
      const response = await fetch(path);
      if (!response.ok) throw new Error("Failed to fetch data");
      collections.value = await response.json();
      currentPage.value = 0; // reset to first page
    } catch (err) {
      console.error(err);
    }
  }

  // -----------------------------------
  // Filtering Logic
  // -----------------------------------
  // 1) Identify unique options for each filterable field
  const uniqueOptions = computed(() => {
    // Build an object: { fieldKey: Set<string> }
    const result: Record<string, Set<string>> = {};

    // Initialize sets for each filterable field
    fields
      .filter((f) => f.filterable)
      .forEach((f) => {
        result[f.key] = new Set();
      });

    // Populate sets by reading the path on each collection
    collections.value.forEach((col) => {
      fields
        .filter((f) => f.filterable)
        .forEach((f) => {
          const val = getNestedValue(col, f.path);
          if (val) {
            result[f.key].add(String(val));
          }
        });
    });

    // Convert each set to a sorted array
    const final: Record<string, string[]> = {};
    for (const key of Object.keys(result)) {
      final[key] = Array.from(result[key]).sort();
    }
    return final;
  });

  // 2) Apply filters: For each field, if selectedFilters[field].length > 0,
  //    we only keep items matching that field's value.
  const filteredCollections = computed(() => {
    return collections.value.filter((col) => {
      let matchesAll = true;
      // Check each filterable field's selections
      for (const f of fields.filter((x) => x.filterable)) {
        const filterValues = selectedFilters.value[f.key] || [];
        if (filterValues.length === 0) continue; // no filter for this field

        const val = getNestedValue(col, f.path);
        if (!val || !filterValues.includes(String(val))) {
          matchesAll = false;
          break;
        }
      }
      return matchesAll;
    });
  });

  // 3) Paginated result
  const paginatedCollections = computed(() => {
    const startIndex = currentPage.value * itemsPerPage.value;
    const endIndex = startIndex + itemsPerPage.value;
    return filteredCollections.value.slice(startIndex, endIndex);
  });

  // 4) Total pages
  const totalPages = computed(() => {
    return Math.ceil(filteredCollections.value.length / itemsPerPage.value);
  });

  // -----------------------------------
  // Helpers
  // -----------------------------------
  function getNestedValue(obj: any, path: string) {
    // e.g. path = "folklore.genre"
    return path.split(".").reduce((acc, part) => acc?.[part], obj);
  }

  function goToPage(pageIndex: number) {
    currentPage.value = pageIndex;
  }

  // Reset page when filters change
  watch(
    selectedFilters,
    () => {
      currentPage.value = 0;
    },
    { deep: true }
  );

  // -----------------------------------
  // Return from composable
  // -----------------------------------
  return {
    // Data
    collections,
    fields,
    selectedFilters,
    uniqueOptions,
    currentPage,
    itemsPerPage,

    // Computed
    filteredCollections,
    paginatedCollections,
    totalPages,

    // Methods
    fetchCollections,
    goToPage,
    getNestedValue,
  };
}