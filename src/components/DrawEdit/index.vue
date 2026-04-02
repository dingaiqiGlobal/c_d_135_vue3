<!--
 * @Author: dys
 * @Date: 2025-12-09 10:02:49
 * @LastEditors: dys
 * @LastEditTime: 2025-12-16 09:54:13
 * @Descripttion: 
-->
<template>
  <div class="draw-edit-root">
    <div id="cesiumContainer"></div>
    <Tabs />
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as Cesium from 'cesium'
import Tabs from './Tabs.vue'
import ViewInit from '@/utils/ViewInit'

let viewer = ref(null)

onMounted(() => {
  ViewInit.init()
  viewer.value = ViewInit.viewer
  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.22453, 40.55553, 10000.0),
  })
})
</script>
<style lang="less" scoped>
.draw-edit-root {
  position: relative;
  width: 100%;
  height: calc(100vh - 150px);
}

#cesiumContainer {
  width: 100%;
  height: 100%;
}
</style>
