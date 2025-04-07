<template>
  <div class="map-container">
    <h4 id="item-count"></h4>
    <div id="map"></div>
    <div v-if="selectedCollections && showDynamicTable" class="table-container">
        <button @click="showDynamicTable = false" class="close-btn">Close</button>
        <h3 class="place_header">Found {{selectedCollections.length}} item(s) about {{selectedCity}}</h3>
        <DynamicTable :rows="selectedCollections" :fields="$props.fields" :isLoading="isLoading" :onRowClick="$props.onRowClick" />
    </div>
  </div>
</template>

<script lang="ts">
import type { FieldDefinition } from "@/composables/useFolkloreCollections";
import type { FolkloreCollection, Location } from "@/types";
import type { PropType } from "vue";
import { defineComponent, onMounted, ref, watch } from "vue";
import DynamicTable from "./DynamicTable.vue";
import { Map, Marker } from 'maplibre-gl';

const DISTANCE_THRESHOLD_KM = 15;

export default defineComponent({
  name: "DynamicMap",
  components: { DynamicTable },
  props: {
    getData: {
      type: Function as PropType<() => Promise<any>>,
      default: () => {},
    },
    timeState: {
      type: Object as PropType<Record<string, number>>,
      default: ref<Record<string, number>>({
        currentYear: 1960,
        timeWindow: 500,
        startYear: 1960,
        endYear: 9999,
      }),
    },
    fields: {
      type: Array as PropType<FieldDefinition[]>,
      default: () => [],
    },
    isLoading: {
      type: Boolean,
      default: false,
    },
    reload : {
      type: Boolean,
      default: false,
    },
    onRowClick: {
      type: Function as PropType<(row: any) => void>,
      default: () => {},
    },
  },
  setup(props) {
    let mapInstance: Map | null = null;
    const selectedCity = ref<string | null>(null);
    const selectedCollections = ref<any[] | null>(null);
    const showDynamicTable = ref<Boolean>(false);
    const fullCollections = ref<FolkloreCollection[]>([]);

    function haversineDistance(coord1: [number, number], coord2: [number, number]): number {
      const R = 6371; // Earth's radius in km
      const [lat1, lon1] = coord1.map(deg => (deg * Math.PI) / 180);
      const [lat2, lon2] = coord2.map(deg => (deg * Math.PI) / 180);
      
      const dLat = lat2 - lat1;
      const dLon = lon2 - lon1;

      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    async function initializeMap() {
      if (mapInstance) {
        mapInstance.remove();
      }

      mapInstance = new Map({
        container: 'map',
        style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
        center: [0, 0],
        zoom: 1,
      });

      document.getElementById("item-count").innerText = "Loading...";
      let counter = 0;
      // Group locations according to city name and longitude/latitude proximity
      const groupedLocations: { [key: string]: { city: string; collections: any[] } } = {};
      fullCollections.value.forEach((collection: FolkloreCollection) => {
        if (!collection || !collection.folklore || !collection.folklore.place_mentioned) {
          return;
        }

        if (!collection.date_collected) {
          return;
        }
        let date_split = collection.date_collected.split("-");
        if (date_split.length < 3) {
          return;
        }
        const year = parseInt(date_split[2]);
        if (year < props.timeState.currentYear || year > props.timeState.currentYear + props.timeState.timeWindow) {
          return;
        }

        collection.folklore.place_mentioned.forEach((place: Location) => {
          if (place.geolocation && place.city) {
            const [lat, lon] = place.geolocation.split(",").map(Number);
            let closestCityGroup: string | null = null;
            let closestOverallGroup: string | null = null;
            let minCityDistance = Infinity;
            let minOverallDistance = Infinity;

            // Step 1: Iterate through existing groups
            for (const key in groupedLocations) {
              const { city: groupCity } = groupedLocations[key];
              const [groupLat, groupLon] = key.split(",").map(Number);
              const distance = haversineDistance([lat, lon], [groupLat, groupLon]);

              if (groupCity === place.city) {
                // Step 2: If city matches, find the closest within threshold
                if (distance < DISTANCE_THRESHOLD_KM && distance < minCityDistance) {
                  minCityDistance = distance;
                  closestCityGroup = key;
                }
              }

              // Step 3: Track closest overall group (if no city match is found)
              if (distance < minOverallDistance) {
                minOverallDistance = distance;
                closestOverallGroup = key;
              }
            }

            // Step 4: Decide where to place the collection
            if (closestCityGroup) {
              groupedLocations[closestCityGroup].collections.push(collection);
              counter++;
            } else if (Object.values(groupedLocations).some((group) => group.city === place.city)) {
              if (closestOverallGroup != null) {
                groupedLocations[closestOverallGroup].collections.push(collection);
                counter++;
              }
            } else {
              const groupKey = `${lat},${lon}`;
              groupedLocations[groupKey] = { city: place.city, collections: [collection] };
              counter++;
            }
          }
        });
      });
      let itemElement = document.getElementById("item-count");
      if (itemElement) {
        itemElement.innerText = `${counter} item(s) found from ${props.timeState.currentYear} to ${Math.min(props.timeState.currentYear + props.timeState.timeWindow, props.timeState.endYear)}`;
      }
      
      Object.entries(groupedLocations).forEach(([coords, { city, collections }]) => {
        const [lat, lon] = coords.split(",").map(Number);
        if (Number.isNaN(lat) || Number.isNaN(lon)) {
          return;
        }
        new Marker({
            color: "#ff7a70",
            scale: 1 + Math.min(2, (collections.length - 1) * .10),
          })
          .setLngLat([lon, lat])
          .addTo(mapInstance!)
          .getElement().addEventListener("click", () => {
            selectedCollections.value = collections;
            selectedCity.value = city;
            showDynamicTable.value = true;
          });
      });
    }

    onMounted(async () => {
      document.getElementById("item-count").innerText = "Loading...";
      fullCollections.value = await props.getData();
      await initializeMap();
    });

    watch(() => props.reload, async () => {
      document.getElementById("item-count").innerText = "Loading...";
      fullCollections.value = await props.getData();
      await initializeMap();
    });

    watch(() => props.timeState, async () => {
      await initializeMap();
    }, { deep: true });

    return { selectedCollections, selectedCity, showDynamicTable};
  }
});
</script>

<style scoped>
@import 'maplibre-gl/dist/maplibre-gl.css';

#map {
  width: 100%;
  height: 100%;
}

#item-count {
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
  text-align: center;
  display: block;
  z-index: 1;
}

.map-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.table-container {
    position: absolute;
    top: 0;
    background: white;
    padding: 10px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    max-height: 80vh;
    overflow-y: auto;
}

.close-btn {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem;
  cursor: pointer;
  float: left;
  background-color: var(--color-primary-yellow);
  color: var(--color-secondary-darknavy);
  border: 2px solid var(--color-primary-blue);
  border-radius: 3px;
}

.place_header {
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem;
  text-align: center;
  display: block;
}

</style>