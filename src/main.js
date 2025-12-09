/*
 * @Author: dys
 * @Date: 2025-12-09 09:31:51
 * @LastEditors: dys
 * @LastEditTime: 2025-12-09 15:00:25
 * @Descripttion:
 */
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')
