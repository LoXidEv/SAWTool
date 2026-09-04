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
        },
        standalone: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            tiles: [],
            mapItems: mapMarkers.markers,
            filterType: mapMarkers.baseInfo.filter,
            localFilter: 'all',
            filterPanelOpen: false,
            transform: {
                scale: 1,
                x: 0,
                y: 0
            },
            isDragging: false,
            dragMoved: false,
            lastMouseX: 0,
            lastMouseY: 0,
            lastTouchX: 0,
            lastTouchY: 0,
            lastPinchX: 0,
            lastPinchY: 0,
            initialPinchDistance: 0,
            initialScale: 1,
            zoomSpeed: 0.0015,
            minScale: 0.2,
            maxScale: 8,
            transitionEnabled: false,
            tempMarkers: [],
            devToolsOpen: false,
            collectMode: false,
            showCopiedToast: false,
            newMarker: {
                id: '',
                type: 'landmarkname',
                name: '',
                desc: '',
                icon: 'null',
                originalX: null,
                originalY: null
            },
            editingTempId: null
        };
    },
    watch: {
        filterValue: {
            immediate: true,
            handler(val) {
                this.localFilter = val || 'all';
            }
        }
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
                cursor: this.collectMode
                    ? 'crosshair'
                    : this.isDragging
                        ? 'grabbing'
                        : 'grab',
                transition: this.transitionEnabled ? 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
            };
        },
        filteredItems() {
            if (this.localFilter === 'all') {
                return this.mapItems;
            }
            return this.mapItems.filter(item => item.type === this.localFilter);
        },
        currentFilterLabel() {
            if (this.localFilter === 'all') {
                return this.$t ? this.$t('filter.all') : '全部';
            }
            const t = this.filterType.find(i => i.type === this.localFilter);
            if (!t) return this.localFilter;
            return this.$t ? this.$t(t.name) : t.name;
        },
        scalePercent() {
            return Math.round(this.transform.scale * 100);
        },
        newMarkerValid() {
            return (
                this.newMarker.id.trim() !== '' &&
                this.newMarker.name.trim() !== '' &&
                this.newMarker.originalX !== null &&
                this.newMarker.originalY !== null
            );
        },
        exportJson() {
            const baseInfo = { filter: mapMarkers.baseInfo.filter };
            const markers = [...mapMarkers.markers, ...this.tempMarkers.map(m => this.tempToMarkerFormat(m))];
            return JSON.stringify({ baseInfo, markers }, null, 2);
        },
        newOnlyJson() {
            const markers = this.tempMarkers.map(m => this.tempToMarkerFormat(m));
            return JSON.stringify(markers, null, 2);
        }
    },
    created() {
        this.tileElements = new Map();
        this.observer = null;
        this.initTiles();
        if (this.standalone) {
            this.devToolsOpen = true;
        }
    },
    mounted() {
        this.initObserver();
        this.$nextTick(() => {
            this.centerMap(true);
        });
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('mousemove', this.handleMouseMove);
    },
    beforeUnmount() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.tileElements.clear();
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('mousemove', this.handleMouseMove);
    },
    methods: {
        i18nText(key) {
            if (key === null || key === undefined) return '';
            if (typeof this.$t !== 'function') return key;
            const val = this.$t(key);
            // 统一走 i18n：存在翻译返回译文，否则原样返回便于排查
            return typeof val === 'string' ? val : key;
        },
        tempToMarkerFormat(m) {
            return {
                id: m.id,
                type: m.type,
                baseInfo: {
                    name: m.name,
                    icon: m.icon,
                    originalX: m.originalX,
                    originalY: m.originalY,
                    desc: m.desc
                },
                extendInfo: {}
            };
        },
        isUIElement(target) {
            if (!target || !target.closest) return false;
            // 交互控件/覆盖层上的鼠标操作不应触达地图（拖拽、缩放、坐标定位等）
            return !!target.closest('.devtools-panel, .tool-bar, .map-controls, .filter-backdrop, .map-marker-detail');
        },
        handleMapClick(e) {
            if (this.isDragging || this.dragMoved) return;
            if (this.isUIElement(e.target)) return;
            const rect = this.$refs.mapContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            const mapX = Math.round((mouseX - this.transform.x) / this.transform.scale);
            const mapY = Math.round((mouseY - this.transform.y) / this.transform.scale);

            if (this.collectMode) {
                this.newMarker.originalX = mapX;
                this.newMarker.originalY = mapY;
            }
        },
        handleMapDoubleClick(e) {
            if (this.isUIElement(e.target)) return;
            e.preventDefault();
            const rect = this.$refs.mapContainer.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            this.transitionEnabled = true;
            this.zoomAt(mouseX, mouseY, 2);
            setTimeout(() => { this.transitionEnabled = false; }, 260);
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
                rootMargin: '400px',
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
        centerMap(withTransition = false) {
            if (withTransition) this.transitionEnabled = true;
            const viewportWidth = this.$refs.mapContainer.clientWidth || window.innerWidth;
            const viewportHeight = this.$refs.mapContainer.clientHeight || window.innerHeight;
            const fitScale = Math.min(viewportWidth / this.mapWidth, viewportHeight / this.mapHeight, 1);
            this.transform.scale = fitScale;
            this.transform.x = (viewportWidth - this.mapWidth * fitScale) / 2;
            this.transform.y = (viewportHeight - this.mapHeight * fitScale) / 2;
            if (withTransition) {
                setTimeout(() => { this.transitionEnabled = false; }, 260);
            }
        },
        selectFilter(type) {
            this.localFilter = type;
            this.filterPanelOpen = false;
            this.$emit('update:filterValue', type);
        },
        toggleFilterPanel() {
            this.filterPanelOpen = !this.filterPanelOpen;
        },
        toggleDevTools() {
            if (this.standalone) {
                this.devToolsOpen = !this.devToolsOpen;
            } else {
                this.$router.push({ name: 'mapTool' });
            }
        },
        backToMap() {
            this.$router.push({ name: 'map' });
        },
        zoomIn() {
            const rect = this.$refs.mapContainer.getBoundingClientRect();
            this.transitionEnabled = true;
            this.zoomAt(rect.width / 2, rect.height / 2, 1.4);
            setTimeout(() => { this.transitionEnabled = false; }, 260);
        },
        zoomOut() {
            const rect = this.$refs.mapContainer.getBoundingClientRect();
            this.transitionEnabled = true;
            this.zoomAt(rect.width / 2, rect.height / 2, 1 / 1.4);
            setTimeout(() => { this.transitionEnabled = false; }, 260);
        },
        setScaleBySlider(val) {
            const newScale = Number(val);
            const rect = this.$refs.mapContainer.getBoundingClientRect();
            this.transitionEnabled = true;
            const factor = newScale / this.transform.scale;
            this.zoomAt(rect.width / 2, rect.height / 2, factor);
            setTimeout(() => { this.transitionEnabled = false; }, 260);
        },
        focusFirstMarker() {
            const firstValid = this.filteredItems.find(i => i.baseInfo.originalX !== null && i.baseInfo.originalY !== null);
            if (firstValid) {
                this.focusOnPoint(firstValid.baseInfo.originalX, firstValid.baseInfo.originalY);
            } else {
                this.centerMap(true);
            }
        },
        focusOnPoint(mapX, mapY, targetScale = null) {
            const rect = this.$refs.mapContainer.getBoundingClientRect();
            const viewportW = rect.width;
            const viewportH = rect.height;
            this.transitionEnabled = true;
            if (targetScale === null) {
                targetScale = Math.min(Math.max(this.transform.scale, 1.5), this.maxScale);
            }
            const finalScale = Math.min(Math.max(targetScale, this.minScale), this.maxScale);
            this.transform.scale = finalScale;
            this.transform.x = viewportW / 2 - mapX * finalScale;
            this.transform.y = viewportH / 2 - mapY * finalScale;
            setTimeout(() => { this.transitionEnabled = false; }, 260);
        },
        handleWheel(e) {
            if (this.isUIElement(e.target)) return;
            e.preventDefault();
            const rect = this.$refs.mapContainer.getBoundingClientRect();
            const delta = -e.deltaY * this.zoomSpeed;
            const zoomFactor = 1 + delta;
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            this.zoomAt(mouseX, mouseY, zoomFactor);
        },
        handleMouseDown(e) {
            if (this.isUIElement(e.target)) return;
            if (e.button === 0) {
                this.isDragging = true;
                this.dragMoved = false;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.transitionEnabled = false;
            }
        },
        handleMouseMove(e) {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                    this.dragMoved = true;
                }
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
            if (this.isUIElement(e.target)) return;
            if (e.touches.length === 1) {
                this.isDragging = true;
                this.dragMoved = false;
                this.lastTouchX = e.touches[0].clientX;
                this.lastTouchY = e.touches[0].clientY;
                this.transitionEnabled = false;
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
                if (Math.abs(dx) > 2 || Math.abs(dy) > 2) this.dragMoved = true;
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
                    const rect = this.$refs.mapContainer.getBoundingClientRect();
                    this.zoomAt(currentPinchX - rect.left, currentPinchY - rect.top, relativeFactor);
                }
                this.initialPinchDistance = currentDistance;
                this.initialScale = this.transform.scale;
                this.lastPinchX = currentPinchX;
                this.lastPinchY = currentPinchY;
            }
        },
        handleTouchEnd(e) {
            if (e.touches.length === 0) {
                this.isDragging = false;
                this.initialPinchDistance = 0;
            }
        },
        getDistance(touch1, touch2) {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        },
        zoomAt(centerX, centerY, factor) {
            let newScale = this.transform.scale * factor;
            if (newScale < this.minScale) newScale = this.minScale;
            if (newScale > this.maxScale) newScale = this.maxScale;
            const actualFactor = newScale / this.transform.scale;
            this.transform.x = centerX - (centerX - this.transform.x) * actualFactor;
            this.transform.y = centerY - (centerY - this.transform.y) * actualFactor;
            this.transform.scale = newScale;
        },
        resetNewMarker() {
            this.newMarker = {
                id: '',
                type: 'landmarkname',
                name: '',
                desc: '',
                icon: 'null',
                originalX: null,
                originalY: null
            };
            this.editingTempId = null;
        },
        addOrUpdateTempMarker() {
            if (!this.newMarkerValid) return;
            if (this.editingTempId) {
                const idx = this.tempMarkers.findIndex(m => m._tempId === this.editingTempId);
                if (idx !== -1) {
                    this.tempMarkers.splice(idx, 1, { ...this.newMarker, _tempId: this.editingTempId });
                }
            } else {
                const tempId = 'temp_' + Date.now();
                this.tempMarkers.push({ ...this.newMarker, _tempId: tempId });
            }
            this.resetNewMarker();
        },
        editTempMarker(tempMarker) {
            this.editingTempId = tempMarker._tempId;
            this.newMarker = {
                id: tempMarker.id,
                type: tempMarker.type,
                name: tempMarker.name,
                desc: tempMarker.desc,
                icon: tempMarker.icon,
                originalX: tempMarker.originalX,
                originalY: tempMarker.originalY
            };
        },
        deleteTempMarker(tempId) {
            const idx = this.tempMarkers.findIndex(m => m._tempId === tempId);
            if (idx !== -1) this.tempMarkers.splice(idx, 1);
            if (this.editingTempId === tempId) this.resetNewMarker();
        },
        clearTempMarkers() {
            this.tempMarkers = [];
            this.resetNewMarker();
        },
        async copyJson(which) {
            const text = which === 'full' ? this.exportJson : this.newOnlyJson;
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(text);
                } else {
                    const ta = document.createElement('textarea');
                    ta.value = text;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }
                this.showCopiedToast = true;
                setTimeout(() => { this.showCopiedToast = false; }, 1800);
            } catch (e) {
                console.error('Copy failed', e);
            }
        },
        downloadJson(which) {
            const text = which === 'full' ? this.exportJson : this.newOnlyJson;
            const filename = which === 'full' ? 'map_markers.json' : 'map_markers_new.json';
            const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 0);
        },
        focusTempMarker(tempMarker) {
            if (tempMarker.originalX != null && tempMarker.originalY != null) {
                this.focusOnPoint(tempMarker.originalX, tempMarker.originalY);
            }
        }
    }
};
</script>

