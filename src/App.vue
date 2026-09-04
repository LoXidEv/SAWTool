<script>
import { setTheme } from 'mdui/functions/setTheme.js';
import Footer from './components/Footer.vue';
import mapMarkers from '@/assets/configdata/map_markers.json';

export default {
  components: {
    Footer,
  },
  data() {
    return {
      isSetting: true,
      isDark: false,
      navItems: [
        { icon: 'home--outlined', text: 'home.title', route: '/', children: ["home"] },
        { icon: 'map--outlined', text: 'map.title', route: '/map', children: ["map"] },
        { icon: 'dry_cleaning--outlined', text: 'skins.title', route: '/skins', children: ["skinsDetail", "skinsEdit", "skinsAuthor", "skins"] },
        { icon: 'card_giftcard--outlined', text: 'couponCodes.title', route: '/couponCodes', children: ["couponCodes"] },
      ],
      filterType: mapMarkers.baseInfo.filter,
      selectedFilter: 'all'
    }
  },
  methods: {
    GetTitle(name) {
      // console.log(path);
      if (this.navItems.find(item => item.children.includes(name))) {
        return this.navItems.find(item => item.children.includes(name)).text;
      } else {
        return "notfound.title";
      }
    },
    ChangeTheme() {
      if (localStorage.getItem('isDark') !== 'true') {
        localStorage.setItem('isDark', 'true')
        setTheme('dark')
        this.isDark = true;
      } else {
        localStorage.setItem('isDark', 'false')
        setTheme('light')
        this.isDark = false;
      }
    },
    handleFilterChange(filter) {
      this.selectedFilter = filter;
    }
  }
};
</script>

<template>
  <RouterView v-if="$route.meta.blank" :filterValue="selectedFilter" />
  <mdui-layout v-else class="layout">
    <mdui-navigation-rail class="m_navrail animate__animated animate__fadeIn" divider>
      <img class="logo" src="/image/sawtool-logo.webp" slot="top">
      <!-- <mdui-button-icon @click="ChangeTheme" :icon="isDark ? 'light_mode--outlined' : 'dark_mode--outlined'"
        slot="bottom"></mdui-button-icon> -->

      <mdui-navigation-rail-item v-for="item in navItems" :key="item.route" @click="$router.push(item.route)"
        :icon="item.icon">{{ $t(item.text) }}
      </mdui-navigation-rail-item>
    </mdui-navigation-rail>

    <mdui-top-app-bar class="animate__animated animate__fadeIn" variant="small" scroll-target=".layout-main">
      <mdui-top-app-bar-title v-if="$route.name !== 'home'" style="font-size: 16px;margin-left: 10px;">{{
        $t('home.title') }} / {{
          $t(GetTitle($route.name)) }}
      </mdui-top-app-bar-title>
      <mdui-top-app-bar-title v-else style="font-size: 16px;margin-left: 10px;">{{ $t('home.title')
        }}</mdui-top-app-bar-title>

      <mdui-dropdown class="m_navbar animate__animated animate__fadeIn">
        <mdui-button-icon slot="trigger" icon="menu--outlined"></mdui-button-icon>
        <mdui-menu>
          <mdui-menu-item v-for="item in navItems" :key="item.route" @click="$router.push(item.route)"
            :icon="item.icon">{{ $t(item.text) }}</mdui-menu-item>
        </mdui-menu>
      </mdui-dropdown>
    </mdui-top-app-bar>

    <mdui-layout-main class="layout-main">
      <div v-if="['map'].includes($route.name) !== true" class="common_content">
        <RouterView />
        <Footer />
      </div>
      <div v-else>
        <RouterView :filterValue="selectedFilter" />
      </div>
    </mdui-layout-main>

    <!-- <mdui-navigation-bar class="m_navbar animate__animated animate__fadeIn" scroll-behavior="hide" 
      scroll-threshold="30" scroll-target=".layout-main">
      <mdui-navigation-bar-item v-for="item in navItems" :key="item.route" @click="$router.push(item.route)"
        :icon="item.icon">{{ $t(item.text) }}
      </mdui-navigation-bar-item>
    </mdui-navigation-bar> -->
  </mdui-layout>
</template>

<style scoped>
.layout {
  height: 100vh;
}

@media screen and (max-width: 680px) {
  .m_navrail {
    display: none !important;
  }

  .m_navbar {
    display: flex !important;
  }
}

.m_navbar {
  display: none;
}

.m_navrail {
  display: flex;
}

.logo {
  width: 50px;
  height: 50px;
}

.layout-main {
  min-height: 100vh;
  width: 100%;
}

.common_content {
  /* max-width: 800px; */
  padding: 20px;
}
</style>
