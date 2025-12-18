<!--
 * @Author: dys
 * @Date: 2025-12-17 14:59:25
 * @LastEditors: dys
 * @LastEditTime: 2025-12-18 11:38:58
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
              {{ playState === 3 ? '继续' : '开始' }}
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
              :disabled="playState === 3 || playState === 2"
            >
              暂停
            </el-button>
          </el-button-group>
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
            @change="handleSpeed"
          />
          <span class="speed-unit">倍速</span>
        </div>
      </div>

      <!-- 第四行：播放模式 -->
      <div class="control-row">
        <div class="row-label">播放模式：</div>
        <div class="row-content">
          <el-select
            v-model="playMode"
            placeholder="请选择播放模式"
            style="width: 150px"
            @change="handleMode"
          >
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
          <el-select
            v-model="animationEffect"
            placeholder="请选择动画效果"
            style="width: 150px"
            @change="handleAnimation"
          >
            <el-option
              v-for="item in animationOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </div>
      </div>

      <!-- 第六行：状态显示 -->
      <div class="control-row">
        <div class="row-label">当前状态：</div>
        <div class="row-content">
          <span :style="{ color: getStatusColor() }">
            {{ getStatusText() }}
          </span>
        </div>
      </div>
    </el-card>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import * as Cesium from 'cesium'
import { AnimationParser, AnimationPlayer, LOOP_TYPE } from './js/ModelAnimationPlayer'
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
  SURVEY: 1,
  WALK: 2,
  RUN: 3,
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

/**
 * Map
 */
const player = ref(null)
const playState = ref(PLAY_STATE.STOP) // 默认停止状态
const playSpeed = ref(1.0) // 倍速
const playMode = ref(PLAY_MODE.CLAMP) // 模式
const animationEffect = ref(ANIMATION_EFFECT.SURVEY) // 动画效果
const currentAnimation = ref('') // 当前播放的动画名称

// 获取状态文本
const getStatusText = () => {
  switch (playState.value) {
    case PLAY_STATE.PLAY:
      return '播放中'
    case PLAY_STATE.STOP:
      return '已停止'
    case PLAY_STATE.PAUSE:
      return '已暂停'
    default:
      return '未知状态'
  }
}

// 获取状态颜色
const getStatusColor = () => {
  switch (playState.value) {
    case PLAY_STATE.PLAY:
      return '#67c23a'
    case PLAY_STATE.STOP:
      return '#909399'
    case PLAY_STATE.PAUSE:
      return '#e6a23c'
    default:
      return '#909399'
  }
}

// 播放/继续动画
const handlePlay = async () => {
  if (!player.value) {
    return
  }

  // 如果当前是暂停状态，恢复播放
  if (playState.value === PLAY_STATE.PAUSE) {
    player.value.resume() //resume继续
    playState.value = PLAY_STATE.PLAY
    return
  }

  // 否则是开始新的播放
  let animationName = ''
  switch (animationEffect.value) {
    case ANIMATION_EFFECT.SURVEY:
      animationName = 'Survey'
      break
    case ANIMATION_EFFECT.WALK:
      animationName = 'Walk'
      break
    case ANIMATION_EFFECT.RUN:
      animationName = 'Run'
      break
    default:
      animationName = ''
  }

  // 记录当前动画名称
  currentAnimation.value = animationName

  // 确保设置正确的动画
  if (player.value.currentAnimation !== animationName) {
    player.value.setAnimation(animationName)
  }

  // 开始播放
  player.value.play()
  playState.value = PLAY_STATE.PLAY
}

// 停止动画
const handleStop = () => {
  if (player.value) {
    player.value.stop()
    playState.value = PLAY_STATE.STOP
    currentAnimation.value = ''
  }
}

// 暂停动画
const handlePause = () => {
  if (player.value && playState.value === PLAY_STATE.PLAY) {
    player.value.pause()
    playState.value = PLAY_STATE.PAUSE
  }
}

// 调整播放速度
const handleSpeed = (value) => {
  if (player.value) {
    player.value.speed = value
  }
}

// 切换播放模式
const handleMode = (value) => {
  if (player.value) {
    player.value.loop_type = value
  }
}

// 切换动画效果
const handleAnimation = async (value) => {
  let animationName = ''
  switch (value) {
    case ANIMATION_EFFECT.SURVEY:
      animationName = 'Survey'
      break
    case ANIMATION_EFFECT.WALK:
      animationName = 'Walk'
      break
    case ANIMATION_EFFECT.RUN:
      animationName = 'Run'
      break
    default:
      animationName = ''
  }

  if (player.value) {
    // 记录新的动画名称
    currentAnimation.value = animationName
    player.value.setAnimation(animationName)

    // 如果之前正在播放，重新播放
    if (playState.value === PLAY_STATE.PLAY) {
      // 先停止当前动画
      player.value.stop()
      // 稍微延迟后重新播放
      setTimeout(() => {
        player.value.play(animationName)
      }, 50)
    } else if (playState.value === PLAY_STATE.PAUSE) {
      // 如果是暂停状态，保持暂停状态但更新动画
      player.value.stop()
      playState.value = PLAY_STATE.STOP
    }
  }
}

/**
 * Player初始化
 */
const initPlayer = async () => {
  const url = 'data/gltf/Fox.glb'
  const entity = viewer.entities.add({
    name: 'model',
    position: Cesium.Cartesian3.fromDegrees(116.39191, 39.91421),
    model: {
      uri: url,
    },
  })
  viewer.trackedEntity = entity

  const animation_set = await AnimationParser.parseAnimationSetFromUri(url)
  player.value = new AnimationPlayer(animation_set, entity, 180)
  player.value.loop_type = LOOP_TYPE.CLAMP
}

onMounted(() => {
  initPlayer()
})

onUnmounted(() => {
  if (player.value) {
    player.value.stop()
    player.value = null
  }
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
  width: 350px;
  min-height: 350px;
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
  width: 90px;
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
