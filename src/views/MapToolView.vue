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
    <div class="map_tool_view">
        <MapTiled :filterValue="filterValue" standalone />
    </div>
</template>

<style scoped>
.map_tool_view {
    position: fixed;
    inset: 0;
    z-index: 10;
    background: #ececec;
}
</style>
