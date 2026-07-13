<script>
import MapTiled from '@/components/MapTiled.vue'

export default {
    components: {
        MapTiled
    },
    props: {
        filterValue: {
            type: String,
            default: 'all'
        }
    }
}
</script>

<template>
    <div class="map_view">
        <MapTiled :filterValue="filterValue" />
    </div>
</template>

<style scoped>
.map_view {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}
</style>
