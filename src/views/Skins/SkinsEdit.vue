<script>
import skinsKeyData from '@/assets/configdata/skinsKeyData.json'
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

export default {
  data() {
    return {
      skinsKeyData: skinsKeyData.skinsKeyData,
      Outfits: skinsKeyData.skinsKeyData.find(item => item.own == 'Outfit').key,
      Facewears: skinsKeyData.skinsKeyData.find(item => item.own == 'Facewear').key,
      Hats: skinsKeyData.skinsKeyData.find(item => item.own == 'Hat').key,
      Neckwears: skinsKeyData.skinsKeyData.find(item => item.own == 'Neckwear').key,
      Eyewears: skinsKeyData.skinsKeyData.find(item => item.own == 'Eyewear').key,
      Animals: skinsKeyData.skinsKeyData.find(item => item.own == 'Animal').key,
      isSelected: {
        Outfit: "Outfit",
        Facewear: "Facewear",
        Hat: "Hat",
        Neckwear: "Neckwear",
        Eyewear: "Eyewear",
        Animal: "Animal"
      },
      configJSON: ["Outfit", "Facewear", "Hat", "Neckwear", "Eyewear", "Animal"],
      searchKey: {
        Outfit: "",
        Facewear: "",
        Hat: "",
        Neckwear: "",
        Eyewear: "",
        Animal: ""
      },
      searchResult: {
        Outfit: "",
        Facewear: "",
        Hat: "",
        Neckwear: "",
        Eyewear: "",
        Animal: ""
      },
      isShowAll: {
        Outfit: false,
        Facewear: false,
        Hat: false,
        Neckwear: false,
        Eyewear: false,
        Animal: false
      },
      skinJSON: {},
      skinInfo: {
        id: null,
        authorId: null,
        title: "",
        desc: "",
        tages: [
          "skins.tages.players"
        ],
        config: [
        ],
        image: ""
      }
    }
  },
  methods: {
    highlightCode(code) {
      return hljs.highlight(code, { language: 'json' });
    },
    GenerateSkinJSON() {
      for (let item of this.configJSON) {
        if (this.skinInfo.config.find(config => config.own == item)) {
          const config = this.skinInfo.config.find(config => config.own == item)
          config.key = this.isSelected[item]
        } else {
          this.skinInfo.config.push({
            own: item,
            key: this.isSelected[item]
          })
        }
      }
      this.skinJSON = {
        ...this.skinInfo
      }
    },
    Search(item, key) {
      if (key == "") {
        return
      }
      if (item == "Outfit") {
        this.searchResult.Outfit = this.Outfits.filter(item => item.includes(key))
      } else if (item == "Facewear") {
        this.searchResult.Facewear = this.Facewears.filter(item => item.includes(key))
      } else if (item == "Hat") {
        this.searchResult.Hat = this.Hats.filter(item => item.includes(key))
      } else if (item == "Neckwear") {
        this.searchResult.Neckwear = this.Neckwears.filter(item => item.includes(key))
      } else if (item == "Eyewear") {
        this.searchResult.Eyewear = this.Eyewears.filter(item => item.includes(key))
      } else if (item == "Animal") {
        this.searchResult.Animal = this.Animals.filter(item => item.includes(key))
      }
    }
  },
  watch: {
    isSelected: {
      handler(newVal, oldVal) {
        this.GenerateSkinJSON()
      },
      deep: true
    },
    skinInfo: {
      handler(newVal, oldVal) {
        this.GenerateSkinJSON()
      },
      deep: true
    },
    searchKey: {
      handler(newVal, oldVal) {
        if (newVal.Outfit) {
          this.Search('Outfit', newVal.Outfit)
        } else if (newVal.Facewear) {
          this.Search('Facewear', newVal.Facewear)
        } else if (newVal.Hat) {
          this.Search('Hat', newVal.Hat)
        } else if (newVal.Neckwear) {
          this.Search('Neckwear', newVal.Neckwear)
        } else if (newVal.Eyewear) {
          this.Search('Eyewear', newVal.Eyewear)
        } else if (newVal.Animal) {
          this.Search('Animal', newVal.Animal)
        } else {
          this.searchResult = {
            Outfit: "",
            Facewear: "",
            Hat: "",
            Neckwear: "",
            Eyewear: "",
            Animal: ""
          }
        }
      },
      deep: true
    },
  },
  mounted() {
    this.GenerateSkinJSON()
  }
}
</script>

