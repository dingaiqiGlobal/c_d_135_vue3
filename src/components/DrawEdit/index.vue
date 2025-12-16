<!--
 * @Author: dys
 * @Date: 2025-12-09 10:02:49
 * @LastEditors: dys
 * @LastEditTime: 2025-12-16 09:54:13
 * @Descripttion: 
-->
<template>
  <div>
    <div id="cesiumContainer"></div>
    <Panel />
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as Cesium from 'cesium'
import Panel from './Panel.vue'
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
<style lang="less" scoped></style>
