<script>
import { setTheme } from 'mdui/functions/setTheme.js';
import Footer from './components/Footer.vue';

export default {
  components: {
    Footer,
  },
  data() {
    return {
      isDark: false,
      navItems: [
        { icon: 'home--outlined', text: 'home.title', route: '/' },
        { icon: 'map--outlined', text: 'map.title', route: '/map' },
      ]
    }
  },
  methods: {
    GetTitle(path) {
      console.log(path);
      if (this.navItems.find(item => item.route == path)) {
        return this.navItems.find(item => item.route == path).text;
      } else {
        return "SAWTool";
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
    }
  }
}
</script>

<template>
  <mdui-layout>
    <mdui-navigation-rail class="m_navrail animate__animated animate__slideInLeft" divider contained>
      <img class="logo" src="/image/sarlab-logo.webp" slot="top">
      <mdui-button-icon @click="ChangeTheme" :icon="isDark ? 'light_mode--outlined' : 'dark_mode--outlined'"
        slot="bottom"></mdui-button-icon>

      <mdui-navigation-rail-item @click="$router.push(item.route)" v-for="item in navItems" :key="item"
        :icon="item.icon">{{ $t(item.text)
        }}</mdui-navigation-rail-item>
    </mdui-navigation-rail>

    <mdui-top-app-bar class="animate__animated animate__slideInDown" v-if="$route.name !== 'home'" variant="small"
      scroll-target=".layout-main">
      <mdui-top-app-bar-title style="font-size: 16px;margin-left: 10px;">{{ $t('home.title') }} / {{
        $t(GetTitle($route.path)) }}</mdui-top-app-bar-title>
    </mdui-top-app-bar>

    <mdui-layout-main class="layout-main">
      <div v-if="['map'].includes($route.name) !== true" class="common_content">
        <RouterView />
        <Footer />
      </div>
      <div v-else class="full_content">
        <RouterView />
      </div>
    </mdui-layout-main>

    <mdui-navigation-bar class="m_navbar animate__animated animate__slideInUp" scroll-behavior="hide"
      scroll-threshold="30" scroll-target=".layout-main">
      <mdui-navigation-bar-item v-for="item in navItems" :icon="item.icon" :key="item.route"
        @click="$router.push(item.route)">{{ $t(item.text) }}</mdui-navigation-bar-item>
    </mdui-navigation-bar>
  </mdui-layout>
</template>

<style scoped>
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
