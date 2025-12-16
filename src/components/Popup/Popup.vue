<!--
 * @Author: dys
 * @Date: 2025-12-16 09:51:31
 * @LastEditors: dys
 * @LastEditTime: 2025-12-16 14:40:44
 * @Descripttion: 
-->
<template>
  <div>
    <div id="cesiumContainer"></div>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as Cesium from 'cesium'
import ViewInit from '@/utils/ViewInit'
import { PopupVue } from './js/PopupVue'
import PopupComp from './PopupComp.vue'

let viewer = ref(null)
let popup = null

const addEntity = () => {
  viewer.value.entities.add({
    name: '红色线',
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArray([116.30539, 39.90421, 116.45164, 39.90289]),
      width: 5,
      material: Cesium.Color.RED,
      clampToGround: true,
    },
  })
}

onMounted(() => {
  ViewInit.init()
  viewer.value = ViewInit.viewer
  viewer.value.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(116.39431, 39.91316, 10000.0),
  })
  addEntity()
  /**
   * 鼠标控制
   */
  const handler = new Cesium.ScreenSpaceEventHandler(viewer.value.scene.canvas)
  handler.setInputAction((movement) => {
    let picked = viewer.value.scene.pick(movement.position)
    const position = viewer.value.scene.camera.pickEllipsoid(
      movement.position,
      viewer.value.scene.globe.ellipsoid,
    )
    if (!Cesium.defined(picked)) {
      if (popup) {
        popup.remove()
      }
    }
    if (Cesium.defined(picked)) {
      if (popup) {
        popup.remove()
      }
      if (picked.id && picked.id instanceof Cesium.Entity) {
        const options = {
          component: PopupComp,
          position,
          props: {
            details: {
              gridNumber: 'djhk001',
              safetyIndex: '高',
              time: '12:00-13:00',
              occupancy: '无',
              gridType: '禁飞区',
              windSpeed: '4',
              weatherQuality: '多云',
              visibility: '5',
              signalQuality: '低',
              cns: 'cns',
            },
            close: () => {
              popup.remove()
            },
          },
        }
        popup = new PopupVue(viewer.value, options)
      }
    }
  }, Cesium.ScreenSpaceEventType.LEFT_CLICK)
})
</script>
<style lang="less" scoped></style>
