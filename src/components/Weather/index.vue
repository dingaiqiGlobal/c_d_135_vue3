<!--
 * @Author: dys
 * @Date: 2025-12-16 14:47:28
 * @LastEditors: dys
 * @LastEditTime: 2025-12-16 15:46:11
 * @Descripttion: 
-->
<template>
  <div>
    <div id="cesiumContainer"></div>
    <Plane />
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as Cesium from 'cesium'
import ViewInit from '@/utils/ViewInit'
import Plane from './Plane.vue'

// import CustomPrimitive from './marsCloud/CustomPrimitive'

let viewer = ref(null)
// let volumeCloud = null

// //添加雷达回波
// const addWeather = () => {
//   fetch('data/json/volumeCloud.json')
//     .then((res) => {
//       return res.json()
//     })
//     .then((res) => {
//       let geometry = Cesium.BoxGeometry.fromDimensions({
//         vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
//         dimensions: new Cesium.Cartesian3(1, 1, 1),
//       })
//       const options = {
//         steps: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
//         colors: [
//           'rgb(0,0,0,0)',
//           'rgb(170,36,250)',
//           'rgba(212,142,254,0.13)',
//           'rgba(238,2,48,0.12)',
//           'rgba(254,100,92,0.11)',
//           'rgba(254,172,172,0.1)',
//           'rgba(140,140,0,0.09)',
//           'rgba(200,200,2,0.08)',
//           'rgba(252,244,100,0.07)',
//           'rgba(16,146,26,0.06)',
//           'rgba(0,234,0,0.05)',
//           'rgba(166,252,168,0.04)',
//           'rgba(30,38,208,0.03)',
//           'rgba(122,114,238,0.02)',
//           'rgba(192,192,254,0.01)',
//         ],
//         geometry: geometry,
//         data: res,
//       }
//       volumeCloud = new CustomPrimitive(options)
//       viewer.value.scene.primitives.add(volumeCloud)
//     })
//     .catch((error) => {
//       console.log('加载JSON出错', error)
//     })
// }
// //移除雷达回波
// const removeWeather = () => {
//   if (volumeCloud) {
//     viewer.value.scene.primitives.remove(volumeCloud)
//     volumeCloud.destroy()
//   }
// }
// //是否显示雷达回波
// const isShowWeather = (status) => {
//   removeWeather()
//   if (status) {
//     addWeather()
//   } else {
//     removeWeather()
//   }
// }

onMounted(() => {
  ViewInit.init()
  viewer.value = ViewInit.viewer
  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.22453, 40.55553, 10000.0),
  })
})
</script>
<style lang="less" scoped></style>