<template>
    <div
        ref="mapContainer"
        class="map-tiled"
        @wheel.passive="false"
        @wheel="handleWheel"
        @mousedown="handleMouseDown"
        @contextmenu="handleContextMenu"
        @touchstart.passive="handleTouchStart"
        @touchmove.passive="handleTouchMove"
        @touchend="handleTouchEnd"
        @click="handleMapClick"
        @dblclick="handleMapDoubleClick"
    >
        <div class="map-grid" :style="gridStyle">
            <div v-for="(tile, index) in tiles" :key="tile.id" class="map-tile" :ref="(el) => setTileRef(el, index)">
                <transition name="fade">
                    <img v-if="tile.loaded" :src="tile.src" alt="Map Tile" draggable="false" />
                </transition>
            </div>
            <MapOverlay
                :width="mapWidth"
                :height="mapHeight"
                :XYitems="filteredItems"
                :tempItems="tempMarkers"
                :collectMode="collectMode"
                :pendingX="newMarker.originalX"
                :pendingY="newMarker.originalY"
            />
        </div>

        <div v-if="standalone" class="tool-bar">
            <button class="tool-back-btn" @click="backToMap" title="返回地图">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                <span>返回地图</span>
            </button>
            <span class="tool-badge">坐标工具</span>
        </div>

        <div class="map-controls">
            <div class="control-group zoom-group">
                <button class="ctrl-btn" :disabled="transform.scale >= maxScale - 0.01" @click="zoomIn" title="放大">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
                <div class="scale-display">{{ scalePercent }}%</div>
                <button class="ctrl-btn" :disabled="transform.scale <= minScale + 0.01" @click="zoomOut" title="缩小">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </button>
            </div>
            <div class="control-group slider-group" title="缩放滑块">
                <input
                    type="range"
                    :min="minScale"
                    :max="maxScale"
                    :step="0.01"
                    :value="transform.scale"
                    @input="setScaleBySlider($event.target.value)"
                    class="scale-slider"
                    orient="vertical"
                />
            </div>
            <div class="control-group action-group">
                <button class="ctrl-btn" @click="focusFirstMarker" title="聚焦到第一个标记">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/></svg>
                </button>
                <button class="ctrl-btn" @click="centerMap(true)" title="重置视图">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
                <button
                    class="ctrl-btn"
                    :class="{ 'ctrl-btn-active': devToolsOpen && standalone }"
                    @click="toggleDevTools"
                    :title="standalone ? '坐标工具' : '坐标工具页面'"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                </button>
            </div>

            <div class="control-group filter-group" :class="{ open: filterPanelOpen }">
                <button class="ctrl-btn filter-trigger" @click="toggleFilterPanel" title="展示类型">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                    <span class="filter-label">{{ currentFilterLabel }}</span>
                    <svg class="filter-chevron" :class="{ rotated: filterPanelOpen }" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <transition name="pop">
                    <div v-if="filterPanelOpen" class="filter-panel" @click.stop>
                        <button
                            class="filter-option"
                            :class="{ active: localFilter === 'all' }"
                            @click="selectFilter('all')"
                        >
                            <span class="filter-option-icon all-icon">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                            </span>
                            <span class="filter-option-text">{{ $t ? $t('filter.all') : '全部' }}</span>
                            <span class="filter-option-count">{{ mapItems.length }}</span>
                            <svg v-if="localFilter === 'all'" class="filter-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <button
                            v-for="t in filterType"
                            :key="t.type"
                            class="filter-option"
                            :class="[`type-${t.type}`, { active: localFilter === t.type }]"
                            @click="selectFilter(t.type)"
                        >
                            <span class="filter-option-icon" :class="`type-${t.type}`"></span>
                            <span class="filter-option-text">{{ $t ? $t(t.name) : t.name }}</span>
                            <span class="filter-option-count">{{ mapItems.filter(i => i.type === t.type).length }}</span>
                            <svg v-if="localFilter === t.type" class="filter-check" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                    </div>
                </transition>
            </div>
        </div>

        <div class="minimap-scale-info">
            <span class="coord-hint" v-if="collectMode">坐标采集模式开启 · 点击地图选取坐标</span>
        </div>

        <div
            v-if="filterPanelOpen"
            class="filter-backdrop"
            @click="filterPanelOpen = false"
        ></div>

        <Teleport to="body">
            <div v-if="showCopiedToast" class="copy-toast">已复制到剪贴板</div>
        </Teleport>

        <transition name="slide">
            <div v-if="devToolsOpen" class="devtools-panel">
                <div class="devtools-header">
                    <div class="devtools-title">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
                        <span>{{ standalone ? '地图坐标工具' : '地图开发者工具' }}</span>
                    </div>
                    <button class="devtools-close" @click="devToolsOpen = false" title="关闭面板">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        <span>关闭</span>
                    </button>
                </div>

                <div class="devtools-body">
                    <div class="tool-section">
                        <div class="tool-section-title">
                            <label class="switch-label">
                                <input type="checkbox" v-model="collectMode" />
                                <span class="switch-slider"></span>
                                <span class="switch-text">坐标采集模式</span>
                            </label>
                        </div>
                    </div>

                    <div class="tool-section">
                        <div class="tool-section-title">新增 / 编辑标记</div>
                        <div class="form-grid">
                            <div class="form-item">
                                <label>ID *</label>
                                <input type="text" v-model="newMarker.id" placeholder="如 land_mark_xxx" />
                            </div>
                            <div class="form-item">
                                <label>类型 *</label>
                                <select v-model="newMarker.type">
                                    <option v-for="t in filterType" :key="t.type" :value="t.type">{{ $t ? $t(t.name) : t.name }}</option>
                                </select>
                            </div>
                            <div class="form-item">
                                <label>名称 (i18n key 或 文字) *</label>
                                <input type="text" v-model="newMarker.name" placeholder="如 markers.xxx.name" />
                            </div>
                            <div class="form-item">
                                <label>图标文件名</label>
                                <input type="text" v-model="newMarker.icon" placeholder="留空或 null 显示名称" />
                            </div>
                            <div class="form-item form-item-coord">
                                <label>X 坐标{{ newMarker.originalX !== null ? '' : ' · 点击地图获取' }}</label>
                                <input type="number" :value="newMarker.originalX" @input="newMarker.originalX = $event.target.value === '' ? null : Number($event.target.value)" placeholder="X" />
                            </div>
                            <div class="form-item form-item-coord">
                                <label>Y 坐标</label>
                                <input type="number" :value="newMarker.originalY" @input="newMarker.originalY = $event.target.value === '' ? null : Number($event.target.value)" placeholder="Y" />
                            </div>
                            <div class="form-item form-item-full">
                                <label>介绍 / 描述</label>
                                <textarea v-model="newMarker.desc" rows="2" placeholder="i18n key 或描述文字"></textarea>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button class="btn-secondary" @click="resetNewMarker">清空</button>
                            <button class="btn-primary" :disabled="!newMarkerValid" @click="addOrUpdateTempMarker">
                                {{ editingTempId ? '更新标记' : '添加到列表' }}
                            </button>
                        </div>
                    </div>

                    <div class="tool-section">
                        <div class="tool-section-title-row">
                            <span class="tool-section-title">待导出标记 ({{ tempMarkers.length }})</span>
                            <button v-if="tempMarkers.length" class="text-btn danger" @click="clearTempMarkers">清空全部</button>
                        </div>
                        <div v-if="tempMarkers.length === 0" class="empty-hint">暂无待导出标记，添加后将显示在此处</div>
                        <div v-else class="temp-list">
                            <div v-for="m in tempMarkers" :key="m._tempId" class="temp-list-item" :class="{ editing: m._tempId === editingTempId }">
                                <div class="temp-info">
                                    <div class="temp-main">
                                        <span class="temp-id">{{ m.id }}</span>
                                        <span class="temp-type" :class="'type-' + m.type">{{ m.type }}</span>
                                    </div>
                                    <div class="temp-sub" v-if="m.originalX !== null">
                                        <span>X:{{ m.originalX }} Y:{{ m.originalY }}</span>
                                        <span class="temp-name">{{ i18nText(m.name) }}</span>
                                    </div>
                                </div>
                                <div class="temp-actions">
                                    <button class="icon-btn" title="聚焦" @click="focusTempMarker(m)">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
                                    </button>
                                    <button class="icon-btn" title="编辑" @click="editTempMarker(m)">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                                    </button>
                                    <button class="icon-btn danger" title="删除" @click="deleteTempMarker(m._tempId)">
                                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="tool-section">
                        <div class="tool-section-title">JSON 导出</div>
                        <div class="export-actions">
                            <div class="export-col">
                                <div class="export-label">仅新增标记</div>
                                <div class="btn-row">
                                    <button class="btn-secondary" :disabled="!tempMarkers.length" @click="copyJson('new')">复制</button>
                                    <button class="btn-secondary" :disabled="!tempMarkers.length" @click="downloadJson('new')">下载</button>
                                </div>
                            </div>
                            <div class="export-col">
                                <div class="export-label">完整 map_markers.json</div>
                                <div class="btn-row">
                                    <button class="btn-primary" @click="copyJson('full')">复制</button>
                                    <button class="btn-primary" @click="downloadJson('full')">下载</button>
                                </div>
                            </div>
                        </div>
                        <details class="json-preview">
                            <summary>预览 JSON (新增部分)</summary>
                            <pre>{{ newOnlyJson || '// 暂无新增标记' }}</pre>
                        </details>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<style scoped>
