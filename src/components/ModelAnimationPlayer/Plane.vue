<!--
 * @Author: dys
 * @Date: 2025-12-17 14:59:25
 * @LastEditors: dys
 * @LastEditTime: 2025-12-17 17:26:28
 * @Descripttion: 
-->
<template>
  <div class="animation-control-panel">
    <el-card class="control-card" shadow="always">
      <template #header>
        <div class="card-header">
          <span>动画控制面板</span>
        </div>
      </template>

      <!-- 第一行：动画操作按钮 -->
      <div class="control-row">
        <div class="row-label">动画控制：</div>
        <div class="row-content">
          <el-button-group>
            <el-button
              :type="playState === 1 ? 'primary' : ''"
              @click="handlePlay"
              :disabled="playState === 1"
            >
              开始
            </el-button>
            <el-button
              :type="playState === 2 ? 'primary' : ''"
              @click="handleStop"
              :disabled="playState === 2"
            >
              停止
            </el-button>
            <el-button
              :type="playState === 3 ? 'primary' : ''"
              @click="handlePause"
              :disabled="playState === 3"
            >
              暂停
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 第二行：循环开关 -->
      <div class="control-row">
        <div class="row-label">循环设置：</div>
        <div class="row-content">
          <el-switch v-model="loopEnabled" active-text="开启循环" inactive-text="关闭循环" />
        </div>
      </div>

      <!-- 第三行：播放速度 -->
      <div class="control-row">
        <div class="row-label">播放速度：</div>
        <div class="row-content">
          <el-input-number
            v-model="playSpeed"
            :min="0.1"
            :max="5"
            :step="0.1"
            controls-position="right"
            style="width: 120px"
          />
          <span class="speed-unit">倍速</span>
        </div>
      </div>

      <!-- 第四行：播放模式 -->
      <div class="control-row">
        <div class="row-label">播放模式：</div>
        <div class="row-content">
          <el-select v-model="playMode" placeholder="请选择播放模式" style="width: 150px">
            <el-option
              v-for="item in playModeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>

      <!-- 第五行：动画效果 -->
      <div class="control-row">
        <div class="row-label">动画效果：</div>
        <div class="row-content">
          <el-select v-model="animationEffect" placeholder="请选择动画效果" style="width: 150px">
            <el-option
              v-for="item in animationOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>
    </el-card>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as Cesium from 'cesium'
let { viewer } = defineProps(['viewer'])

/**
 * UI
 */
const PLAY_STATE = {
  PLAY: 1,
  STOP: 2,
  PAUSE: 3,
}
const PLAY_MODE = {
  CLAMP: 1,
  LOOP: 2,
}
const ANIMATION_EFFECT = {
  SURVEY: 'Survey',
  WALK: 'Walk',
  RUN: 'Run',
}
const playModeOptions = reactive([
  { value: PLAY_MODE.CLAMP, label: 'CLAMP' },
  { value: PLAY_MODE.LOOP, label: 'LOOP' },
])

const animationOptions = reactive([
  { value: ANIMATION_EFFECT.SURVEY, label: 'Survey' },
  { value: ANIMATION_EFFECT.WALK, label: 'Walk' },
  { value: ANIMATION_EFFECT.RUN, label: 'Run' },
])
// 响应式数据
const playState = ref(PLAY_STATE.STOP) // 默认停止状态
const loopEnabled = ref(false) //循环开关
const playSpeed = ref(1.0) //倍速
const playMode = ref(PLAY_MODE.CLAMP) //模式
const animationEffect = ref(ANIMATION_EFFECT.SURVEY) //动画效果

const handlePlay = () => {
  playState.value = PLAY_STATE.PLAY
  console.log('开始播放')
  console.log('当前设置：', {
    playState: 'PLAY',
    loopEnabled: loopEnabled.value,
    playSpeed: playSpeed.value,
    playMode: playMode.value === 1 ? 'CLAMP' : 'LOOP',
    animationEffect: animationEffect.value,
  })
}
const handleStop = () => {
  playState.value = PLAY_STATE.STOP
  console.log('停止播放')
}

const handlePause = () => {
  playState.value = PLAY_STATE.PAUSE
  console.log('暂停播放')
}
/**
 * Map
 */
const addModel = () => {
  const position = Cesium.Cartesian3.fromDegrees(116.39191, 39.91421)
  const url = 'data/gltf/fox/Fox.gltf'
  const entity = viewer.entities.add({
    name: url,
    position: position,
    model: {
      uri: url,
    },
  })
  viewer.trackedEntity = entity
}
onMounted(() => {
  addModel()
})
</script>
<style lang="less" scoped>
.animation-control-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.control-card {
  width: 320px;
  min-height: 320px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.control-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  min-height: 32px;
}

.row-label {
  width: 80px;
  font-size: 14px;
  color: #606266;
  margin-right: 10px;
  flex-shrink: 0;
}

.row-content {
  flex: 1;
  display: flex;
  align-items: center;
}

.speed-unit {
  margin-left: 10px;
  font-size: 14px;
  color: #606266;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .animation-control-panel {
    position: relative;
    top: 0;
    right: 0;
    margin: 20px auto;
  }

  .control-card {
    width: 100%;
  }
}
</style>
