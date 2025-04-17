<template>
  <Header />
  <div class="page-container">
    <p>
      Berkeley Folklore Archives: a storehouse for myths and ballads, legends, tongue-twisters, riddles, toasts, blessings,
      curses and all other material passed by word of mouth from generation to generation--are being established on this digital portal.
    </p>
    <p>
      The project snowballs through collection by folklore students of data from friends and relatives and personal recollections.
      When Professor Alan Dundes began the project in 1963, he gathered items into file cabinets in his UC Berkeley office.
      Over sixty years later, the physical archives consists of nearly 1 million items crammed into a windowless room in the heart of the Anthropology and Art Practices Building.
      Overflow items are collected in the basement beneath the Hearst swimming pool –– a moist location not well-suited to archival preservation.
      Approximately 1,000 new items are added each year. Thus, digitization.
    </p>
    <p>
      The archive, as Alan Dundes recognized, provides raw material for research in behavioral sciences as well as the field of folklore.
      They can be an aid for authors, artists, political scientists, data scientists, sociologists, and psychologists.
    </p>
    <p>
      If you'd like to visit the physical archive, please make an appointment by emailing <a href="mailto:FOLKLORE_ARCHIVE@BERKELEY.EDU"> the archive </a>.
    </p>
    <p>This text paraphrases and references the original "Berkeley folklore archives press release" accessed via the
      Charles Deering McCormick Library of Special Collections at Northwestern University Libraries:
      <a href="https://dc.library.northwestern.edu/items/919b9ab6-f074-46fc-b073-47666a4f8d55"> https://dc.library.northwestern.edu/items/919b9ab6-f074-46fc-b073-47666a4f8d55 </a>
    </p>
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
</style>