.map-tiled {
    width: 100%;
    height: 100%;
    min-height: 100vh;
    overflow: hidden;
    background-color: #ececec;
    position: relative;
    touch-action: none;
    user-select: none;
}

.map-grid {
    display: grid;
    will-change: transform;
    position: absolute;
    top: 0;
    left: 0;
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
    -webkit-user-drag: none;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.tool-bar {
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 150;
    display: flex;
    align-items: center;
    gap: 10px;
    pointer-events: none;
}

.tool-back-btn {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 42px;
    padding: 0 14px 0 10px;
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(8px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
    color: var(--text-color);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.tool-back-btn:hover {
    background: #f3f4f6;
    color: var(--theme-color-2);
}

.tool-back-btn:active {
    transform: scale(0.96);
}

.tool-badge {
    padding: 7px 14px;
    background: var(--theme-color-2);
    color: #fff;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 4px 12px var(--theme-color-2-oc);
}

.map-controls {
    position: absolute;
    right: 16px;
    bottom: 20px;
    z-index: 100;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
}

.control-group {
    background: rgba(255, 255, 255, 0.96);
    backdrop-filter: blur(8px);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.06);
    display: flex;
    overflow: hidden;
}

.zoom-group {
    flex-direction: column;
}

.ctrl-btn {
    width: 42px;
    height: 42px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color);
    transition: background 0.15s ease, color 0.15s ease;
}

.ctrl-btn:hover:not(:disabled) {
    background: #f3f4f6;
    color: #111827;
}

.ctrl-btn:active:not(:disabled) {
    background: #e5e7eb;
}

.ctrl-btn:disabled {
    color: #d1d5db;
    cursor: not-allowed;
}

.ctrl-btn-active {
    background: var(--theme-color-2-oc-up) !important;
    color: var(--theme-color-2) !important;
}

.scale-display {
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: #6b7280;
    letter-spacing: 0.3px;
    border-top: 1px solid #f3f4f6;
    border-bottom: 1px solid #f3f4f6;
    padding: 0 6px;
}

.slider-group {
    padding: 8px 0;
    justify-content: center;
}

.scale-slider {
    -webkit-appearance: slider-vertical;
    width: 28px;
    height: 120px;
    cursor: pointer;
    accent-color: var(--theme-color-2);
}

.action-group {
    flex-direction: column;
}

.filter-group {
    flex-direction: column;
    position: relative;
    overflow: visible;
}

.filter-trigger {
    width: auto;
    padding: 0 12px 0 8px;
    gap: 8px;
    display: inline-flex;
    align-items: center;
    height: 42px;
    white-space: nowrap;
    color: var(--text-color);
    transition: background 0.15s ease;
}

.filter-trigger:hover {
    background: #f3f4f6 !important;
}

.filter-group.open .filter-trigger {
    background: var(--theme-color-2-oc-up);
}

.filter-label {
    font-size: 13px;
    font-weight: 600;
    line-height: 1;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.filter-chevron {
    transition: transform 0.2s ease;
    color: #9ca3af;
}

.filter-chevron.rotated {
    transform: rotate(180deg);
}

.filter-panel {
    position: absolute;
    top: auto;
    bottom: calc(100% + 8px);
    left: auto;
    right: 0;
    min-width: 260px;
    max-width: 300px;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.14), 0 2px 6px rgba(0, 0, 0, 0.06);
    padding: 6px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    z-index: 110;
}

.filter-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px 9px 8px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    color: #374151;
    text-align: left;
    transition: background 0.12s ease;
    width: 100%;
}

