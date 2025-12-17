<!--
 * @Author: dys
 * @Date: 2025-12-16 14:47:28
 * @LastEditors: dys
 * @LastEditTime: 2025-12-17 14:00:12
 * @Descripttion: 
-->
<template>
  <div>
    <div id="cesiumContainer"></div>
    <Plane :viewer="viewer" />
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import * as Cesium from 'cesium'
import ViewInit from '@/utils/ViewInit'
import Plane from './Plane.vue'

let viewer = ref(null)

onMounted(() => {
  ViewInit.init()
  viewer.value = ViewInit.viewer
  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.19767, 39.99277, 10000.0),
  })
})
</script>
<style lang="less" scoped></style>
