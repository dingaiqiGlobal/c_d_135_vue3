<template>
  <div class="baseMap">
    <!-- 标题栏 + 关闭按钮 -->
    <div class="baseMap-header">
      <span>底图切换</span>
      <el-icon class="close-btn" @click.stop="handleClose"><Close /></el-icon>
    </div>
    <div class="container">
      <div
        v-for="item in mapItems"
        :key="item.id"
        :title="item.mapName"
        @click="handleChangeMap(item)"
        class="mapItem"
        :class="{ active: activeId === item.id }"
      >
        <img class="mapImage" :src="item.thumbnail" />
        <p class="mapTitle">{{ item.mapName }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { Close } from '@element-plus/icons-vue'
import BaseMapLoader from './js/BaseMap.js'
import ViewInit from '@/utils/ViewInit'

// 接收父组件传来的关闭回调
const props = defineProps({
  iconBaseMap: {
    type: Function,
    required: true,
  },
})
const activeId = ref(null)

const mapItems = reactive([
  {
    id: '1',
    mapName: '百度',
    thumbnail: getIcon('baidu'),
    serverType: 'XYZ',
    serverUrl:
      'http://online{s}.map.bdimg.com/onlinelabel/?qt=tile&x={x}&y={y}&z={z}&styles=pl&scaler=1&p=1',
    coordinates: 'BD09',
    lonLat: '116.84501, 38.30388, 100000.0',
  },
  {
    id: '2',
    mapName: '高德',
    thumbnail: getIcon('gaode'),
    serverType: 'XYZ',
    serverUrl:
      'http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    coordinates: 'GCJ02',
    lonLat: '116.84501, 38.30388, 100000.0',
  },
  {
    id: '3',
    mapName: 'XYZ',
    thumbnail: getIcon('xyz'),
    serverType: 'XYZ',
    serverUrl:
      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    coordinates: 'CGCS2000',
    lonLat: '116.84501, 38.30388, 100000.0',
  },
  {
    id: '4',
    mapName: '天地图Img',
    thumbnail: getIcon('tdt'),
    serverType: 'WMTS',
    serverUrl:
      'http://t0.tianditu.com/img_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=img&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=6eeb1c01782471ad6dcdd0551ff99894',
    coordinates: 'CGCS2000',
    lonLat: '116.84501, 38.30388, 100000.0',
  },
  {
    id: '5',
    mapName: '天地图Vec',
    thumbnail: getIcon('tdtVec'),
    serverType: 'WMTS',
    serverUrl:
      'http://t0.tianditu.com/vec_w/wmts?service=wmts&request=GetTile&version=1.0.0&LAYER=vec&tileMatrixSet=w&TileMatrix={TileMatrix}&TileRow={TileRow}&TileCol={TileCol}&style=default&format=tiles&tk=6eeb1c01782471ad6dcdd0551ff99894',
    coordinates: 'CGCS2000',
    lonLat: '116.84501, 38.30388, 100000.0',
  },
  {
    id: '6',
    mapName: 'WMTS',
    thumbnail: getIcon('wmts'),
    serverType: 'WMTS',
    serverUrl: 'https://server.arcgisonline.com/arcgis/rest/services/World_Street_Map/MapServer',
    coordinates: 'CGCS2000',
    lonLat: '116.84501, 38.30388, 100000.0',
  },
])

function getIcon(name) {
  return new URL(`../../assets/icon/baseMap/${name}.png`, import.meta.url).href
}

function handleClose() {
  props.iconBaseMap?.()
}

function handleChangeMap(item) {
  const viewer = ViewInit.viewer
  if (!viewer) return

  activeId.value = item.id
  removeAllBaseMap(viewer)

  const basemap = new BaseMapLoader(item)
  const basemapLayer = basemap.layer
  const basemapCenter = basemap.center

  if (!basemapLayer) return

  const imageryLayers = viewer.imageryLayers

  if (item.serverType === 'WMTS' && item.coordinates === 'CGCS2000') {
    basemapLayer[0].id = item.id
    if (basemapLayer.length > 1) {
      basemapLayer[1].id = item.id + '_1'
    }
    for (const layer of basemapLayer) {
      layer._baseMapTag = true //移除用
      imageryLayers.add(layer)
    }
    const tdtLayer = getTargetImageryLayer(viewer, item.id)
    const tdtLabelLayer = getTargetImageryLayer(viewer, item.id + '_1')
    if (tdtLabelLayer) imageryLayers.lowerToBottom(tdtLabelLayer)
    if (tdtLayer) imageryLayers.lowerToBottom(tdtLayer)
  } else {
    basemapLayer.id = item.id
    basemapLayer._baseMapTag = true //移除用
    imageryLayers.add(basemapLayer)
    const targetLayer = getTargetImageryLayer(viewer, item.id)
    if (targetLayer) imageryLayers.lowerToBottom(targetLayer)
  }
  //飞行
  //   if (basemapCenter) {
  //     viewer.camera.flyTo(basemapCenter)
  //   }
}

function removeAllBaseMap(viewer) {
  const imageryLayers = viewer.imageryLayers
  const toRemove = []
  for (let i = 0; i < imageryLayers.length; i++) {
    const layer = imageryLayers.get(i)
    if (layer._baseMapTag === true) toRemove.push(layer)
  }
  toRemove.forEach((layer) => imageryLayers.remove(layer))
}

function getTargetImageryLayer(viewer, id) {
  const imageryLayers = viewer.imageryLayers
  for (let i = 0; i < imageryLayers.length; i++) {
    const layer = imageryLayers.get(i)
    if (layer.id && layer.id === id) return layer
  }
  return null
}
</script>

<style lang="less" scoped>
.baseMap {
  width: 320px;
  height: auto;
  position: absolute;
  top: 12px;
  left: 50px;
  background: rgba(34, 34, 34, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  box-shadow:
    0px 9px 28px 8px rgba(0, 0, 0, 0.3),
    0px 6px 16px 0px rgba(0, 0, 0, 0.4);
  z-index: 100;

  .baseMap-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    height: 48px;
    font-size: 16px;
    font-weight: 500;
    background: rgba(34, 34, 34, 0.7);
    border-bottom: 1px solid #616161;
    .close-btn {
      position: absolute;
      right: 12px;
      cursor: pointer;
      transition: color 0.3s;
      &:hover {
        color: #409eff;
      }
    }
  }

  .container {
    padding: 10px;
    max-height: 340px;
    overflow-y: auto;

    .mapItem {
      width: 80px;
      display: inline-block;
      margin: 8px;
      cursor: pointer;
      border-radius: 4px;
      border: 2px solid transparent;
      transition: border-color 0.2s;

      &:hover {
        border-color: rgba(64, 158, 255, 0.6);
      }

      &.active {
        border-color: #409eff;
      }

      .mapImage {
        width: 76px;
        height: 76px;
        display: block;
        border-radius: 3px;
        object-fit: cover;
      }

      .mapTitle {
        height: 22px;
        font-size: 12px;
        font-weight: 400;
        color: rgba(255, 255, 255, 0.75);
        line-height: 22px;
        text-align: center;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        margin: 0;
      }
    }
  }
}
</style>
