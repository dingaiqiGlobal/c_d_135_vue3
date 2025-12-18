<!--
 * @Author: dys
 * @Date: 2025-12-18 15:56:25
 * @LastEditors: dys
 * @LastEditTime: 2025-12-18 15:58:01
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
    destination: Cesium.Cartesian3.fromDegrees(116.39122, 39.9071, 10000.0),
  })
})
</script>
<style lang="less" scoped></style>
