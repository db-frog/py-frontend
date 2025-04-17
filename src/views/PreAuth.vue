<template>
  <Header />
  <div class="page-container">
    <p>
      The Berkeley Folklore Archive: a storehouse for myths and ballads, legends, tongue-twisters, riddles, toasts, blessings,
      curses and all other material passed by word of mouth from generation to generation.
    </p>
    <p>
      Professor Alan Dundes began the project in 1963, when he gathered student-submitted items into file cabinets in his UC Berkeley office.
      Over sixty years later, the physical archive consists of nearly 1 million items crammed into a windowless room in the heart of the Anthropology and Art Practices Building.
      Approximately 1,000 new items are added each year, and storage is overflowing available space.
    </p>
    <p>
      And so, digitization.
    </p>
    <p>
      If you'd like to visit the physical archive, please make an appointment by emailing <a href="mailto:FOLKLORE_ARCHIVE@BERKELEY.EDU"> the archive </a>.
    </p>
    <p>This text paraphrases and references the original, 1965 "Berkeley folklore archives press release" accessed via the
      Charles Deering McCormick Library of Special Collections at Northwestern University Libraries:
      <a href="https://dc.library.northwestern.edu/items/919b9ab6-f074-46fc-b073-47666a4f8d55"> https://dc.library.northwestern.edu/items/919b9ab6-f074-46fc-b073-47666a4f8d55 </a>
    </p>
    <img src="@/assets/dundesinarchive.jpg" alt="Professor Alan Dundes in the Berkeley Folklore Archive" class="dundes">
  </div>

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

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background-color: var(--color-primary-white);
  max-height: 100vh;
  padding: 1rem;
}
.dundes {
  max-width: 300px;
  margin: auto;
}
</style>