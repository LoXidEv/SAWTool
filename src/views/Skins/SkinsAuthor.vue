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
      author: {},
      skins: {}
    }
  },
  methods: {
  },
  mounted() {
    if (this.skinsData.author.find(item => item.id == Number(this.$route.params.id))) {
      this.skins = this.skinsData.skins.filter(item => item.authorId == Number(this.$route.params.id))
      this.author = this.skinsData.author.find(item => item.id == Number(this.$route.params.id))
    } else {
      this.$router.push({ name: 'notfound' })
    }
  }
}
</script>

<template>
  <div class="animate__animated animate__fadeIn">
    <mdui-card class="card">
      <div class="card_title">{{ $t('skins.skinsAuthor.title') }}</div>
      <div class="card_content">{{ $t('skins.skinsAuthor.content') }}</div>
    </mdui-card>
    <mdui-button full-width variant="elevated" @click="$router.push('/skins')">{{ $t('skins.skinsDetail.button.back')
    }}</mdui-button>
    <mdui-card variant="elevated" class="author_detail">
      <div class="author_profile">
        <img :src="author.avatar" :alt="author.name" class="author_avatar" />
        <div>
          <div class="author_name">{{ author.name }} <span class="author_id">#{{ author.id }}</span></div>
          <div class="author_desc">{{ author.desc }}</div>
        </div>
      </div>
      <div class="author_stats">
        <div class="author_stats_item">
          <div class="author_stats_item_value">{{ skins.length }}</div>
          <div class="author_stats_item_label">{{ $t('skins.skinsAuthor.skinCount') }}</div>
        </div>
      </div>
    </mdui-card>
    <div class="skins_list" v-if="skins.length > 0">
      <SkinsCard v-for="skin in skins" :key="skin.id" :skin="skin" />
    </div>
  </div>
</template>

<style scoped>
.skins_list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(264px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.author_stats {
  display: flex;
  gap: 20px;
}

.author_stats_item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.author_stats_item_value {
  font-size: 24px;
  font-weight: bold;
}

.author_stats_item_label {
  font-size: 14px;
  color: var(--text-color-oc);
}

.author_id {
  font-size: 20px;
  color: var(--theme-color-2);
}

.author_profile {
  display: flex;
  align-items: end;
  gap: 20px;
}

.author_detail {
  margin-top: 8px;
  display: flex;
  align-items: end;
  justify-content: space-between;
  flex-wrap: wrap;
  padding: 20px;
  margin-bottom: 8px;
  gap: 20px;
}

.author_avatar {
  width: 100px;
  height: 100px;
  border-radius: var(--card-border-radius);
}

.author_name {
  font-size: 24px;
  font-weight: bold;
}

.author_desc {
  color: var(--text-color-oc);
}
</style>
