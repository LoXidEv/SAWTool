<script>
import skinsData from '@/assets/configdata/skinsData.json'

export default {
    data() {
        return {
            skinsData: skinsData.skinsData
        }
    },
    props: {
        skin: {
            type: Object,
            default: () => ({})
        }
    }
}
</script>

<template>
    <mdui-card variant="elevated" class="skin_item animate__animated animate__fadeIn">
        <img :src="skin.image" alt="" class="skin_image">
        <div class="skin_title">{{ skin.title }}</div>
        <div class="skin_tags">
            <div v-for="tag in skin.tages" :key="tag" class="skin_tag">{{ $t(tag) }}</div>
        </div>
        <div class="skin_desc">{{ skin.desc }}</div>
        <div class="skin_author">@{{skinsData.author.find(item => item.id === skin.authorId).name}}</div>
        <!-- <mdui-segmented-button-group full-width>
          <mdui-segmented-button @click="$router.push(`/skins/author/${skin.authorId}`)" icon="account_box--outlined">{{
            $t('skins.button.author') }}</mdui-segmented-button>
          <mdui-segmented-button @click="$router.push(`/skins/detail/${skin.id}`)" icon="dehaze--outlined">{{
            $t('skins.button.detail') }}</mdui-segmented-button>
          <mdui-segmented-button icon="add_box--outlined" disabled>{{ $t('skins.button.star') }}</mdui-segmented-button>
        </mdui-segmented-button-group> -->
        <div class="skin_buttons">
            <mdui-button-icon variant="standard" @click="$router.push(`/skins/detail/${skin.id}`)"
                icon="pageview--outlined"></mdui-button-icon>
            <mdui-button-icon variant="standard" icon="edit--outlined"
                @click="$router.push(`/skins/edit?id=${skin.id}`)"></mdui-button-icon>
        </div>
    </mdui-card>
</template>


<style scoped>
.skin_buttons {
    width: 100%;
    justify-content: end;
    display: flex;
    gap: 4px;
}

.skin_tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: 2px 0;
}

.skin_tag {
    font-size: 12px;
    padding: 0px 6px;
    background: var(--theme-color-2);
    color: #fff;
    border-radius: var(--card-border-radius);
}

.skin_item {
    padding: 8px;
}

.skin_image {
    width: 100%;
    max-height: 340px;
    object-fit: contain;
    border-radius: var(--card-border-radius);
}

.skin_title {
    font-size: 18px;
    font-weight: bold;
}

.skin_desc {
    font-size: 14px;
    color: var(--text-color-oc);
}

.skin_author {
    font-size: 12px;
    color: var(--text-color-oc);
    text-align: right;
    margin-bottom: 8px;
}
</style>
