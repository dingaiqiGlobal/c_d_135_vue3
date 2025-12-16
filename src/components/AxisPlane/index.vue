<template>
  <div>
    <div id="cesiumContainer"></div>

    <!-- Element Plus 控制面板 -->
    <el-card class="control-panel" v-if="showControls">
      <template #header>
        <div class="clearfix">
          <span>3D 对象控制</span>
          <el-button style="float: right; padding: 3px 0" type="text" @click="toggleControls">
            隐藏
          </el-button>
        </div>
      </template>

      <!-- 点实体控制 -->
      <el-collapse v-model="activeNames">
        <el-collapse-item title="点实体控制" name="1">
          <div class="control-item">
            <el-checkbox v-model="pointControls.translateEnabled" @change="updatePointControls">
              启用平移
            </el-checkbox>
          </div>
        </el-collapse-item>

        <!-- 模型控制 -->
        <el-collapse-item title="模型控制" name="2">
          <div class="control-item">
            <el-checkbox v-model="modelControls.rotateEnabled" @change="updateModelControls">
              启用旋转
            </el-checkbox>
          </div>
          <div class="control-item">
            <el-checkbox v-model="modelControls.translateEnabled" @change="updateModelControls">
              启用平移
            </el-checkbox>
          </div>
          <div class="control-item">
            <el-checkbox v-model="modelControls.scaleEnabled" @change="updateModelControls">
              启用缩放
            </el-checkbox>
          </div>
        </el-collapse-item>

        <!-- 3D Tiles 控制 -->
        <el-collapse-item title="3D Tiles 控制" name="3">
          <div class="control-item">
            <el-checkbox v-model="tilesControls.rotateEnabled" @change="updateTilesControls">
              启用旋转
            </el-checkbox>
          </div>
          <div class="control-item">
            <el-checkbox v-model="tilesControls.translateEnabled" @change="updateTilesControls">
              启用平移
            </el-checkbox>
          </div>
        </el-collapse-item>
      </el-collapse>
    </el-card>

    <!-- 显示/隐藏控制面板的按钮 -->
    <el-button
      v-if="!showControls"
      class="toggle-button"
      type="primary"
      :icon="Operation"
      circle
      @click="toggleControls"
    ></el-button>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as Cesium from 'cesium'
import EditCesium from './js/EditCesium'
import { Operation } from '@element-plus/icons-vue'

// 响应式数据
const viewer = ref(null)
const point = ref(null)
const model = ref(null)
const tileset = ref(null)
const pointEditCesium = ref(null)
const modelEditCesium = ref(null)
const tilesEditCesium = ref(null)
const showControls = ref(true)
const activeNames = ref(['1', '2', '3'])

const pointControls = reactive({
  translateEnabled: true,
})

const modelControls = reactive({
  rotateEnabled: true,
  translateEnabled: true,
  scaleEnabled: true,
})

const tilesControls = reactive({
  rotateEnabled: true,
  translateEnabled: true,
})

// 方法
const addPointEntity = () => {
  point.value = viewer.value.entities.add({
    position: Cesium.Cartesian3.fromDegrees(116.39801, 39.89869, 5),
    point: {
      pixelSize: 10,
      color: Cesium.Color.RED,
    },
  })

  pointEditCesium.value = new EditCesium(viewer.value, {
    translateEnabled: pointControls.translateEnabled,
  })
  pointEditCesium.value.addTo(point.value)
}

const updatePointControls = () => {
  if (pointEditCesium.value) {
    pointEditCesium.value.translateEnabled = pointControls.translateEnabled
  }
}

const addModel = async () => {
  const origin = Cesium.Cartesian3.fromDegrees(116.39643, 39.89863, 50)
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin)

  model.value = await Cesium.Model.fromGltfAsync({
    url: '/data/gltf/Cesium_Air.glb',
    modelMatrix: modelMatrix,
    scale: 10,
  })

  viewer.value.scene.primitives.add(model.value)

  modelEditCesium.value = new EditCesium(viewer.value, {
    rotateEnabled: modelControls.rotateEnabled,
    translateEnabled: modelControls.translateEnabled,
    scaleEnabled: modelControls.scaleEnabled,
  })

  modelEditCesium.value.addTo(model.value)
}

const updateModelControls = () => {
  if (modelEditCesium.value) {
    modelEditCesium.value.rotateEnabled = modelControls.rotateEnabled
    modelEditCesium.value.translateEnabled = modelControls.translateEnabled
    modelEditCesium.value.scaleEnabled = modelControls.scaleEnabled
  }
}

const add3dtiles = async () => {
  tileset.value = await Cesium.Cesium3DTileset.fromUrl(`data/3dtiles/bim/tileset.json`, {
    maximumScreenSpaceError: 2,
    cullRequestsWhileMovingMultiplier: 100,
    dynamicScreenSpaceError: true,
    preferLeaves: true,
    debugShowBoundingVolume: false,
    debugShowContentBoundingVolume: false,
  })

  viewer.value.scene.primitives.add(tileset.value)

  tilesEditCesium.value = new EditCesium(viewer.value, {
    rotateEnabled: tilesControls.rotateEnabled,
    translateEnabled: tilesControls.translateEnabled,
  })

  tilesEditCesium.value.addTo(tileset.value)
}

const updateTilesControls = () => {
  if (tilesEditCesium.value) {
    tilesEditCesium.value.rotateEnabled = tilesControls.rotateEnabled
    tilesEditCesium.value.translateEnabled = tilesControls.translateEnabled
  }
}

const toggleControls = () => {
  showControls.value = !showControls.value
}

// 生命周期
onMounted(() => {
  Cesium.Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0ZjI1YWYwNS00ODJiLTQzOTYtYTA3My0zMzI3ODFiZTdkYzAiLCJpZCI6MjAzOTgsInNjb3BlcyI6WyJhc3IiLCJnYyJdLCJpYXQiOjE1NzczNDAzMjN9.s1TyB5DYncqM_xAF-ekua_P4fcZmmyeVR4hA9ec9G4Q'

  viewer.value = new Cesium.Viewer('cesiumContainer', {
    homeButton: false,
    vrButton: false,
    fullscreenButton: true,
    animation: true,
    geocoder: false,
    timeline: true,
    sceneModePicker: false,
    navigationHelpButton: false,
    infoBox: false,
    baseLayerPicker: false,
    selectionIndicator: true,
    shouldAnimate: true,
  })

  viewer.value._cesiumWidget._creditContainer.style.display = 'none'
  viewer.value.animation.container.style.visibility = 'hidden'
  viewer.value.timeline.container.style.visibility = 'hidden'
  viewer.value.scene.globe.depthTestAgainstTerrain = false // 深度检测

  viewer.value.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(116.39643, 39.89863, 2000.0),
  })

  addPointEntity()
  addModel()
  add3dtiles()
})

// 清理资源（可选）
onUnmounted(() => {
  if (viewer.value) {
    viewer.value.destroy()
  }
})
</script>

<style scoped>
.control-panel {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 300px;
  z-index: 1000;
  background-color: rgba(255, 255, 255, 0.9);
}

.toggle-button {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.control-item {
  margin-bottom: 10px;
}
</style>
