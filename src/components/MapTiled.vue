<script>
import { snackbar } from 'mdui/functions/snackbar.js';
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
            return !!target.closest('.devtools-panel, .tool-bar, .map-controls, .map-marker-detail');
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
            this.$emit('update:filterValue', type);
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
                snackbar({ message: '已复制到剪贴板' });
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
    <div ref="mapContainer" class="map-tiled" @wheel.passive="false" @wheel="handleWheel" @mousedown="handleMouseDown"
        @contextmenu="handleContextMenu" @touchstart.passive="handleTouchStart" @touchmove.passive="handleTouchMove"
        @touchend="handleTouchEnd" @click="handleMapClick" @dblclick="handleMapDoubleClick">
        <div class="map-grid" :style="gridStyle">
            <div v-for="(tile, index) in tiles" :key="tile.id" class="map-tile" :ref="(el) => setTileRef(el, index)">
                <transition name="fade">
                    <img v-if="tile.loaded" :src="tile.src" alt="Map Tile" draggable="false" />
                </transition>
            </div>
            <MapOverlay :width="mapWidth" :height="mapHeight" :XYitems="filteredItems" :tempItems="tempMarkers"
                :collectMode="collectMode" :pendingX="newMarker.originalX" :pendingY="newMarker.originalY" />
        </div>

        <div v-if="standalone" class="tool-bar">
            <mdui-button variant="filled" icon="arrow_back--outlined" @click="backToMap">返回地图</mdui-button>
            <mdui-chip variant="filled" icon="my_location--outlined">坐标工具</mdui-chip>
        </div>

        <div class="map-controls">
            <mdui-card class="control-group zoom-group">
                <mdui-button-icon icon="add--outlined" :disabled="transform.scale >= maxScale - 0.01" @click="zoomIn"
                    title="放大"></mdui-button-icon>
                <div class="scale-display">{{ scalePercent }}%</div>
                <mdui-button-icon icon="remove--outlined" :disabled="transform.scale <= minScale + 0.01" @click="zoomOut"
                    title="缩小"></mdui-button-icon>
            </mdui-card>
