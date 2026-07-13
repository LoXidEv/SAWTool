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
        }
    },
    data() {
        return {
            selectedItem: null,
            showDialog: false
        }
    },
    methods: {
        MarkerClick(item) {
            this.selectedItem = item;
            this.showDialog = true;
        },
        CloseDetail() {
            this.showDialog = false;
            this.selectedItem = null;
        }
    }
};
</script>

<template>
    <div class="map-overlay" :style="{ width: width + 'px', height: height + 'px' }">
        <div v-for="item in XYitems" :key="item.id">
            <button v-if="item.type !== 'oldmei'" class="map-marker" @click="MarkerClick(item)"
                :style="{ left: item.baseInfo.originalX + 'px', top: item.baseInfo.originalY + 'px' }"
                :title="`(${Math.round(item.baseInfo.originalX)}, ${Math.round(item.baseInfo.originalY)}) ${$t(item.baseInfo.name)}\n${$t(item.baseInfo.desc)}`">
                <img class="marker-icon" v-if="item.baseInfo.icon !== 'null'" :src="'/image/icon/' + item.baseInfo.icon"
                    alt="Marker Icon" />
                <div v-else
                    style="font-size: 26px;color: #ffffff;text-shadow: 0 0 8px #000000;text-align: center;font-weight: bold;">
                    {{ $t(item.baseInfo.name) }}
                </div>
            </button>
            <img v-else class="map-marker-oldmei" src="/image/route/route_npc_oldmei.png" alt="Marker Icon" />
        </div>

        <Teleport to="body">
            <mdui-dialog class="map-marker-detail" :open="showDialog" headline-position="center" @close="CloseDetail">
                <div v-if="selectedItem" slot="headline">{{ $t(selectedItem.baseInfo.name) }}</div>
                <div class="map-marker-content">
                    <p v-if="selectedItem">{{ $t(selectedItem.baseInfo.desc) }}</p>
                </div>
                <div slot="action">
                    <mdui-button @click="CloseDetail" variant="text">{{ $t('close') }}</mdui-button>
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
</style>
