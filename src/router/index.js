import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import NotFound from '../views/Error/Notfound.vue'
import MapView from '../views/MapView.vue'
import { setTheme } from 'mdui/functions/setTheme.js'

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
