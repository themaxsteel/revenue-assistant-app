import { createApp } from 'vue'
import { createPinia } from 'pinia'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import App from './App.vue'
import router from './router'
import './style.css'

dayjs.extend(relativeTime)

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')
