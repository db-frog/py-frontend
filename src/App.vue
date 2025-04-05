<script lang="ts" setup>
import { computed, onMounted } from 'vue';
import FolklorePage from '@/views/FolklorePage.vue';
import AuthButton from './components/AuthButton.vue';
import Callback from './components/Callback.vue';
import { useOidc } from './composables/useOidc';

const isCallback = computed(() => window.location.pathname === '/callback');
const { isAuthenticated, currentUser, loadUser } = useOidc();

onMounted(() => {
  if (!isCallback.value) loadUser();
});
</script>

<template>
  <Callback v-if="isCallback" />
  <div>
    <AuthButton />
    <FolklorePage />
  </div>
</template>