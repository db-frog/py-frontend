<template>
  <!-- Desktop version -->
  <div class="sidebar desktop-filters">
    <div class="filters-container">
      <slot name="filters"></slot>
    </div>
    <div class="login-container">
      <AuthButton />
    </div>
  </div>

  <!-- Mobile version -->
  <div class="sidebar mobile-filters">
    <button @click="toggleMobile" class="toggle-button">
      Filters &amp; Login ▼
    </button>
    <transition name="fade">
      <div v-if="mobileOpen" class="mobile-dropdown">
        <div class="filters-container">
          <slot name="filters"></slot>
        </div>
        <div class="login-container">
          <AuthButton />
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import AuthButton from './AuthButton.vue';

export default defineComponent({
  name: 'SidebarFilters',
  components: { AuthButton },
  data() {
    return {
      mobileOpen: false,
    };
  },
  methods: {
    toggleMobile() {
      this.mobileOpen = !this.mobileOpen;
    },
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

/* Desktop version: visible on screens wider than 768px */
.desktop-filters {
  display: block;
  width: 250px;
  height: 700px;
  overflow-y: auto;
}

/* Mobile version: hidden by default */
.mobile-filters {
  display: none;
}

/* Media query for mobile screens */
@media (max-width: 768px) {
  .desktop-filters {
    display: none;
  }
  .mobile-filters {
    display: block;
    width: 100%;
  }
  .toggle-button {
    width: 100%;
    background-color: var(--color-secondary-light);
    padding: 0.5rem;
    border: 1px solid var(--color-primary-blue);
    border-radius: 4px;
    text-align: left;
  }
  .mobile-dropdown {
    margin-top: 0.5rem;
    border: 2px solid var(--color-primary-blue);
    border-radius: 6px;
    padding: 1rem;
    background-color: var(--color-primary-white);
    max-height: 700px;
    overflow-y: auto;
  }
}

/* Fade transition for mobile dropdown */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>