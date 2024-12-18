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
          <th>Genre</th>
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
          <td>{{ collection.folklore.genre }}</td>
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
import { FolkloreCollection } from "../types";

export default defineComponent({
  name: "FolkloreCollectionTable",
  setup() {
    const collections = ref<FolkloreCollection[]>([]);
    const error = ref<string | null>(null);

    const fetchCollections = async () => {
      try {
        const response = await fetch("/api/folklore/"); // Replace with your API endpoint
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const data = await response.json();
        collections.value = data;
      } catch (err: any) {
        error.value = err.message;
      }
    };

    const formatDate = (date: string): string => {
      return new Date(date).toLocaleDateString();
    };

    const formatLocation = (location: FolkloreCollection["location_collected"]): string => {
      return [location.city, location.state, location.country].filter(Boolean).join(", ");
    };

    onMounted(() => {
      fetchCollections();
    });

    return {
      collections,
      error,
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
</style>