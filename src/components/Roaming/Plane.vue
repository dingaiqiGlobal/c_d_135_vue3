<!--
 * @Author: dys
 * @Date: 2025-12-18 15:57:36
 * @LastEditors: dys
 * @LastEditTime: 2025-12-22 16:04:08
 * @Descripttion: 
-->
<template>
  <div class="roam-control-panel">
    <el-card class="control-card" shadow="always">
      <template #header>
        <div class="card-header">
          <span>漫游控制面板</span>
        </div>
      </template>

      <!-- 第一行：漫游控制 -->
      <div class="control-section">
        <div class="section-title">漫游控制</div>
        <div class="control-row">
          <el-button-group>
            <el-button
              :type="buttonStates.start.type"
              @click="startRoaming"
              :disabled="buttonStates.start.disabled"
            >
              开始
            </el-button>
            <el-button
              :type="buttonStates.stop.type"
              @click="stopRoaming"
              :disabled="buttonStates.stop.disabled"
            >
              停止
            </el-button>
            <el-button
              :type="buttonStates.pause.type"
              @click="pauseRoaming"
              :disabled="buttonStates.pause.disabled"
            >
              {{ buttonStates.pause.text }}
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 第二行：漫游时间 -->
      <div class="control-section">
        <div class="section-title">漫游总时长</div>
        <div class="control-row">
          <el-input v-model="totalDuration" placeholder="请输入总时长（秒）" style="width: 180px">
            <template #append>秒</template>
          </el-input>
        </div>
      </div>

      <!-- 第三行：模型选择 -->
      <div class="control-section">
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
      <div class="control-section">
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
        </div>
      </div>

      <!-- 第五行：循环漫游 -->
      <div class="control-section">
        <div class="section-title">漫游设置</div>
        <div class="control-row checkbox-row">
          <el-checkbox v-model="loopEnabled">循环漫游</el-checkbox>
        </div>
      </div>

      <!-- 第六行：漫游轨迹可见性 -->
      <div class="control-section">
        <div class="control-row checkbox-row">
          <el-checkbox v-model="pathVisible">漫游轨迹可见</el-checkbox>
        </div>
      </div>

      <!-- 第七行：标注可见性 -->
      <div class="control-section">
        <div class="control-row checkbox-row">
          <el-checkbox v-model="labelVisible">标注可见</el-checkbox>
        </div>
      </div>

      <!-- 第八行：弹框可见性 -->
      <div class="control-section">
        <div class="control-row checkbox-row">
          <el-checkbox v-model="billboardVisible">弹框可见</el-checkbox>
        </div>
      </div>

      <!-- 第九行：视角跟踪 -->
      <div class="control-section">
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
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import * as Cesium from 'cesium'
import { formatTimeLine } from './js/TimeLine'
import Roaming from './js/Roaming'
import dronePopup from '@/assets/img/billboardIMG/dronePopup.png'
/**
 * UI
 */
// 漫游状态 - 使用更具语义化的状态
const roamState = ref('idle') // idle: 未开始, playing: 播放中, paused: 已暂停, stopped: 已停止
// 时间设置
const totalDuration = ref(10)
// 模型选择
const selectedModel = ref('data/gltf/CesiumDrone.glb')
const modelOptions = reactive([
  { value: 'data/gltf/CesiumDrone.glb', label: '无人机' },
  { value: 'data/gltf/Cesium_Air.glb', label: '客机' },
])
// 速率控制
const roamSpeed = ref(1.0)
// 复选框选项
const loopEnabled = ref(true)
const pathVisible = ref(true)
const labelVisible = ref(true)
const billboardVisible = ref(true)

// 视角跟踪
const cameraMode = ref('god')
const cameraOptions = reactive([
  { value: 'god', label: '上帝视角' },
  { value: 'follow', label: '跟随视角' },
  { value: 'side', label: '侧方视角' },
])

// 计算属性：按钮的禁用状态
const buttonStates = computed(() => ({
  start: {
    disabled: roamState.value === 'playing' || roamState.value === 'paused',
    type: roamState.value === 'idle' || roamState.value === 'stopped' ? 'primary' : '',
  },
  stop: {
    disabled: roamState.value === 'stopped' || roamState.value === 'idle',
    type: roamState.value === 'stopped' ? 'primary' : '',
  },
  pause: {
    disabled: roamState.value === 'idle' || roamState.value === 'stopped',
    type: roamState.value === 'paused' ? 'primary' : '',
    text: roamState.value === 'paused' ? '继续' : '暂停',
  },
}))

// 漫游实例和参数
let roaming = null
const roamingParams = reactive({
  lines: [],
  isInitialized: false,
})

// 初始化漫游路径
const initRoamingPath = () => {
  const lineGeo = [
    { lng: 116.38523, lat: 39.92144, height: 0 },
    { lng: 116.38583, lat: 39.91138, height: 100 },
    { lng: 116.39641, lat: 39.91181, height: 200 },
    { lng: 116.39579, lat: 39.92188, height: 0 },
  ]

  roamingParams.lines = lineGeo.map((item) => {
    return Cesium.Cartesian3.fromDegrees(item.lng, item.lat, item.height)
  })

  // 初始化漫游实例
  if (viewer && !roaming) {
    roaming = new Roaming(viewer, {
      time: totalDuration.value,
      onComplete: handleRoamingComplete,
    })
    roamingParams.isInitialized = true
  }
}

