/*
 * @Author: dys
 * @Date: 2025-12-09 09:31:51
 * @LastEditors: dys
 * @LastEditTime: 2025-12-09 15:06:46
 * @Descripttion:
 */
import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { viteStaticCopy } from 'vite-plugin-static-copy'
const cesiumSource = 'node_modules/cesium/Build/Cesium'
const cesiumBaseUrl = 'cesiumStatic'
import cesium from 'vite-plugin-cesium'
viteStaticCopy({
  targets: [
    { src: `${cesiumSource}/ThirdParty`, dest: cesiumBaseUrl },
    { src: `${cesiumSource}/Workers`, dest: cesiumBaseUrl },
    { src: `${cesiumSource}/Assets`, dest: cesiumBaseUrl },
    { src: `${cesiumSource}/Widgets`, dest: cesiumBaseUrl },
  ],
})

// https://vite.dev/config/
export default defineConfig({
  define: {
    CESIUM_BASE_URL: JSON.stringify(cesiumBaseUrl),
  },
  plugins: [vue(), vueDevTools(), cesium()],
  build: {
    // 让 Cesium 的资源路径正确构建
    assetsInlineLimit: 0,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
