<!--
 * @Author: dys
 * @Date: 2025-12-17 14:59:09
 * @LastEditors: dys
 * @LastEditTime: 2025-12-17 15:53:53
 * @Descripttion: 
-->
<template>
  <div>
    <div id="cesiumContainer"></div>
    <!-- v-if="viewer" 父组件确保 viewer 存在后再渲染子组件 -->
    <Plane v-if="viewer" :viewer="viewer" />
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
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
