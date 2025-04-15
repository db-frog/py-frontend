<template>
  <Header />
</template>

<script lang="ts">
import Header from "@/components/Header.vue";
import {defineComponent} from "vue";
export default defineComponent({
    name: "PreAuth",
    components: {
    Header,
  }
});
</script>