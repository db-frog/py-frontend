<template>
  <div class="sidebar responsive-filters">
    <div class="filters-container">
      <slot name="filters"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'SidebarFilters',
  data() {
    return {
    };
  },
});
</script>

<style scoped>
.sidebar {
  border: 2px solid var(--color-primary-blue);
  border-radius: 6px;
  padding: 1rem;
  background-color: var(--color-primary-white);
}

@media (min-width: 768px) {
  .responsive-filters {
    display: block;
    width: 250px;
    height: 80vh;
    overflow-y: auto;
  }
}

</style>