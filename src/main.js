import { createApp } from 'vue'
import App from './App.vue'

const el = document.getElementById('course-finder-wizard')
if (el) {
  createApp(App).mount(el)
}