<!-- 
            <mdui-card class="control-group slider-group">
                <mdui-slider :value="transform.scale" :min="minScale" :max="maxScale" :step="0.01"
                    @input="setScaleBySlider($event.target.value)"></mdui-slider>
            </mdui-card> -->

            <mdui-card class="control-group action-group">
                <mdui-button-icon icon="center_focus_strong--outlined" @click="focusFirstMarker"
                    title="聚焦到第一个标记"></mdui-button-icon>
                <mdui-button-icon icon="refresh--outlined" @click="centerMap(true)" title="重置视图"></mdui-button-icon>
                <mdui-button-icon icon="build--outlined" :class="{ 'ctrl-btn-active': devToolsOpen && standalone }"
                    @click="toggleDevTools" :title="standalone ? '坐标工具' : '坐标工具页面'"></mdui-button-icon>
            </mdui-card>

            <mdui-dropdown class="control-group filter-group" placement="top-end">
                <mdui-button slot="trigger" variant="filled" icon="filter_list--outlined" end-icon="arrow_drop_down--outlined">
                    {{ currentFilterLabel }}
                </mdui-button>
                <mdui-menu selects="single" :value="localFilter" @change="selectFilter($event.target.value)">
                    <mdui-menu-item value="all" icon="apps--outlined" :end-text="String(mapItems.length)">{{ $t('filter.all') }}
                    </mdui-menu-item>
                    <mdui-menu-item v-for="t in filterType" :key="t.type" :value="t.type" icon="place--outlined"
                        :end-text="String(mapItems.filter(i => i.type === t.type).length)">{{ $t(t.name) }}
                    </mdui-menu-item>
                </mdui-menu>
            </mdui-dropdown>
        </div>

        <div class="minimap-scale-info">
            <mdui-chip v-if="collectMode" variant="filled" icon="location_searching--outlined">坐标采集模式开启 · 点击地图选取坐标
            </mdui-chip>
        </div>

        <transition name="slide">
            <div v-if="devToolsOpen" class="devtools-panel">
                <div class="devtools-header">
                    <div class="devtools-title">
                        <mdui-icon name="build--outlined"></mdui-icon>
                        <span>{{ standalone ? '地图坐标工具' : '地图开发者工具' }}</span>
                    </div>
                    <mdui-button-icon icon="close--outlined" variant="tonal" @click="devToolsOpen = false"
                        title="关闭面板"></mdui-button-icon>
                </div>

                <div class="devtools-body">
                    <mdui-card variant="outlined" class="tool-section">
                        <mdui-switch :checked="collectMode" @change="collectMode = $event.target.checked">坐标采集模式
                        </mdui-switch>
                    </mdui-card>

                    <mdui-card variant="outlined" class="tool-section">
                        <div class="tool-section-title">新增 / 编辑标记</div>
                        <div class="form-grid">
                            <mdui-text-field variant="outlined" label="ID *" :value="newMarker.id"
                                placeholder="如 land_mark_xxx"
                                @input="newMarker.id = $event.target.value"></mdui-text-field>
                            <mdui-select variant="outlined" label="类型 *" :value="newMarker.type"
                                @change="newMarker.type = $event.target.value">
                                <mdui-menu-item v-for="t in filterType" :key="t.type" :value="t.type">{{ $t(t.name) }}
                                </mdui-menu-item>
                            </mdui-select>
                            <mdui-text-field variant="outlined" label="名称 (i18n key 或 文字) *" :value="newMarker.name"
                                placeholder="如 markers.xxx.name"
                                @input="newMarker.name = $event.target.value"></mdui-text-field>
                            <mdui-text-field variant="outlined" label="图标文件名" :value="newMarker.icon"
                                placeholder="留空或 null 显示名称"
                                @input="newMarker.icon = $event.target.value"></mdui-text-field>
                            <mdui-text-field variant="outlined" type="number"
                                :label="'X 坐标' + (newMarker.originalX !== null ? '' : ' · 点击地图获取')"
                                :value="newMarker.originalX === null ? '' : newMarker.originalX" placeholder="X"
                                @input="newMarker.originalX = $event.target.value === '' ? null : Number($event.target.value)"></mdui-text-field>
                            <mdui-text-field variant="outlined" type="number" label="Y 坐标"
                                :value="newMarker.originalY === null ? '' : newMarker.originalY" placeholder="Y"
                                @input="newMarker.originalY = $event.target.value === '' ? null : Number($event.target.value)"></mdui-text-field>
                            <mdui-text-field variant="outlined" class="form-item-full" label="介绍 / 描述" rows="2"
                                :value="newMarker.desc" placeholder="i18n key 或描述文字"
                                @input="newMarker.desc = $event.target.value"></mdui-text-field>
                        </div>
                        <div class="form-actions">
                            <mdui-button variant="text" @click="resetNewMarker">清空</mdui-button>
                            <mdui-button variant="filled" :disabled="!newMarkerValid" @click="addOrUpdateTempMarker">{{
                                editingTempId ? '更新标记' : '添加到列表' }}</mdui-button>
                        </div>
                    </mdui-card>

                    <mdui-card variant="outlined" class="tool-section">
                        <div class="tool-section-title-row">
                            <span class="tool-section-title">待导出标记 ({{ tempMarkers.length }})</span>
                            <mdui-button v-if="tempMarkers.length" variant="text" @click="clearTempMarkers">清空全部
                            </mdui-button>
                        </div>
                        <div v-if="tempMarkers.length === 0" class="empty-hint">暂无待导出标记，添加后将显示在此处</div>
                        <div v-else class="temp-list">
                            <div v-for="m in tempMarkers" :key="m._tempId" class="temp-list-item"
                                :class="{ editing: m._tempId === editingTempId }">
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
                                    <mdui-button-icon icon="center_focus_strong--outlined" title="聚焦"
                                        @click="focusTempMarker(m)"></mdui-button-icon>
                                    <mdui-button-icon icon="edit--outlined" title="编辑"
                                        @click="editTempMarker(m)"></mdui-button-icon>
                                    <mdui-button-icon icon="delete--outlined" title="删除"
                                        @click="deleteTempMarker(m._tempId)"></mdui-button-icon>
                                </div>
                            </div>
                        </div>
                    </mdui-card>

                    <mdui-card variant="outlined" class="tool-section">
                        <div class="tool-section-title">JSON 导出</div>
                        <div class="export-actions">
                            <div class="export-col">
                                <div class="export-label">仅新增标记</div>
                                <div class="btn-row">
                                    <mdui-button variant="tonal" :disabled="!tempMarkers.length" @click="copyJson('new')">
                                        复制</mdui-button>
                                    <mdui-button variant="tonal" :disabled="!tempMarkers.length"
                                        @click="downloadJson('new')">下载</mdui-button>
                                </div>
                            </div>
                            <div class="export-col">
                                <div class="export-label">完整 map_markers.json</div>
                                <div class="btn-row">
                                    <mdui-button variant="filled" @click="copyJson('full')">复制</mdui-button>
                                    <mdui-button variant="filled" @click="downloadJson('full')">下载</mdui-button>
                                </div>
                            </div>
                        </div>
                        <mdui-collapse class="json-preview">
                            <mdui-collapse-item header="预览 JSON (新增部分)">
                                <pre>{{ newOnlyJson || '// 暂无新增标记' }}</pre>
                            </mdui-collapse-item>
                        </mdui-collapse>
                    </mdui-card>
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

