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
