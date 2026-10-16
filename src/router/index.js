import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NotFound from '../views/Error/Notfound.vue'
import MapView from '../views/MapView.vue'
import MapToolView from '../views/MapToolView.vue'
import { setTheme } from 'mdui/functions/setTheme.js'
import SkinsView from '../views/Skins/SkinsView.vue'
import SkinsDetail from '../views/Skins/SkinsDetail.vue'
import SkinsAuthor from '../views/Skins/SkinsAuthor.vue'
import SkinsEdit from '../views/Skins/SkinsEdit.vue'
import CouponCodesList from '../views/CouponCodes/CouponCodesList.vue'
import CommandView from '../views/Command/CommandView.vue'
import NewsView from '../views/News/NewsView.vue'
import NewsDetail from '../views/News/NewsDetail.vue'
import NewsEdit from '../views/News/NewsEdit.vue'
import NewsApi from '../views/News/NewsApi.vue'

import WebInfo from '@/WebInfo/config.json'

const SITE_NAME = WebInfo.SITE_NAME

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/:pathMatch(.*)*',
      name: 'notfound',
      meta: {
        title: '404 - ' + SITE_NAME,
      },
      component: NotFound,
    },
    {
      path: '/skins',
      name: 'skins',
      meta: {
        title: 'Skins - ' + SITE_NAME,
      },
      component: SkinsView,
    },
    {
      path: '/skins/detail/:id',
      name: 'skinsDetail',
      meta: {
        title: 'Skins Detail - ' + SITE_NAME,
      },
      component: SkinsDetail,
    },
    {
      path: '/skins/author/:id',
      name: 'skinsAuthor',
      meta: {
        title: 'Skins Author - ' + SITE_NAME,
      },
      component: SkinsAuthor,
    },
    {
      path: '/skins/edit',
      name: 'skinsEdit',
      meta: {
        title: 'Skins Edit - ' + SITE_NAME,
      },
      component: SkinsEdit,
    },
    {
      path: '/couponCodes',
      name: 'couponCodes',
      meta: {
        title: 'CouponCodes - ' + SITE_NAME,
      },
      component: CouponCodesList,
    },
    {
      path: '/',
      name: 'home',
      meta: {
        title: 'Home - ' + SITE_NAME,
      },
      component: HomeView,
    },
    {
      path: '/commands',
      name: 'commands',
      meta: {
        title: 'Commands - ' + SITE_NAME,
      },
      component: CommandView,
    },
    {
      path: '/news',
      name: 'news',
      meta: {
        title: 'News - ' + SITE_NAME,
      },
      component: NewsView,
    },
    {
      path: '/news/detail/:id',
      name: 'newsDetail',
      meta: {
        title: 'News Detail - ' + SITE_NAME,
      },
      component: NewsDetail,
    },
    {
      path: '/news/edit',
      name: 'newsEdit',
      meta: {
        title: 'News Editor - ' + SITE_NAME,
      },
      component: NewsEdit,
    },
    {
      path: '/news/api',
      name: 'newsApi',
      meta: {
        title: 'News API - ' + SITE_NAME,
      },
      component: NewsApi,
    },
    {
      path: '/map',
      name: 'map',
      meta: {
        title: 'Map - ' + SITE_NAME,
      },
      component: MapView,
    },
    {
      path: '/map/tool',
      name: 'mapTool',
      meta: {
        title: 'Map Tool - ' + SITE_NAME,
        blank: true,
      },
      component: MapToolView,
    },
  ],
})

router.beforeEach((to, from) => {
  if (localStorage.getItem('isDark') == 'true') {
    setTheme('dark')
  } else {
    setTheme('light')
  }
  if (to.meta.title) {
    document.title = to.meta.title
  }
})

export default router
