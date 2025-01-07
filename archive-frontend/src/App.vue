<!-- src/App.vue -->
<template>
  <FolklorePage />
</template>

<script lang="ts">
import { defineComponent } from "vue";
import FolklorePage from "@/views/FolklorePage.vue";

export default defineComponent({
  name: "App",
  components: {
    FolklorePage,
  },
});
</script>

<style>
/* Optional global styles */
html, body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}
</style>