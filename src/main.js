import { createApp } from 'vue'
import { createPinia } from 'pinia'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import App from './App.vue'
import router from './router'
import { persistPlugin } from './stores/persist'
import './style.css'

dayjs.extend(relativeTime)

const pinia = createPinia()
pinia.use(persistPlugin)

const app = createApp(App)
app.use(pinia)
app.use(router)
app.mount('#app')