.filter-option:hover {
    background: #f3f4f6;
}

.filter-option.active {
    background: var(--theme-color-2-oc-up);
    color: var(--theme-color-2);
}

.filter-option.active.type-quicktravel {
    background: var(--theme-color-1-oc-up);
    color: var(--theme-color-1);
}

.filter-option.active.type-superite {
    background: var(--theme-color-3-oc-up);
    color: var(--theme-color-3);
}

.filter-option.active.type-landmarkname {
    background: var(--theme-color-2-oc-up);
    color: var(--theme-color-2);
}

.filter-option.active.type-oldmei {
    background: var(--theme-color-4-oc-up);
    color: var(--theme-color-4);
}

.filter-option-icon {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.12s ease, color 0.12s ease;
}

.filter-option-icon.all-icon {
    background: #f3f4f6;
    color: #6b7280;
}

.filter-option.active .all-icon {
    background: var(--theme-color-2);
    color: white;
}

.filter-option-icon.type-quicktravel {
    background: var(--theme-color-1-oc-up);
    color: var(--theme-color-1);
}

.filter-option.active.type-quicktravel .filter-option-icon.type-quicktravel {
    background: var(--theme-color-1);
    color: white;
}

.filter-option-icon.type-superite {
    background: var(--theme-color-3-oc-up);
    color: var(--theme-color-3);
}

