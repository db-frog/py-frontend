<template>
  <div class="filter-section">
    <div class="filter-header-container">
      <span class="filter-header">{{ label }}</span>
      <button v-if="collapsible" class="expand-collapse-btn" @click="toggle">
        {{ expanded ? '[-]' : '[+]' }}
      </button>
    </div>
    <div v-if="expanded" class="filter-content">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';

export default defineComponent({
  name: 'SidebarFilter',
  props: {
    label: {
      type: String,
      required: true,
    },
    collapsible: {
      type: Boolean,
      default: true,
    },
    defaultExpanded: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const expanded = ref(props.defaultExpanded);
    const toggle = () => {
      expanded.value = !expanded.value;
    };
    return {
      expanded,
      toggle,
    };
  },
});
</script>

<style scoped>
.filter-section {
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--color-primary-blue);
  padding-bottom: 0.5rem;
  width: 100%;
}
.filter-header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.filter-header {
  margin: 0;
  color: var(--color-secondary-darknavy);
  background-color: var(--color-primary-white);
  font-weight: bold;
  position: sticky;
  top: 0;
  z-index: 1;
}
.expand-collapse-btn {
  cursor: pointer;
  color: var(--color-secondary-darknavy);
  font-weight: bold;
}
.filter-content {
  max-height: 250px;
  overflow-y: auto;
}
/* Remove bullet points from lists inside filter-content */
.filter-content ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>