// 事件处理函数
const startRoaming = () => {
  if (!roamingParams.isInitialized) {
    initRoamingPath()
  }
  if (roamState.value === 'stopped' || roamState.value === 'idle') {
    const config = {
      model: {
        uri: selectedModel.value,
        scale: 20,
      },
      Lines: roamingParams.lines,
      path: {
        show: pathVisible.value,
      },
      label: {
        show: true,
        text: 'G-B',
      },
      billboard: {
        show: true,
        image: dronePopup,
        scale: 0.5,
        pixelOffset: new Cesium.Cartesian2(-100, -100),
      },
      speed: roamSpeed.value,
      ifClockLoop: loopEnabled.value,
    }

    // 开始漫游
    roaming.modelRoaming(config)
    roamState.value = 'playing'
  }
}

const stopRoaming = () => {
  if (roaming && roamingParams.isInitialized) {
    roaming.EndRoaming()
    roamState.value = 'stopped'
  }
}

const pauseRoaming = () => {
  if (!roaming || !roamingParams.isInitialized) {
    return
  }

  if (roamState.value === 'playing') {
    // 暂停漫游
    if (roaming.PauseOrContinue) {
      roaming.PauseOrContinue(false)
    }
    roamState.value = 'paused'
  } else if (roamState.value === 'paused') {
    // 继续漫游
    if (roaming.PauseOrContinue) {
      roaming.PauseOrContinue(true)
    }
    roamState.value = 'playing'
  }
}

// 监听模型变化
watch(selectedModel, (newModel) => {
  if (roaming && (roamState.value === 'playing' || roamState.value === 'paused')) {
    // 提示用户模型更改需要重新开始
    const shouldRestart = confirm('更改模型需要重新开始漫游，是否继续？')
    if (shouldRestart) {
      stopRoaming()
      setTimeout(() => {
        startRoaming()
      }, 100)
    } else {
      // 如果用户取消，恢复原来的模型
      const index = modelOptions.findIndex((option) => option.value === newModel)
      if (index > -1) {
        selectedModel.value = modelOptions[index].value
      }
    }
  }
})

// 速率控制
const increaseSpeed = () => {
  if (roamSpeed.value < 10) {
    roamSpeed.value = Math.round((roamSpeed.value + 0.1) * 10) / 10
    updateRoamingSpeed()
  }
}

const decreaseSpeed = () => {
  if (roamSpeed.value > 0.1) {
    roamSpeed.value = Math.round((roamSpeed.value - 0.1) * 10) / 10
    updateRoamingSpeed()
  }
}

// 更新漫游速度
const updateRoamingSpeed = () => {
  if (roaming && (roamState.value === 'playing' || roamState.value === 'paused')) {
    if (roaming.setSpeed) {
      roaming.setSpeed(roamSpeed.value)
    }
  }
}

// 监听速率变化
watch(roamSpeed, (newValue) => {
  if (roaming && (roamState.value === 'playing' || roamState.value === 'paused')) {
    if (roaming.setSpeed) {
      roaming.setSpeed(newValue)
    }
  }
})

// 漫游完成回调
const handleRoamingComplete = () => {
  if (loopEnabled.value) {
    // 如果启用循环，重新开始漫游
    setTimeout(() => {
      roamState.value = 'stopped' // 先重置状态
      startRoaming()
    }, 500)
  } else {
    // 否则停止漫游
    roamState.value = 'stopped'
  }
}

// 监听轨迹可见性
watch(pathVisible, (visible) => {
  if (roaming) {
    if (roaming.setPathVisible) {
      roaming.setPathVisible(visible)
    }
  }
})
// 标签可见性
watch(labelVisible, (visible) => {
  if (roaming) {
    if (roaming.setLabelVisible) {
      roaming.setLabelVisible(visible)
    }
  }
})

// billboard可见性
watch(billboardVisible, (visible) => {
  if (roaming) {
    if (roaming.setBillboardVisible) {
      roaming.setBillboardVisible(visible)
    }
  }
})
// 监听视角变化
watch(cameraMode, (newMode) => {
  console.log(newMode, '111111')
  if (roaming) {
    if (roaming.setCameraMode) {
      roaming.setCameraMode(newMode)
    }
  }
})

/**
 * Map
 */
const props = defineProps(['viewer'])
let viewer = props.viewer

onMounted(() => {
  /**
   * TimeLine控件
   */
  if (viewer) {
    viewer.animation.container.style.visibility = 'visible'
    viewer.timeline.container.style.visibility = 'visible'
    formatTimeLine(viewer)

    // 初始化漫游路径
    initRoamingPath()
  }
})
onUnmounted(() => {
  if (roaming) {
    stopRoaming()
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