.filter-option.active.type-superite .filter-option-icon.type-superite {
    background: var(--theme-color-3);
    color: white;
}

.filter-option-icon.type-landmarkname {
    background: var(--theme-color-2-oc-up);
    color: var(--theme-color-2);
}

.filter-option.active.type-landmarkname .filter-option-icon.type-landmarkname {
    background: var(--theme-color-2);
    color: white;
}

.filter-option-icon.type-oldmei {
    background: var(--theme-color-4-oc-up);
    color: var(--theme-color-4);
}

.filter-option.active.type-oldmei .filter-option-icon.type-oldmei {
    background: var(--theme-color-4);
    color: white;
}

.filter-option-text {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
}

.filter-option-count {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: #f3f4f6;
    color: #6b7280;
    flex-shrink: 0;
}

.filter-option.active .filter-option-count {
    background: rgba(255, 255, 255, 0.6);
    color: inherit;
}

.filter-check {
    flex-shrink: 0;
    margin-left: 2px;
}

.filter-backdrop {
    position: absolute;
    inset: 0;
    z-index: 90;
    cursor: default;
}

.pop-enter-active,
.pop-leave-active {
    transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: bottom right;
}

.pop-enter-from,
.pop-leave-to {
    opacity: 0;
    transform: translateY(8px) scale(0.96);
}

