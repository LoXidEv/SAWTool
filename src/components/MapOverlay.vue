<script>
export default {
    props: {
        width: {
            type: Number,
            required: true
        },
        height: {
            type: Number,
            required: true
        },
        XYitems: {
            type: Array,
            default: () => []
        },
        tempItems: {
            type: Array,
            default: () => []
        },
        collectMode: {
            type: Boolean,
            default: false
        },
        pendingX: {
            type: Number,
            default: null
        },
        pendingY: {
            type: Number,
            default: null
        }
    },
    emits: ['delete-temp'],
    data() {
        return {
            selectedItem: null,
            selectedTempItem: null,
            showDialog: false,
            showTempDialog: false
        }
    },
    methods: {
        MarkerClick(item) {
            this.selectedItem = item;
            this.showDialog = true;
        },
        TempMarkerClick(item) {
            this.selectedTempItem = item;
            this.showTempDialog = true;
        },
        CloseDetail() {
            this.showDialog = false;
            this.selectedItem = null;
        },
        CloseTempDetail() {
            this.showTempDialog = false;
            this.selectedTempItem = null;
        },
        DeleteTempMarker() {
            if (this.selectedTempItem) {
                this.$emit('delete-temp', this.selectedTempItem._tempId);
                this.CloseTempDetail();
            }
        },
        i18nText(key) {
            if (key === null || key === undefined) return '';
            if (typeof this.$t !== 'function') return key;
            const val = this.$t(key);
            // 统一走 i18n：存在翻译返回译文，否则原样返回便于排查
            return typeof val === 'string' ? val : key;
        },
        getMarkerTip(item) {
            const b = item.baseInfo || {};
            const name = this.i18nText(b.name);
            const desc = this.i18nText(b.desc);
            let tip = `(${Math.round(b.originalX)}, ${Math.round(b.originalY)}) ${name}`;
            if (desc) tip += `\n${desc}`;
            return tip;
        },
        markerTypeColor(type) {
            switch (type) {
                case 'quicktravel': return '#ffb144';
                case 'superite': return '#ff7a7a';
                case 'landmarkname': return '#4a6293';
                case 'oldmei': return '#00c0d1';
                default: return '#4a6293';
            }
        }
    }
};
</script>

<template>
    <div class="map-overlay" :style="{ width: width + 'px', height: height + 'px' }">
        <template v-for="item in XYitems" :key="item.id">
            <button v-if="item.type !== 'oldmei'" class="map-marker" @click="MarkerClick(item)"
                :style="{ left: item.baseInfo.originalX + 'px', top: item.baseInfo.originalY + 'px' }"
                :title="getMarkerTip(item)">
                <img class="marker-icon" v-if="item.baseInfo.icon !== 'null' && item.baseInfo.icon" :src="'/image/icon/' + item.baseInfo.icon"
                    alt="Marker Icon" />
                <div v-else class="marker-name">
                    {{ i18nText(item.baseInfo.name) }}
                </div>
            </button>
            <img v-else class="map-marker-oldmei" src="/image/route/route_npc_oldmei.png" alt="Marker Icon" />
        </template>

        <template v-for="m in tempItems" :key="m._tempId">
            <button
                class="map-marker temp-marker"
                :style="{
                    left: (m.originalX ?? 0) + 'px',
                    top: (m.originalY ?? 0) + 'px',
                    '--temp-color': markerTypeColor(m.type)
                }"
                @click="TempMarkerClick(m)"
                :title="`[临时] (${m.originalX}, ${m.originalY}) ${m.id}${m.name ? ' · ' + i18nText(m.name) : ''}`"
            >
                <div class="temp-pulse"></div>
                <div class="temp-dot"></div>
                <div class="temp-id-label">{{ m.id }}</div>
            </button>
        </template>

        <div
            v-if="collectMode && pendingX !== null && pendingY !== null"
            class="pending-marker"
            :style="{ left: pendingX + 'px', top: pendingY + 'px' }"
        >
            <div class="pending-ripple"></div>
            <div class="pending-cross">
                <span class="cross-h"></span>
                <span class="cross-v"></span>
            </div>
            <div class="pending-coord">X:{{ pendingX }} · Y:{{ pendingY }}</div>
        </div>

        <Teleport to="body">
            <mdui-dialog class="map-marker-detail" :open="showDialog" headline-position="center" @close="CloseDetail">
                <div v-if="selectedItem" slot="headline">{{ i18nText(selectedItem.baseInfo.name) }}</div>
                <div class="map-marker-content">
                    <p v-if="selectedItem">{{ i18nText(selectedItem.baseInfo.desc) }}</p>
                    <div v-if="selectedItem" class="marker-coord-info">
                        <span>坐标：({{ Math.round(selectedItem.baseInfo.originalX) }}, {{ Math.round(selectedItem.baseInfo.originalY) }})</span>
                        <span class="marker-type-chip" :style="{ background: markerTypeColor(selectedItem.type) + '18', color: markerTypeColor(selectedItem.type) }">
                            {{ selectedItem.type }}
                        </span>
                    </div>
                </div>
                <div slot="action">
                    <mdui-button @click="CloseDetail" variant="text">{{ this.$t ? $t('close') : '关闭' }}</mdui-button>
                </div>
            </mdui-dialog>

            <mdui-dialog class="map-marker-detail" :open="showTempDialog" headline-position="center" @close="CloseTempDetail">
                <div v-if="selectedTempItem" slot="headline">
                    <span style="display:inline-block;vertical-align:middle;margin-right:8px;font-size:12px;padding:2px 8px;border-radius:999px;background:var(--theme-color-2-oc-up);color:var(--theme-color-2);">临时</span>
                    {{ selectedTempItem.name ? i18nText(selectedTempItem.name) : selectedTempItem.id }}
                </div>
                <div class="map-marker-content" v-if="selectedTempItem">
                    <div class="temp-detail-grid">
                        <div class="detail-row"><span class="detail-label">ID</span><span class="detail-value">{{ selectedTempItem.id }}</span></div>
                        <div class="detail-row"><span class="detail-label">类型</span><span class="detail-value">{{ selectedTempItem.type }}</span></div>
                        <div class="detail-row">
                            <span class="detail-label">坐标</span>
                            <span class="detail-value mono">({{ selectedTempItem.originalX }}, {{ selectedTempItem.originalY }})</span>
                        </div>
                        <div v-if="selectedTempItem.icon && selectedTempItem.icon !== 'null'" class="detail-row">
                            <span class="detail-label">图标</span><span class="detail-value">{{ selectedTempItem.icon }}</span>
                        </div>
                        <div v-if="selectedTempItem.desc" class="detail-row desc-row">
                            <span class="detail-label">介绍</span>
                            <span class="detail-value">{{ i18nText(selectedTempItem.desc) }}</span>
                        </div>
                    </div>
                </div>
                <div slot="action">
                    <mdui-button @click="DeleteTempMarker" variant="text" color="red">删除</mdui-button>
                    <mdui-button @click="CloseTempDetail" variant="text">{{ this.$t ? $t('close') : '关闭' }}</mdui-button>
                </div>
            </mdui-dialog>
        </Teleport>
    </div>
