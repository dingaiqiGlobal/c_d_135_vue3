<!--
 * @Author: dys
 * @Date: 2025-12-18 15:57:36
 * @LastEditors: dys
 * @LastEditTime: 2025-12-22 10:20:07
 * @Descripttion: 
-->
<template>
  <div class="roam-control-panel">
    <el-card class="control-card" shadow="always">
      <template #header>
        <div class="card-header">
          <span>漫游控制面板</span>
          <el-button type="text" @click="toggleCollapse" class="collapse-btn">
            <el-icon>
              <component :is="isCollapsed ? 'ArrowDown' : 'ArrowUp'" />
            </el-icon>
          </el-button>
        </div>
      </template>

      <!-- 第一行：漫游控制 -->
      <div class="control-section">
        <div class="section-title">漫游控制</div>
        <div class="control-row">
          <el-button-group>
            <el-button
              :type="roamState === 'playing' ? 'primary' : ''"
              @click="startRoaming"
              :disabled="roamState === 'playing'"
            >
              <el-icon><VideoPlay /></el-icon>
              开始
            </el-button>
            <el-button
              :type="roamState === 'stopped' ? 'primary' : ''"
              @click="stopRoaming"
              :disabled="roamState === 'stopped'"
            >
              <el-icon><VideoPause /></el-icon>
              停止
            </el-button>
            <el-button
              :type="roamState === 'paused' ? 'primary' : ''"
              @click="pauseRoaming"
              :disabled="roamState === 'paused'"
            >
              <el-icon><Refresh /></el-icon>
              暂停
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 第二行：漫游时间 -->
      <div class="control-section" v-if="!isCollapsed">
        <div class="section-title">漫游总时长</div>
        <div class="control-row">
          <el-input v-model="totalDuration" placeholder="请输入总时长（秒）" style="width: 180px">
            <template #append>秒</template>
          </el-input>
        </div>
      </div>

      <!-- 第三行：模型选择 -->
      <div class="control-section" v-if="!isCollapsed">
        <div class="section-title">模型选择</div>
        <div class="control-row">
          <el-select
            v-model="selectedModel"
            placeholder="请选择模型"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="model in modelOptions"
              :key="model.value"
              :label="model.label"
              :value="model.value"
            />
          </el-select>
        </div>
      </div>

      <!-- 第四行：速率控制 -->
      <div class="control-section" v-if="!isCollapsed">
        <div class="section-title">漫游速率</div>
        <div class="control-row">
          <el-input-number
            v-model="roamSpeed"
            :min="0.1"
            :max="10"
            :step="0.1"
            controls-position="right"
            style="width: 120px"
          />
          <div class="speed-control">
            <el-button @click="decreaseSpeed" circle>
              <el-icon><Minus /></el-icon>
            </el-button>
            <span class="speed-value">{{ roamSpeed }}x</span>
            <el-button @click="increaseSpeed" circle>
              <el-icon><Plus /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 第五行：循环漫游 -->
      <div class="control-section" v-if="!isCollapsed">
        <div class="section-title">漫游设置</div>
        <div class="control-row checkbox-row">
          <el-checkbox v-model="loopEnabled">循环漫游</el-checkbox>
        </div>
      </div>

      <!-- 第六行：漫游轨迹可见性 -->
      <div class="control-section" v-if="!isCollapsed">
        <div class="control-row checkbox-row">
          <el-checkbox v-model="trajectoryVisible">漫游轨迹可见</el-checkbox>
        </div>
      </div>

      <!-- 第七行：标注可见性 -->
      <div class="control-section" v-if="!isCollapsed">
        <div class="control-row checkbox-row">
          <el-checkbox v-model="markersVisible">标注可见</el-checkbox>
        </div>
      </div>

      <!-- 第八行：弹框可见性 -->
      <div class="control-section" v-if="!isCollapsed">
        <div class="control-row checkbox-row">
          <el-checkbox v-model="popupsVisible">弹框可见</el-checkbox>
        </div>
      </div>

      <!-- 第九行：视角跟踪 -->
      <div class="control-section" v-if="!isCollapsed">
        <div class="section-title">视角跟踪</div>
        <div class="control-row">
          <el-select v-model="cameraMode" placeholder="请选择视角" style="width: 100%">
            <el-option
              v-for="mode in cameraOptions"
              :key="mode.value"
              :label="mode.label"
              :value="mode.value"
              :icon="mode.icon"
            />
          </el-select>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  VideoPlay,
  VideoPause,
  Refresh,
  Plus,
  Minus,
  Position,
  Camera,
  View,
} from '@element-plus/icons-vue'
import * as Cesium from 'cesium'
import { formatTimeLine } from './js/TimeLine'
import Roaming from './js/Roaming'