.minimap-scale-info {
    position: absolute;
    left: 16px;
    bottom: 24px;
    z-index: 100;
    pointer-events: none;
}

.coord-hint {
    display: inline-block;
    padding: 6px 12px;
    background: var(--theme-color-2);
    color: #fff;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    box-shadow: 0 4px 12px var(--theme-color-2-oc);
}

.copy-toast {
    position: fixed;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(17, 24, 39, 0.92);
    color: #fff;
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 13px;
    z-index: 9999;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    animation: toast-in 0.2s ease;
}

@keyframes toast-in {
    from { opacity: 0; transform: translate(-50%, -8px); }
    to { opacity: 1; transform: translate(-50%, 0); }
}

.devtools-panel {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 400px;
    max-width: 92vw;
    background: #ffffff;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.1);
    z-index: 200;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #e5e7eb;
}

.slide-enter-active,
.slide-leave-active {
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
    transform: translateX(100%);
}

.devtools-header {
    padding: 14px 18px;
    border-bottom: 1px solid var(--theme-color-2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.16)), var(--theme-color-2);
    color: white;
}

.devtools-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
}

.devtools-close {
    background: rgba(255, 255, 255, 0.22);
    border: 1px solid rgba(255, 255, 255, 0.45);
    color: white;
    height: 32px;
    padding: 0 12px;
    gap: 4px;
    border-radius: 999px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
    transition: background 0.15s, transform 0.15s;
}

