import './assets/main.css'
import WebInfo from '@/WebInfo/config.json'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// i18n Config
import { i18n } from '@/i18n/i18n.js'

// Mdui2 Config
import 'mdui/mdui.css'
import 'mdui'
import { setColorScheme } from 'mdui/functions/setColorScheme.js'
setColorScheme('#4056B0')

// Animate.css Config
import 'animate.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)

// Global Methods 
app.config.globalProperties.changeTitle = title => {
    document.title = title + ' - ' + WebInfo.SITE_NAME
    return title
}

app.mount('#app')
