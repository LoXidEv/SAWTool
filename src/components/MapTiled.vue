<script>
import mapConfig from '@/assets/configdata/map_config.json';
import mapMarkers from '@/assets/configdata/map_markers.json';
import MapOverlay from './MapOverlay.vue';

export default {
    components: {
        MapOverlay
    },
    props: {
        filterValue: {
            type: String,
            default: 'all'
        }
    },
    data() {
        return {
            tiles: [],
            mapItems: mapMarkers.markers,
            filterType: mapMarkers.baseInfo.filter,
            transform: {
                scale: 1,
                x: 0,
                y: 0
            },
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0,
            lastTouchX: 0,
            lastTouchY: 0,
            lastPinchX: 0,
            lastPinchY: 0,
            initialPinchDistance: 0,
            initialScale: 1,
            zoomSpeed: 0.001
        };
    },
    computed: {
        mapWidth() {
            return mapConfig.cols * mapConfig.tileSize;
        },
        mapHeight() {
            return mapConfig.rows * mapConfig.tileSize;
        },
        gridStyle() {
            return {
                width: `${this.mapWidth}px`,
                height: `${this.mapHeight}px`,
                gridTemplateColumns: `repeat(${mapConfig.cols}, ${mapConfig.tileSize}px)`,
                gridTemplateRows: `repeat(${mapConfig.rows}, ${mapConfig.tileSize}px)`,
                transform: `translate(${this.transform.x}px, ${this.transform.y}px) scale(${this.transform.scale})`,
                transformOrigin: '0 0',
                cursor: this.isDragging ? 'grabbing' : 'default'
            };
        },
        filteredItems() {
            if (this.filterValue === 'all') {
                return this.mapItems;
            }
            return this.mapItems.filter(item => item.type === this.filterValue);
        }
    },
    created() {
        this.tileElements = new Map();
        this.observer = null;
        this.initTiles();
    },
    mounted() {
        this.initObserver();
        this.centerMap();
    },
    beforeUnmount() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.tileElements.clear();
    },
    methods: {
        handleMapClick(e) {
            if (this.isDragging) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const mapX = (mouseX - this.transform.x) / this.transform.scale;
            const mapY = (mouseY - this.transform.y) / this.transform.scale;
            console.log(`Map Click: (${Math.round(mapX)}, ${Math.round(mapY)})`);
        },
        initTiles() {
            const list = [];
            for (let r = 1; r <= mapConfig.rows; r++) {
                for (let c = 1; c <= mapConfig.cols; c++) {
                    list.push({
                        id: `${r}_${c}`,
                        src: `${mapConfig.imagePathPrefix}${r}_${c}${mapConfig.imageExtension}`,
                        loaded: false,
                        index: list.length
                    });
                }
            }
            this.tiles = list;
        },
        initObserver() {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const idx = Number(entry.target.dataset.index);
                        if (!isNaN(idx) && this.tiles[idx] && !this.tiles[idx].loaded) {
                            this.tiles[idx].loaded = true;
                            this.observer.unobserve(entry.target);
                        }
                    }
                });
            }, {
                root: null,
                rootMargin: '200px',
                threshold: 0.01
            });
            this.tileElements.forEach(el => this.observer.observe(el));
        },
        setTileRef(el, index) {
            if (el) {
                el.dataset.index = index;
                this.tileElements.set(index, el);
                if (this.observer) this.observer.observe(el);
            }
        },
        centerMap() {
            const mapWidth = mapConfig.cols * mapConfig.tileSize;
            const mapHeight = mapConfig.rows * mapConfig.tileSize;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            this.transform.x = (viewportWidth - mapWidth) / 2;
            this.transform.y = (viewportHeight - mapHeight) / 2;
        },
        handleWheel(e) {
            e.preventDefault();
            const delta = -e.deltaY * this.zoomSpeed;
            const zoomFactor = 1 + delta;
            this.zoomAt(e.clientX, e.clientY, zoomFactor);
        },
        handleMouseDown(e) {
            if (e.button === 2) {
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        },
        handleMouseMove(e) {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.transform.x += dx;
                this.transform.y += dy;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        },
        handleMouseUp() {
            this.isDragging = false;
        },
        handleContextMenu(e) {
            e.preventDefault();
        },
        handleTouchStart(e) {
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.lastTouchX = e.touches[0].clientX;
                this.lastTouchY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                this.isDragging = false;
                this.initialPinchDistance = this.getDistance(e.touches[0], e.touches[1]);
                this.initialScale = this.transform.scale;
                this.lastPinchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                this.lastPinchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            }
        },
        handleTouchMove(e) {
            if (e.touches.length === 1 && this.isDragging) {
                const dx = e.touches[0].clientX - this.lastTouchX;
                const dy = e.touches[0].clientY - this.lastTouchY;
                this.transform.x += dx;
                this.transform.y += dy;
                this.lastTouchX = e.touches[0].clientX;
                this.lastTouchY = e.touches[0].clientY;
            } else if (e.touches.length === 2) {
                e.preventDefault();
                const currentPinchX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
                const currentPinchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                const dx = currentPinchX - this.lastPinchX;
                const dy = currentPinchY - this.lastPinchY;
                this.transform.x += dx;
                this.transform.y += dy;
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                if (this.initialPinchDistance > 0) {
                    const scaleFactor = currentDistance / this.initialPinchDistance;
                    const newScale = this.initialScale * scaleFactor;
                    const relativeFactor = newScale / this.transform.scale;
                    this.zoomAt(currentPinchX, currentPinchY, relativeFactor);
                }
                this.initialPinchDistance = currentDistance;
                this.initialScale = this.transform.scale;
                this.lastPinchX = currentPinchX;
                this.lastPinchY = currentPinchY;
            }
        },
        handleTouchEnd() {
            this.isDragging = false;
            this.initialPinchDistance = 0;
        },
        getDistance(touch1, touch2) {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        },
        zoomAt(centerX, centerY, factor) {
            let newScale = this.transform.scale * factor;
            const minScale = 0.1;
            const maxScale = 5;
            if (newScale < minScale) newScale = minScale;
            if (newScale > maxScale) newScale = maxScale;
            factor = newScale / this.transform.scale;
            this.transform.x = centerX - (centerX - this.transform.x) * factor;
            this.transform.y = centerY - (centerY - this.transform.y) * factor;
            this.transform.scale = newScale;
        }
    }
};
</script>

<template>
    <div class="map-tiled" @wheel="handleWheel" @mousedown="handleMouseDown" @mousemove="handleMouseMove"
        @mouseup="handleMouseUp" @mouseleave="handleMouseUp" @contextmenu="handleContextMenu"
        @touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd" @click="handleMapClick">
        <div class="map-grid" :style="gridStyle">
            <div v-for="(tile, index) in tiles" :key="tile.id" class="map-tile" :ref="(el) => setTileRef(el, index)">
                <transition name="fade">
                    <img v-if="tile.loaded" :src="tile.src" alt="Map Tile" draggable="false" />
                </transition>
            </div>
            <MapOverlay :width="mapWidth" :height="mapHeight" :XYitems="filteredItems" />
        </div>
    </div>
</template>

<style scoped>
.map-tiled {
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background-color: #ececec;
    position: relative;
    touch-action: none;
}

.map-grid {
    display: grid;
    will-change: transform;
}

.map-tile {
    width: 100%;
    height: 100%;
    background-color: #dadada;
    position: relative;
    overflow: hidden;
}

.map-tile img {
    width: 100%;
    height: 100%;
    display: block;
    object-fit: cover;
    user-select: none;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