.tool-bar>* {
    pointer-events: auto;
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
    display: flex;
    overflow: hidden;
}

.zoom-group {
    flex-direction: column;
    align-items: center;
    padding: 4px;
}

.slider-group {
    padding: 4px 16px;
    width: 200px;
}

.slider-group mdui-slider {
    width: 100%;
}

.action-group {
    flex-direction: column;
    align-items: center;
    padding: 4px;
}

.filter-group {
    overflow: visible;
}

.scale-display {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-color-oc);
    letter-spacing: 0.3px;
    padding: 2px 0;
    min-width: 42px;
}

.ctrl-btn-active {
    color: var(--theme-color-2) !important;
}

.minimap-scale-info {
    position: absolute;
    left: 16px;
    bottom: 24px;
    z-index: 100;
    pointer-events: none;
}

.devtools-panel {
    position: absolute;
    top: 0;
    right: 0;
    height: 100%;
    width: 400px;
    max-width: 92vw;
    background: #fff;
    box-shadow: -8px 0 24px rgba(0, 0, 0, 0.1);
    z-index: 200;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--border-color);
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: var(--theme-color-2);
    color: #fff;
}

.devtools-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
}

.devtools-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 18px 28px;
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.tool-section {
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.tool-section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-color);
}

.tool-section-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px 12px;
}

.form-item-full {
    grid-column: 1 / -1;
}

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 14px;
    justify-content: flex-end;
}

.empty-hint {
    font-size: 12px;
    color: var(--text-color-oc);
    padding: 12px;
    text-align: center;
    border-radius: 8px;
    border: 1px dashed var(--border-color);
}

.temp-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 260px;
    overflow-y: auto;
}

.temp-list-item {
    border: 1px solid var(--border-color);
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
    color: var(--text-color);
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
    color: var(--text-color-oc);
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
}

.export-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
}

.export-col {
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.export-label {
    font-size: 11px;
    color: var(--text-color-oc);
    font-weight: 500;
}

.btn-row {
    display: flex;
    gap: 6px;
}

.btn-row mdui-button {
    flex: 1;
}

.json-preview {
    margin-top: 4px;
}

.json-preview pre {
    margin: 0;
    padding: 12px;
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-color-oc);
    max-height: 220px;
    overflow: auto;
    font-family: 'Consolas', 'Menlo', monospace;
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
}
</style>
