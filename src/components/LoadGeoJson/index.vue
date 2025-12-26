<!--
 * @Author: dys
 * @Date: 2025-12-26 09:49:08
 * @LastEditors: dys
 * @LastEditTime: 2025-12-26 16:54:19
 * @Descripttion: 
-->
<template>
  <div>
    <div id="cesiumContainer"></div>
    <Plane v-if="viewer" :viewer="viewer" />
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
    destination: Cesium.Cartesian3.fromDegrees(116.39068, 39.91634, 2000.0),
  })
})
</script>
<style lang="less" scoped></style>
