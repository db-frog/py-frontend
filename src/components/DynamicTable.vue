<template>
  <table class="dynamic-table">
    <caption class="hidden"> {{ caption }} </caption>
    <thead class="bg-gray-200">
      <tr>
        <!-- Render each field as a header -->
        <th v-for="field of fields.filter(f => !f.hidden)"
            :key="field.key"
            :class="{ 'hide-mobile': field.showMobile === false }"
        >
          {{ field.label }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="(row, rowIndex) in rows"
        :key="rowIndex"
        @click="onRowClick(row)"
        class="odd:bg-white even:bg-gray-50 hover:bg-gray-50"
      >
        <!-- Render each field cell -->
        <td
          v-for="field of fields.filter(f => !f.hidden)"
          :key="field.key"
          :class="{ 'hide-mobile': field.showMobile === false }"
        >
          {{ getNestedValue(row, field.path) }}
        </td>
      </tr>
    </tbody>
  </table>
  <div v-if="isLoading">
      Loading...
  </div>
  <div v-else-if="rows.length === 0">
    <p>No collections matching these filters</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { PropType } from "vue"
import type { FieldDefinition } from "@/composables/useFolkloreCollections";

export default defineComponent({
  name: "DynamicTable",
  props: {
    rows: {
      type: Array as PropType<any[]>,
      default: () => [],
    },
    fields: {
      type: Array as PropType<FieldDefinition[]>,
      default: () => [],
    },
    onRowClick: {
      type: Function as PropType<(row: any) => void>,
      default: () => {},
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    caption: {
      type: String,
      default: ""
    },
  },
  methods: {
    getNestedValue(obj: any, path: string) {
      return path.split(".").reduce((acc, part) => acc?.[part], obj);
    },
  },
});
</script>

<style scoped>
.dynamic-table {
  width: 100%;
  border-collapse: collapse;
}
.dynamic-table thead {
  position: sticky;
  top: 0;
  z-index: 1;
}
.dynamic-table th,
.dynamic-table td {
  border: 1px solid #ccc;
  padding: 0.75rem;
  overflow: hidden;
}

.dynamic-table tbody tr {
  cursor: pointer;
}
.dynamic-table tbody tr:hover {
  background-color: #f0f0f0;
}

@media (max-width: 767px) {
  .hide-mobile {
    display: none;
  }
}

</style>