.devtools-close:hover {
    background: rgba(0, 0, 0, 0.18);
    border-color: rgba(255, 255, 255, 0.6);
}

.devtools-close:active {
    transform: scale(0.95);
}

.devtools-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 18px 28px;
    display: flex;
    flex-direction: column;
    gap: 18px;
}

.tool-section {
    background: #fafafa;
    border: 1px solid #f3f4f6;
    border-radius: 10px;
    padding: 14px;
}

.tool-section-title {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    margin-bottom: 12px;
}

.tool-section-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
}

.tool-section-title-row .tool-section-title {
    margin-bottom: 0;
}

.text-btn {
    background: none;
    border: none;
    color: var(--theme-color-2);
    cursor: pointer;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 6px;
}

.text-btn:hover {
    background: var(--theme-color-2-oc-up);
}

.text-btn.danger {
    color: #dc2626;
}

.text-btn.danger:hover {
    background: #fee2e2;
}

.switch-label {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;
    user-select: none;
}

.switch-label input {
    display: none;
}

.switch-slider {
    width: 36px;
    height: 20px;
    border-radius: 20px;
    background: #d1d5db;
    position: relative;
    transition: background 0.2s;
}

.switch-slider::before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s;
}

.switch-label input:checked + .switch-slider {
    background: var(--theme-color-2);
}

.switch-label input:checked + .switch-slider::before {
    transform: translateX(16px);
}

