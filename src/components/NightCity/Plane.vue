<!--
 * @Author: dys
 * @Date: 2025-12-26 09:49:27
 * @LastEditors: dys
 * @LastEditTime: 2025-12-26 10:23:00
 * @Descripttion: 
-->
<template></template>
<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import * as Cesium from 'cesium'

import SkyBox from './js/SkyBox'
import posx from '../../assets/img/skybox/posx.jpg'
import negx from '../../assets/img/skybox/negx.jpg'
import posz from '../../assets/img/skybox/posz.jpg'
import negz from '../../assets/img/skybox/negz.jpg'
import posy from '../../assets/img/skybox/posy.jpg'
import negy from '../../assets/img/skybox/negy.jpg'

const props = defineProps(['viewer'])
let viewer = props.viewer

const initSkyBox = () => {
  viewer.scene.skyBox = new SkyBox({
    speed: 0.05,
    sources: {
      positiveX: posx,
      negativeX: negx,
      positiveY: posz,
      negativeY: negz,
      positiveZ: posy,
      negativeZ: negy,
    },
  })
}

onMounted(() => {
  initSkyBox()
})
</script>
<style lang="less" scoped></style>
