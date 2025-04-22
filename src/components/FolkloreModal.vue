<template>
  <transition name="fade">
    <div class="modal-backdrop" v-if="collection" @click="onClose">
      <div class="modal-content" @click.stop>
        <h2>Folklore Details:</h2>
        <p><strong>Contributor Name:</strong> {{ collection?.contributor.name }}</p>
        <p><strong>Age:</strong> {{ collection?.contributor.age_bucket }}</p>
        <p><strong>Gender:</strong> {{ collection?.contributor.gender || 'N/A' }}</p>
        <p><strong>Item of Folklore:</strong> {{ collection?.folklore.item }}</p>
        <p><strong>Genre:</strong> {{ collection?.folklore.genre }}</p>
        <p><strong>Language of Origin:</strong> {{ collection?.folklore.language_of_origin || 'N/A' }}</p>
        <p><strong>Places Mentioned:</strong>
          <!-- Loop over all places and format each one -->
          <span v-for="(place, idx) in collection?.folklore.place_mentioned" :key="idx">
            {{ collection ? formatLocation(place) : '' }}
            <span v-if="idx < (collection?.folklore.place_mentioned.length || 1) - 1">, </span>
          </span>
        </p>

        <h2>Collection Information: </h2>
        <p><strong>Collector Name:</strong> {{ collection?.collector.name }}</p>
        <p>
          <strong>Date Collected:</strong>
          {{ collection ? formatDate(collection.date_collected) : '' }}
        </p>
        <p>
          <strong>Location Collected:</strong>
          {{ collection ? formatLocation(collection.location_collected) : '' }}
        </p>
        <p><strong>Collector Comments:</strong> {{ collection?.analysis.collector_comments || 'N/A' }}</p>
        <p><strong>Collection Context:</strong> {{ collection?.analysis.context.collection_context || 'N/A' }}</p>

        <a class="modal-btn close" @click="onClose">Close</a>
        <a class="modal-btn download"
           target="_blank" rel="noopener noreferrer"
           :href="`${api}/folklore/${collection._id}/download`"
           @click.stop>
          Download
        </a>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { PropType } from "vue";
import type { FolkloreCollection, Location } from "@/types"; // adjust path

const api = import.meta.env.VITE_BACKEND_API

export default defineComponent({
  name: "FolkloreModal",
  props: {
    collection: {
      type: Object as PropType<FolkloreCollection>,
      default: null,
    },
    onClose: {
      type: Function as PropType<() => void>,
      default: () => {},
    },
  },
  methods: {
    formatDate(dateStr: string) {
      if (!dateStr) return "N/A";
      return new Date(dateStr).toLocaleDateString();
    },
    formatLocation(location: Location) {
      return [location.city, location.state, location.country].filter(Boolean).join(", ");
    },
  },
  setup() {
    return {
      api
    };
  }
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background-color: #fff;
  width: 90%;
  max-width: 700px;
  border-radius: 4px;
  padding: 1rem;
  position: relative;
  overflow-y: auto;
  max-height: 80vh;
  color: #000;
}

.modal-content h2 {
  color: var(--color-secondary-darknavy);
  font-weight: bold;
}

.modal-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  background-color: var(--color-primary-yellow);
  color: var(--color-secondary-darknavy);
  border: 2px solid var(--color-primary-blue);
  border-radius: 3px;
}

.download {
  float: right;
}

.close {
  float: left;
}
</style>