/**
 * UI
 */
// 漫游状态
const roamState = ref('stopped') // playing, paused, stopped

// 时间设置
const totalDuration = ref(60) // 总时长，单位秒

// 模型选择
const selectedModel = ref('')
const modelOptions = reactive([
  { value: 'model1', label: '模型一' },
  { value: 'model2', label: '模型二' },
  { value: 'model3', label: '模型三' },
  { value: 'model4', label: '模型四' },
  { value: 'model5', label: '模型五' },
])

// 速率控制
const roamSpeed = ref(1.0)

// 复选框选项
const loopEnabled = ref(false)
const trajectoryVisible = ref(true)
const markersVisible = ref(true)
const popupsVisible = ref(true)

// 视角跟踪
const cameraMode = ref('god')
const cameraOptions = reactive([
  { value: 'god', label: '上帝视角', icon: Position },
  { value: 'follow', label: '跟随视角', icon: Camera },
  { value: 'side', label: '侧方视角', icon: View },
])

// 面板折叠状态
const isCollapsed = ref(false)

// 事件处理函数
const startRoaming = () => {
  roamState.value = 'playing'
  console.log('开始漫游', getCurrentConfig())
}

const stopRoaming = () => {
  roamState.value = 'stopped'
  console.log('停止漫游')
}

const pauseRoaming = () => {
  roamState.value = 'paused'
  console.log('暂停漫游')
}

const increaseSpeed = () => {
  if (roamSpeed.value < 10) {
    roamSpeed.value = Math.round((roamSpeed.value + 0.1) * 10) / 10
  }
}

const decreaseSpeed = () => {
  if (roamSpeed.value > 0.1) {
    roamSpeed.value = Math.round((roamSpeed.value - 0.1) * 10) / 10
  }
}

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

/**
 * Map
 */
const props = defineProps(['viewer'])
let viewer = props.viewer

const result = reactive([
  { lng: 116.38523, lat: 39.92144, height: 0 },
  { lng: 116.38583, lat: 39.91138, height: 100 },
  { lng: 116.39641, lat: 39.91181, height: 200 },
  { lng: 116.39579, lat: 39.92188, height: 0 },
])

const addLayer = (viewer) => {
  //线图层
  const positions = result.flatMap((item) => [item.lng, item.lat, item.height])
  const entity = new Cesium.Entity({
    Type: `roamGirdPolygon`,
    polyline: {
      positions: Cesium.Cartesian3.fromDegreesArrayHeights(positions),
      width: 2,
      material: Cesium.Color.fromCssColorString('rgba(78, 143, 252, 1)'),
      disableDepthTestDistance: 50000,
    },
  })
  viewer.entities.add(entity)

  //漫游
  const lonlat = result.map((item) => {
    return Cesium.Cartesian3.fromDegrees(item.lng, item.lat, item.height)
  })
  const roaming = new Roaming(viewer, { time: totalDuration.value })
  roaming.modelRoaming({
    model: {
      uri: 'data/gltf/CesiumDrone.glb',
      scale: 20,
    },
    Lines: lonlat,
    path: {
      show: false,
    },
  })
}

onMounted(() => {
  /**
   * TimeLine控件
   */
  if (viewer) {
    viewer.animation.container.style.visibility = 'visible'
    viewer.timeline.container.style.visibility = 'visible'
    formatTimeLine(viewer)
    // addLayer(viewer)
  }
})
</script>

<style scoped>
.roam-control-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2;
  width: 320px;
}

.control-card {
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 16px;
}

.collapse-btn {
  padding: 0;
  height: auto;
}

.control-section {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.control-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 14px;
  color: #606266;
  margin-bottom: 10px;
  font-weight: 500;
}

.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  min-height: 32px;
}

.control-row:last-child {
  margin-bottom: 0;
}

.time-mode-group {
  width: 100%;
  display: flex;
  justify-content: space-around;
}

.speed-control {
  display: flex;
  align-items: center;
  margin-left: 15px;
}

.speed-control .el-button {
  width: 28px;
  height: 28px;
}

.speed-value {
  margin: 0 10px;
  min-width: 40px;
  text-align: center;
  font-size: 14px;
  color: #333;
}

.checkbox-row {
  padding: 5px 0;
}

.checkbox-row .el-checkbox {
  width: 100%;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .roam-control-panel {
    position: relative;
    bottom: 0;
    right: 0;
    width: 100%;
    margin: 20px auto;
  }

  .control-card {
    max-height: none;
  }
}
</style>