</template>

<style scoped>
.map-marker-oldmei {
    width: 100%;
    z-index: 9999;
}

.map-marker-detail {
    --mdui-dialog-max-width: 360px;
}

.map-marker-content {
    padding: 0 24px 24px;
}

.marker-coord-info {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f3f4f6;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    color: #6b7280;
}

.marker-type-chip {
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 600;
}

.map-overlay {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 10;
}

.map-marker {
    position: absolute;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: auto;
    border: none;
    background: transparent;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.map-marker:hover {
    transform: translate(-50%, -50%) scale(1.1);
}

.marker-icon {
    width: 40px;
    height: 40px;
}

.marker-name {
    font-size: 26px;
    color: #ffffff;
    text-shadow: 0 0 8px #000000, 0 2px 4px rgba(0,0,0,0.5);
    text-align: center;
    font-weight: bold;
    line-height: 1.1;
    white-space: nowrap;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
}

.temp-marker {
    z-index: 50;
    padding: 0;
    width: 48px;
    height: 48px;
    justify-content: center;
    align-items: center;
    --temp-color: var(--theme-color-2);
}

.temp-marker:hover {
    transform: translate(-50%, -50%) scale(1.12);
}

.temp-pulse {
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--temp-color);
    opacity: 0.3;
    animation: temp-pulse-anim 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes temp-pulse-anim {
    0% { transform: scale(0.8); opacity: 0.4; }
    80%, 100% { transform: scale(2); opacity: 0; }
}

.temp-dot {
    position: relative;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--temp-color);
    border: 2.5px solid #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3), 0 0 0 2px var(--temp-color);
}

.temp-id-label {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 4px;
    padding: 2px 8px;
    background: rgba(17, 24, 39, 0.82);
    color: #fff;
    font-size: 10px;
    font-weight: 600;
    border-radius: 4px;
    white-space: nowrap;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.28);
}

.pending-marker {
    position: absolute;
    transform: translate(-50%, -50%);
    z-index: 80;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.pending-ripple {
    position: absolute;
    width: 52px;
    height: 52px;
    border-radius: 50%;
    border: 2px solid var(--theme-color-2);
    animation: pending-ripple-anim 1.2s ease-out infinite;
    transform: translate(-50%, -50%);
    left: 50%;
    top: 50%;
}

@keyframes pending-ripple-anim {
    0% { width: 20px; height: 20px; opacity: 1; }
    100% { width: 60px; height: 60px; opacity: 0; }
}

.pending-cross {
    position: relative;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.pending-cross::before {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #4a629333;
    border: 2px solid var(--theme-color-2);
    box-shadow: 0 0 0 3px #4a629326;
}

.cross-h, .cross-v {
    position: absolute;
    background: var(--theme-color-2);
    box-shadow: 0 0 4px #4a629399;
}

.cross-h {
    width: 32px;
    height: 1.5px;
}

.cross-v {
    width: 1.5px;
    height: 32px;
}

.pending-coord {
    margin-top: 8px;
    padding: 4px 10px;
    background: var(--theme-color-2);
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    border-radius: 6px;
    white-space: nowrap;
    font-family: 'Consolas', monospace;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
}

.temp-detail-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.detail-row {
    display: grid;
    grid-template-columns: 64px 1fr;
    gap: 10px;
    align-items: flex-start;
    font-size: 13px;
}

.detail-label {
    color: #9ca3af;
    font-weight: 500;
    font-size: 12px;
    padding-top: 1px;
}

.detail-value {
    color: #111827;
    font-weight: 500;
    word-break: break-all;
}

.detail-value.mono {
    font-family: 'Consolas', monospace;
    color: var(--theme-color-2);
    font-size: 12px;
}

.desc-row .detail-value {
    line-height: 1.55;
    color: #374151;
    font-weight: 400;
}
</style>
