<script>
import skinsData from '@/assets/configdata/skinsData.json'
import SkinsCard from '@/components/SkinsCard.vue'

export default {
  components: {
    SkinsCard
  },
  data() {
    return {
      skinsData: skinsData.skinsData,
      dealSkins: [],
      switchPage: {
        totalPage: 0,
        currentPage: 1,
        maxPage: 1,
        maxSkinCount: 20,
      }
    }
  },
  mounted() {
    this.switchPage.totalPage = Math.ceil(this.skinsData.skins.length / this.switchPage.maxSkinCount)
    this.switchPage.maxPage = this.switchPage.totalPage
    this.switchSkins(0)
  },
  methods: {
    switchSkins(page) {
      this.switchPage.currentPage += page
      this.dealSkins = this.skinsData.skins.slice((this.switchPage.currentPage - 1) * this.switchPage.maxSkinCount, (this.switchPage.currentPage) * this.switchPage.maxSkinCount)
    }
  },
}
</script>

<template>
  <div class="animate__animated animate__fadeIn">
    <mdui-card class="card">
      <div class="card_title">{{ $t('skins.title') }}</div>
      <div class="card_content">{{ $t('skins.content') }}</div>
      <div class="card_data">{{ $t('skins.skinsAuthor.skinCount') }} {{ skinsData.skins.length }}</div>
    </mdui-card>
    <mdui-button full-width variant="elevated" @click="$router.push('/skins/edit')">{{
      $t('skins.skinsDetail.button.edit')
    }}</mdui-button>
    <div class="skins_list">
      <SkinsCard v-for="skin in dealSkins" :key="skin.id" :skin="skin" />
    </div>
    <div class="add_button">
      <mdui-button full-width variant="elevated" :disabled="switchPage.currentPage === 1" @click="switchSkins(-1)">
        {{ $t('skins.skinsDetail.button.prev') }}
      </mdui-button>
      <mdui-chip elevated>{{ switchPage.currentPage }}/{{ switchPage.maxPage }}</mdui-chip>
      <mdui-button full-width variant="elevated" :disabled="switchPage.currentPage === switchPage.maxPage" @click="switchSkins(1)">
        {{ $t('skins.skinsDetail.button.next') }}
      </mdui-button>
    </div>
  </div>
</template>

<style scoped>
.add_button {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.skins_list {
  margin-top: 8px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(264px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.card_data {
  font-size: 14px;
  color: var(--text-color-oc);
}
</style>
