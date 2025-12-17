<!--
 * @Author: dys
 * @Date: 2025-12-16 15:14:40
 * @LastEditors: dys
 * @LastEditTime: 2025-12-17 14:24:11
 * @Descripttion: 
-->
<template>
  <div class="layerTree">
    <el-header class="header">
      <span>基础图层</span>
    </el-header>
    <el-main class="legend-main">
      <el-tree
        :data="data"
        show-checkbox
        node-key="id"
        :default-expanded-keys="[1]"
        :props="defaultProps"
        class="black-text-tree"
        @check="handleCheckChange"
      >
      </el-tree>
    </el-main>
  </div>
</template>
<script setup>
import { reactive, onMounted, watchEffect } from 'vue'
import * as Cesium from 'cesium'
import CustomPrimitive from './marsCloud/CustomPrimitive'
import CloudLocal from './cloud/CloudLocal'
import FogLocal from './fog/FogLocal'

//UI
const data = reactive([
  {
    id: 1,
    label: '气象',
    children: [
      { id: 41, label: '雷达回波' },
      { id: 42, label: '云' },
      { id: 43, label: '雾' },
    ],
  },
])
const defaultProps = reactive({
  children: 'children',
  label: 'label',
})

/**
 * Map
 */
let { viewer } = defineProps(['viewer'])
const handleCheckChange = (data, checkedStatus) => {
  const { checkedKeys } = checkedStatus
  const hasVolumeCloudSelected = checkedKeys.includes(41)
  isShowVolumeCloud(hasVolumeCloudSelected)
  const hasCloudSelected = checkedKeys.includes(42)
  isShowCloud(hasCloudSelected)
  const hasFogSelected = checkedKeys.includes(43)
  isShowFog(hasFogSelected)
}
/**
 * 地形
 */
const addTerrain = async (viewer) => {
  try {
    const terrain = await Cesium.createWorldTerrainAsync({
      requestWaterMask: true,
      requestVertexNormals: true,
    })
    viewer.terrainProvider = terrain
  } catch (err) {
    console.log(err)
  }
}

/**
 * 体积云（雷达回波）
 */
let volumeCloud = null
const addVolumeCloud = () => {
  fetch('data/json/volumeCloud.json')
    .then((res) => {
      return res.json()
    })
    .then((res) => {
      let geometry = Cesium.BoxGeometry.fromDimensions({
        vertexFormat: Cesium.VertexFormat.POSITION_AND_ST,
        dimensions: new Cesium.Cartesian3(1, 1, 1),
      })
      const options = {
        steps: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65],
        colors: [
          'rgb(0,0,0,0)',
          'rgb(170,36,250)',
          'rgba(212,142,254,0.13)',
          'rgba(238,2,48,0.12)',
          'rgba(254,100,92,0.11)',
          'rgba(254,172,172,0.1)',
          'rgba(140,140,0,0.09)',
          'rgba(200,200,2,0.08)',
          'rgba(252,244,100,0.07)',
          'rgba(16,146,26,0.06)',
          'rgba(0,234,0,0.05)',
          'rgba(166,252,168,0.04)',
          'rgba(30,38,208,0.03)',
          'rgba(122,114,238,0.02)',
          'rgba(192,192,254,0.01)',
        ],
        geometry: geometry,
        data: res,
      }
      volumeCloud = new CustomPrimitive(options)

      viewer.scene.primitives.add(volumeCloud)
    })
    .catch((error) => {
      console.log('加载JSON出错', error)
    })
}
const removeVolumeCloud = () => {
  if (volumeCloud) {
    viewer.scene.primitives.remove(volumeCloud)
    volumeCloud.destroy()
  }
}
const isShowVolumeCloud = (status) => {
  removeVolumeCloud()
  if (status) {
    addVolumeCloud()
  } else {
    removeVolumeCloud()
  }
}

/**
 * 动态云
 */
let animationCloud = null
const loadCloud = (viewer) => {
  animationCloud = new CloudLocal(viewer, {})
  animationCloud.show(false)
}
const isShowCloud = (status) => {
  animationCloud.show(status)
}
/**
 * 雾
 */
let fog = null
const loadFog = (viewer) => {
  fog = new FogLocal(viewer, {})
  fog.show(false)
}
const isShowFog = (status) => {
  fog.show(status)
}

watchEffect(() => {
  if (viewer) {
    addTerrain(viewer)
    loadCloud(viewer)
    loadFog(viewer)
  }
})
</script>
<style lang="less" scoped>
.layerTree {
  position: absolute;
  top: 12px;
  left: 50px;
  color: #fbfbfb;
  width: 200px;
  background: rgba(34, 34, 34, 0.7);
  .header {
    display: flex;
    align-items: center;
    background: rgba(34, 34, 34, 0.7);
    justify-content: center;
    border-bottom: 1px solid #616161;
    height: 10%;
    font-size: 14px;
  }
}
</style>
