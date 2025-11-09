import { createApp } from 'vue'
import './styles/main.css'
import App from './App.vue'
import router from './app/router'
import { createPinia } from 'pinia'

createApp(App).use(router).use(createPinia()).mount('#app')
