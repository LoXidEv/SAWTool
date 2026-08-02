<script>
import skinsData from '@/assets/configdata/skinsData.json'
import SkinsCard from '@/components/SkinsCard.vue'

export default {
  components: {
    SkinsCard
  },
  data() {
    return {
      skinsData: skinsData.skinsData
    }
  },
}
</script>

<template>
  <div class="animate__animated animate__fadeIn">
    <mdui-card class="card">
      <div class="card_title">{{ $t('skins.title') }}</div>
      <div class="card_content">{{ $t('skins.content') }}</div>
    </mdui-card>
    <mdui-button full-width variant="elevated" @click="$router.push('/skins/edit')">{{ $t('skins.skinsDetail.button.edit')
    }}</mdui-button>
    <div class="skins_list">
      <SkinsCard v-for="skin in skinsData.skins" :key="skin.id" :skin="skin" />
    </div>
  </div>
</template>

<style scoped>
.skins_list {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(264px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}
</style>
