<template>
  <div>
    <h1>Berkeley Folklore Archive</h1>
    <div v-if="error" class="error">
      Error: {{ error }}
    </div>
    <table v-if="collections.length" border="1" style="width: 95%; text-align: left;">
      <thead>
        <tr>
          <th>Contributor Name</th>
          <th>Contributor Age</th>
          <th>Contributor Gender</th>
          <th>Folklore Item</th>
          <td @click="fetchCollections('')" class="clickable">
            Genre
          </td>
          <th>Collector Name</th>
          <th>Date Collected</th>
          <th>Location Collected</th>
          <th>Get PDF</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="collection in collections" :key="collection._id">
          <td>{{ collection.contributor.name }}</td>
          <td>{{ collection.contributor.age_bucket }}</td>
          <td>{{ collection.contributor.gender || 'N/A' }}</td>
          <td>{{ collection.folklore.item }}</td>
          <!-- Add click handler for genres -->
          <td @click="fetchCollections(collection.folklore.genre)" class="clickable">
            {{ collection.folklore.genre }}
          </td>
          <td>{{ collection.collector.name }}</td>
          <td>{{ formatDate(collection.date_collected) }}</td>
          <td>{{ formatLocation(collection.location_collected) }}</td>
          <td><a v-bind:href="'https://env-2986297.us.reclaim.cloud/folklore/' + collection._id + '/download'"> Download </a></td>
        </tr>
      </tbody>
    </table>
    <div v-else>
      <p>Loading...</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from "vue";
import type { FolkloreCollection } from "../types";

export default defineComponent({
  name: "FolkloreCollectionTable",
  setup() {
    const collections = ref<FolkloreCollection[]>([]);
    const error = ref<string | null>(null);

    // Fetch collections, with optional genre filtering
    const fetchCollections = async (genre: string = "") => {
      try {
        let path = genre
          ? `${import.meta.env.VITE_BACKEND_API}${genre}`
          : `${import.meta.env.VITE_BACKEND_API}`;
        const response = await fetch(path); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        collections.value = data;
      } catch (err: any) {
        error.value = err.message;
      }
    };

    // Format the date
    const formatDate = (date: string): string => {
      return new Date(date).toLocaleDateString();
    };

    // Format the location
    const formatLocation = (location: FolkloreCollection["location_collected"]): string => {
      return [location.city, location.state, location.country].filter(Boolean).join(", ");
    };

    // Load initial data on mount
    onMounted(() => {
      fetchCollections();
    });

    return {
      collections,
      error,
      fetchCollections, // Explicitly return fetchCollections so it's available in the template
      formatDate,
      formatLocation,
    };
  },
});
</script>

<style scoped>
.error {
  color: red;
  font-weight: bold;
}

.clickable {
  cursor: pointer;
  color: blue;
  text-decoration: underline;
}
</style>