.switch-text {
    font-size: 13px;
    font-weight: 500;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 12px;
}

.form-item-full {
    grid-column: 1 / -1;
}

.form-item label {
    display: block;
    font-size: 11px;
    color: #6b7280;
    margin-bottom: 4px;
    font-weight: 500;
}

.form-item input,
.form-item select,
.form-item textarea {
    width: 100%;
    padding: 7px 10px;
    border: 1px solid #e5e7eb;
    border-radius: 7px;
    font-size: 13px;
    background: white;
    box-sizing: border-box;
    outline: none;
    transition: border 0.15s, box-shadow 0.15s;
    font-family: inherit;
}

.form-item input:focus,
.form-item select:focus,
.form-item textarea:focus {
    border-color: var(--theme-color-2);
    box-shadow: 0 0 0 3px var(--theme-color-2-oc-up);
}

.form-item textarea {
    resize: vertical;
    min-height: 50px;
}

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 12px;
    justify-content: flex-end;
}

.btn-primary,
.btn-secondary {
    padding: 8px 16px;
    border-radius: 7px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: background 0.15s, opacity 0.15s;
}

.btn-primary {
    background: var(--theme-color-2);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background: linear-gradient(rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.12)), var(--theme-color-2);
}

.btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-secondary {
    background: #f3f4f6;
    color: #374151;
}

.btn-secondary:hover:not(:disabled) {
    background: #e5e7eb;
}

.btn-secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.empty-hint {
    font-size: 12px;
    color: #9ca3af;
    padding: 12px;
    text-align: center;
    background: white;
    border-radius: 8px;
    border: 1px dashed #e5e7eb;
}

.temp-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 260px;
    overflow-y: auto;
}

.temp-list-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    transition: border 0.15s, background 0.15s;
}

.temp-list-item.editing {
    border-color: var(--theme-color-2);
    background: var(--theme-color-2-oc-up);
}

.temp-info {
    min-width: 0;
    flex: 1;
}

.temp-main {
    display: flex;
    align-items: center;
    gap: 8px;
}

.temp-id {
    font-size: 13px;
    font-weight: 600;
    color: #111827;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.temp-type {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 999px;
    background: var(--theme-color-2-oc-up);
    color: var(--theme-color-2);
    font-weight: 600;
}

.temp-type.type-quicktravel {
    background: var(--theme-color-1-oc-up);
    color: var(--theme-color-1);
}

.temp-type.type-superite {
    background: var(--theme-color-3-oc-up);
    color: var(--theme-color-3);
}

.temp-type.type-landmarkname {
    background: var(--theme-color-2-oc-up);
    color: var(--theme-color-2);
}

.temp-type.type-oldmei {
    background: var(--theme-color-4-oc-up);
    color: var(--theme-color-4);
}

.temp-sub {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 4px;
    font-size: 11px;
    color: #6b7280;
}

.temp-name {
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.temp-actions {
    display: flex;
    align-items: center;
    gap: 2px;
}

.icon-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6b7280;
    transition: background 0.15s, color 0.15s;
}

.icon-btn:hover {
    background: #f3f4f6;
    color: #111827;
}

.icon-btn.danger:hover {
    background: #fee2e2;
    color: #dc2626;
}

.export-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.export-col {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px;
}

.export-label {
    font-size: 11px;
    color: #6b7280;
    margin-bottom: 8px;
    font-weight: 500;
}

.btn-row {
    display: flex;
    gap: 6px;
}

.btn-row .btn-primary,
.btn-row .btn-secondary {
    padding: 6px 10px;
    font-size: 12px;
    flex: 1;
}

.json-preview {
    margin-top: 14px;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
}

.json-preview summary {
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 500;
    color: var(--theme-color-2);
    cursor: pointer;
    user-select: none;
    background: #fafafa;
}

.json-preview pre {
    margin: 0;
    padding: 12px;
    font-size: 11px;
    line-height: 1.5;
    color: #374151;
    background: #f9fafb;
    max-height: 220px;
    overflow: auto;
    font-family: 'Consolas', 'Menlo', monospace;
    border-top: 1px solid #f3f4f6;
    white-space: pre-wrap;
    word-break: break-all;
}

@media screen and (max-width: 680px) {
    .devtools-panel {
        width: 100%;
        max-width: 100%;
    }
    .map-controls {
        right: 10px;
        bottom: 100px;
    }
    .filter-panel {
        max-width: calc(100vw - 32px);
    }
}
</style>
