<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import FolklorePage from '@/views/FolklorePage.vue';
import Callback from './components/Callback.vue';
import { useOidc } from './composables/useOidc';
import PreAuth from "@/views/PreAuth.vue";

const isCallback = computed(() => window.location.pathname === '/callback');
const { isAuthenticated } = useOidc();

</script>

<template>
  <Callback v-if="isCallback" />
  <div v-else-if="!isAuthenticated">
    <PreAuth />
  </div>
  <div v-else>
    <FolklorePage />
  </div>
</template>