<template>
  <transition name="fade">
    <div class="modal-backdrop" v-if="collection" @click="onClose">
      <div class="modal-content" @click.stop>
        <!-- Modal Header -->
        <header class="modal-header flex justify-between items-center border-b pb-2 mb-4">
          <h2 class="text-2xl font-bold">Folklore Item Details</h2>
          <button @click="onClose" aria-label="Close" class="text-gray-500 hover:cursor-pointer hover:text-gray-800 text-xl">
            &times;
          </button>
        </header>

        <!-- Modal Body as Collapsible Tree -->
        <section class="modal-body overflow-y-auto">
          <!-- Item of Folklore -->
          <details open class="mb-4">
            <summary class="font-semibold cursor-pointer">Item of Folklore</summary>
            <p class="pl-4 mt-2 leading-relaxed">{{ collection?.folklore.item }}</p>
          </details>

          <!-- Folklore Information -->
          <details open class="mb-4">
            <summary class="font-semibold cursor-pointer">Folklore Information</summary>
            <ul class="pl-4 mt-2 space-y-1">
              <li><strong>Genre:</strong> {{ collection?.folklore.genre }}</li>
              <li><strong>Language of Origin:</strong> {{ collection?.folklore.language_of_origin || 'N/A' }}</li>
              <li>
                <strong>Places Mentioned:</strong>
                <ul class="pl-4 list-disc space-y-0.5">
                  <li
                    v-for="(place, idx) in collection?.folklore.place_mentioned"
                    :key="idx"
                    class="leading-relaxed"
                  >
                    {{ collection ? formatLocation(place) : '' }}
                  </li>
                </ul>
              </li>
            </ul>
          </details>

          <!-- Contributor Information -->
          <details open class="mb-4">
            <summary class="font-semibold cursor-pointer">Contributor Information</summary>
            <ul class="pl-4 mt-2 space-y-1">
              <li><strong>Name:</strong> {{ collection?.contributor.name }}</li>
              <li><strong>Age:</strong> {{ collection?.contributor.age_bucket }}</li>
              <li><strong>Gender:</strong> {{ collection?.contributor.gender || 'N/A' }}</li>
            </ul>
          </details>

          <!-- Collection Information -->
          <details open class="mb-4">
            <summary class="font-semibold cursor-pointer">Collection Information</summary>
            <ul class="pl-4 mt-2 space-y-1">
              <li><strong>Collector Name:</strong> {{ collection?.collector.name }}</li>
              <li><strong>Date Collected:</strong> {{ collection ? formatDate(collection.date_collected) : '' }}</li>
              <li><strong>Location Collected:</strong> {{ collection ? formatLocation(collection.location_collected) : '' }}</li>
              <li><strong>Collector Comments:</strong> {{ collection?.analysis.collector_comments || 'N/A' }}</li>
              <li><strong>Collection Context:</strong> {{ collection?.analysis.context.collection_context || 'N/A' }}</li>
            </ul>
          </details>
        </section>

        <!-- Modal Footer -->
        <footer class="modal-footer flex justify-end space-x-2 border-t pt-4 mt-4">
          <button @click="onClose" class="btn-secondary">Close</button>
          <a
            class="btn-primary"
            target="_blank"
            rel="noopener noreferrer"
            :href="`${api}/folklore/${collection._id}/download`"
          >
            Download
          </a>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { PropType } from "vue";
import type { FolkloreCollection, Location } from "@/types";

const api = import.meta.env.VITE_BACKEND_API;

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
      return [location.city, location.state, location.country]
        .filter(Boolean)
        .join(", ");
    },
  },
  setup() {
    return { api };
  },
});
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
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

details > summary {
  list-style: none;
}
details > summary::-webkit-details-marker {
  display: none;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  font-weight: 500;
  border-radius: 3px;
  border: 2px solid var(--color-primary-blue);
  cursor: pointer;
}

.btn-primary {
  background-color: var(--color-primary-yellow);
  color: var(--color-secondary-darknavy);
}

.btn-secondary {
  background-color: transparent;
  color: var(--color-secondary-darknavy);
}

.btn-secondary:hover {
  background-color: var(--color-primary-yellow);
}

</style>
