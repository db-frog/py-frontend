<template>
    <header class="bg-white header-style">
    <nav class="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8" aria-label="Header">
      <div class="flex lg:flex-1">
        <img class="h-22 w-auto" src="../assets/bfa.svg" alt="Logo for Berkeley Folklore Archive">
      </div>
      <div class="flex lg:flex-1 lg:justify-end">
        <AuthButton />
      </div>
    </nav>
  </header>
</template>

<script lang="ts">
import AuthButton from "@/components/AuthButton.vue";
import {defineComponent} from "vue";
export default defineComponent({
    name: "Header",
    components: {
    AuthButton,
  }
});
</script>