<template>
  <div class="animate__animated animate__fadeIn">
    <mdui-card class="card">
      <div class="card_title">{{ $t('skins.skinsEdit.title') }}</div>
      <div class="card_content">{{ $t('skins.skinsEdit.content') }}</div>
    </mdui-card>
    <mdui-button full-width variant="elevated" @click="$router.push('/skins')">{{ $t('skins.skinsDetail.button.back')
    }}</mdui-button>
    <mdui-card class="card" style="margin-top: 8px;">
      <div v-html="highlightCode(JSON.stringify(skinJSON)).value" class="detail_info_code">
      </div>
    </mdui-card>
    <mdui-card class="skins_edit">
      <mdui-text-field v-model="skinInfo.image" maxlength="10" counter variant="outlined"
        :label="$t('skins.skinsEdit.input.skinImage')"></mdui-text-field>
      <mdui-text-field v-model="skinInfo.title" maxlength="10" counter variant="outlined"
        :label="$t('skins.skinsEdit.input.skinName')"></mdui-text-field>
      <mdui-text-field v-model="skinInfo.desc" maxlength="24" variant="outlined"
        :label="$t('skins.skinsEdit.input.skinDescription')" counter></mdui-text-field>
      <mdui-text-field v-model="skinInfo.authorId" type="number" variant="outlined"
        :label="$t('skins.skinsEdit.input.skinAuthor')"></mdui-text-field>
      <mdui-list v-for="own in skinsKeyData" :key="own.own">
        <mdui-list-subheader>{{ $t('skins.skinsDetail.configOwn.' + own.own) }}</mdui-list-subheader>
        <mdui-text-field v-model="searchKey[own.own]" variant="outlined"
          :label="$t('skins.skinsEdit.input.Search')"></mdui-text-field>
        <div class="search_result">
          <div class="search_result_item" v-if="searchResult[own.own] == ''">{{ $t('skins.skinsEdit.noResult') }}</div>
          <button v-else class="search_result_item" @click="isSelected[own.own] = key"
            :class="{ 'active': isSelected[own.own] == key }" v-for="key in searchResult[own.own]">{{ key }}</button>
        </div>
        <mdui-button variant="text" full-width @click="isShowAll[own.own] = !isShowAll[own.own]">{{
          $t('skins.skinsEdit.button.showAll') }}</mdui-button>
        <mdui-collapse accordion>
          <mdui-collapse-item>
            <mdui-list-item slot="header" icon="near_me--outlined">
              <span v-if="isShowAll[own.own]">[{{ own.key.length }}]</span>
              <span style="color: var(--theme-color-2);font-weight: bold;">
                {{ isSelected[own.own] }}
              </span>
            </mdui-list-item>
            <div style="margin-left: 2.5rem" v-if="isShowAll[own.own]">
              <mdui-list-item v-for="key, index in own.key" @click="isSelected[own.own] = key" :key="key">
                <span
                  :style="{ 'font-weight': isSelected[own.own] == key ? 'bold' : 'normal', 'color': isSelected[own.own] == key ? 'var(--theme-color-2)' : 'var(--text-color-oc)' }">
                  [{{ index + 1 }}] {{ key }}
                </span>
              </mdui-list-item>
            </div>
          </mdui-collapse-item>
        </mdui-collapse>
        <mdui-divider></mdui-divider>
      </mdui-list>
    </mdui-card>
  </div>
</template>

<style scoped>
.detail_info_code {
  margin: 10px 0;
  font-size: 14px;
  word-break: break-word;
}

.search_result_item {
  font-weight: bold;
  font-family: 'Poppins Regular';
  color: var(--theme-color-2);
  font-size: 14px;
  padding: 2px 6px;
  background: #fff;
  border-radius: var(--card-border-radius);
  transition: all 0.3s;
  cursor: pointer;
  border: 2px solid var(--border-color);
}

.search_result_item:hover {
  border: 2px solid var(--theme-color-2-oc);
}

.search_result_item.active {
  border: 2px solid var(--theme-color-2);
}

.search_result {
  margin: 10px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.skins_edit {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 8px;
  width: 100%;
  padding: 20px;
}
</style>
