<template>
  <p>Processing login callback…</p>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useOidc } from '@/composables/useOidc';

// This component is rendered only when window.location.pathname === '/callback'
const { handleCallback } = useOidc();

onMounted(async () => {
  await handleCallback();
  // After processing the callback, remove the "/callback" path from the URL
  window.history.replaceState({}, document.title, window.location.origin);
  window.location.href = window.location.origin;
});
</script>