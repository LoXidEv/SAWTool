import { createI18n } from 'vue-i18n'

import tcLocales from './locales/tc.json'
import zhLocales from './locales/zh.json'
import enLocales from './locales/en.json'

export const i18n = createI18n({
    legacy: false,
    locale: localStorage.getItem('lang') || 'zh',
    fallbackLocale: 'zh',
    messages: {
        tc: tcLocales,
        zh: zhLocales,
        en: enLocales,
    },
})