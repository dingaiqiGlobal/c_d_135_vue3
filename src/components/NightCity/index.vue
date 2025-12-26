<!--
 * @Author: dys
 * @Date: 2025-12-26 09:49:08
 * @LastEditors: dys
 * @LastEditTime: 2025-12-26 14:16:36
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
    destination: Cesium.Cartesian3.fromDegrees(113.36014084147262, 23.10896926740387, 2000.0),
    orientation: {
      heading: Cesium.Math.toRadians(293.6635524369704),
      pitch: Cesium.Math.toRadians(-22.617957999782014),
      roll: Cesium.Math.toRadians(0.0013787893420239103),
    },
  })
})
</script>
<style lang="less" scoped></style>
