<script>
import skinsData from '@/assets/configdata/skinsData.json'
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

export default {
  data() {
    return {
      skinsData: skinsData.skinsData,
      author: {},
      skin: {}
    }
  },
  methods: {
    highlightCode(code) {
      return hljs.highlight(code, { language: 'json' });
    }
  },
  mounted() {
    if (this.skinsData.skins.find(item => item.id == Number(this.$route.params.id))) {
      this.skin = this.skinsData.skins.find(item => item.id == Number(this.$route.params.id))
      this.author = this.skinsData.author.find(item => item.id == Number(this.skin.authorId))
    } else {
      this.$router.push({ name: 'notfound' })
    }
  }
}
</script>

<template>
  <div class="animate__animated animate__fadeIn">
    <mdui-card class="card">
      <div class="card_title">{{ $t('skins.skinsDetail.title') }}</div>
      <div class="card_content">{{ $t('skins.skinsDetail.content') }}</div>
    </mdui-card>
    <div class="skin_detail">
      <mdui-card variant="elevated" class="detail_image_card">
        <img :src="skin.image" :alt="skin.title" class="detail_image">
      </mdui-card>
      <mdui-card variant="elevated" class="detail_info">
        <div>
          <div class="detail_info_title">{{ skin.title }}</div>
          <div class="detail_info_desc">{{ skin.desc }}</div>
          <div class="detail_info_tages">
            <div v-for="tag in skin.tages" :key="tag" class="detail_info_tag">{{ $t(tag) }}</div>
          </div>
          <div class="detail_info_config">
            <div class="detail_info_config_title">{{ $t('skins.skinsDetail.config') }}</div>
            <div v-for="config in skin.config" :key="config.key">
              <span class="detail_info_config_label">{{ $t(`skins.skinsDetail.configOwn.${config.own}`) }}</span>
              <a :href="`https://wiki.animalroyale.com/wiki/File:${config.key}.png`" target="_blank"
                class="detail_info_config_item">{{ decodeURIComponent(config.key) }}</a>
            </div>
          </div>
          <div class="detail_info_author_card">
            <div class="detail_info_author">
              <img :src="author.avatar" :alt="author.name" class="author_avatar">
              <div>
                <div class="author_name">{{ author.name }}<span class="author_id">#{{ author.id }}</span></div>
                <div class="author_desc">{{ author.desc }}</div>
              </div>
            </div>
            <mdui-button-icon variant="standard"
              @click="$router.push({ name: 'skinsAuthor', params: { id: author.id } })"
              icon="search--outlined"></mdui-button-icon>
          </div>
        </div>
        <mdui-button full-width variant="filled" @click="$router.push('/skins')">{{ $t('skins.skinsDetail.button.back')
          }}</mdui-button>
      </mdui-card>
    </div>
    <mdui-card variant="elevated" class="detail_info_code_card">
      <div class="detail_info_code_title">{{ $t('skins.skinsDetail.data.skin') }}</div>
      <div v-html="highlightCode(JSON.stringify(skin)).value" class="detail_info_code">
      </div>
      <div class="detail_info_code_title">{{ $t('skins.skinsDetail.data.author') }}</div>
      <div v-html="highlightCode(JSON.stringify(author)).value" class="detail_info_code">
      </div>
    </mdui-card>
  </div>
</template>

<style scoped>
@media screen and (max-width: 840px) {
  .skin_detail {
    flex-wrap: wrap;
  }

  .detail_image_card {
    width: 100%;
  }
}

.detail_info_config_label {
  font-size: 14px;
  color: var(--text-color-oc);
  margin-right: 8px;
}

.detail_info_config_title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 6px;
}

.detail_info_config {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
}

.detail_info_config_item {
  width: fit-content;
  color: var(--theme-color-2);
  text-decoration: none;
  transition: all 0.4s;
  font-size: 14px;
  border-radius: var(--card-border-radius);
}

.detail_info_config_item:hover {
  background: var(--theme-color-2-oc);
  color: #fff;
  padding: 2px 6px;
}

.detail_info_code_title {
  font-size: 16px;
  font-weight: bold;
}

.detail_info_code {
  margin: 10px 0;
  font-size: 14px;
  word-break: break-word;
}

.detail_info_code_card {
  padding: 20px;
}

.detail_info_tages {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 2px 0;
}

.detail_info_tag {
  font-size: 14px;
  padding: 0px 6px;
  background: var(--theme-color-2);
  color: #fff;
  border-radius: var(--card-border-radius);
}

.detail_info_title {
  font-size: 24px;
  font-weight: bold;
}

.detail_info_desc {
  color: var(--text-color-oc);
}

.detail_info_author {
  display: flex;
  align-items: center;
}

.detail_info_author_card {
  margin-top: 20px;
  display: inline-flex;
  gap: 20px;
  justify-content: space-between;
  align-items: center;
  border-radius: var(--card-border-radius);
  border: 2px solid var(--border-color);
  padding: 4px 6px;
  margin-bottom: 20px;
}

.author_avatar {
  width: 46px;
  height: 46px;
  border-radius: var(--card-border-radius);
  margin-right: 10px;
}

.author_name {
  font-size: 16px;
  font-weight: bold;
}

.author_id {
  margin-left: 5px;
  font-size: 12px;
  color: var(--theme-color-2);
}

.author_desc {
  font-size: 14px;
  color: var(--text-color-oc);
}

.skin_detail {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  width: 100%;
}

.detail_image_card {
  min-width: 34%;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.detail_image {
  width: 100%;
  max-height: 500px;
  object-fit: contain;
}

.detail_info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 100%;
  padding: 20px;
}
</style>
