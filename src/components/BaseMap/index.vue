<template>
  <div>
    <div id="cesiumContainer"></div>
    <div class="mapControl">
      <div
        v-for="btn in controlBtns"
        :key="btn.key"
        class="footerbtnCld"
        @click.stop="handleClick(btn)"
      >
        <el-tooltip class="box-item" effect="light" :content="btn.label" placement="right">
          <img
            style="cursor: pointer; width: 20px; height: 20px"
            :src="btn.active ? btn.iconActive : btn.icon"
            :alt="btn.label"
          />
        </el-tooltip>
      </div>
    </div>
    <Plane v-if="baseMapVisible" :iconBaseMap="iconBaseMap" />
  </div>
</template>
<script setup>
import { reactive, ref, onMounted } from 'vue'
import * as Cesium from 'cesium'
import ViewInit from '@/utils/ViewInit'
import Plane from './Plane.vue'

let viewer = ref(null)

const controlBtns = reactive([
  {
    key: 'baseMap',
    label: '底图切换',
    icon: getIcon('baseMap'),
    iconActive: getIcon('baseMapTrue'),
    active: false,
  },
])

// 用 new URL() 动态获取图标路径
function getIcon(name) {
  return new URL(`../../assets/icon/mapControl/${name}.png`, import.meta.url).href
}

function handleClick(btn) {
  switch (btn.key) {
    case 'baseMap':
      handleBaseMap()
      break
  }
}

/**
 * 底图切换
 */
const baseMapVisible = ref(false)
function handleBaseMap() {
  baseMapVisible.value = !baseMapVisible.value
  const btn = controlBtns.find((b) => b.key === 'baseMap')
  if (btn) btn.active = baseMapVisible.value
}

function iconBaseMap() {
  baseMapVisible.value = false
  const btn = controlBtns.find((b) => b.key === 'baseMap')
  if (btn) btn.active = false
}

onMounted(() => {
  ViewInit.init()
  viewer.value = ViewInit.viewer
  // 移除 Cesium.Viewer 默认底图（通常为 Bing），避免自定义底图切换被盖住
  const imageryLayers = viewer.value?.imageryLayers
  if (imageryLayers && imageryLayers.length > 0) {
    imageryLayers.remove(imageryLayers.get(0), false)
  }

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
<style lang="less" scoped>
.mapControl {
  text-align: center;
  position: absolute;
  width: 40px;
  top: 0px;
  left: 0px;
  bottom: 0px;
  background: rgba(34, 34, 34, 0.7);
  backdrop-filter: blur(8px);
  z-index: 99;

  .footerbtnCld {
    cursor: pointer;
    width: 32px;
    height: 33px;
    margin-top: 10px;
    box-sizing: border-box;
    padding: 5px 0 0 7px;
  }
}
</style>
