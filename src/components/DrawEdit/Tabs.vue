<!-- 绘制选项卡 -->
<template>
  <div class="list-content" :class="{ 'is-auto-height': isAutoHeightTab }">
    <div class="list-body" :class="{ 'is-auto-height': isAutoHeightTab }">
      <el-tabs v-model="activeName" class="draw-edit-tabs" @tab-click="handleClick">
        <el-tab-pane label="点" name="drawPoint"></el-tab-pane>
        <el-tab-pane label="线" name="drawPolyline"></el-tab-pane>
        <el-tab-pane label="多边形" name="drawPolygon"></el-tab-pane>
        <el-tab-pane label="矩形" name="drawRectangle"></el-tab-pane>
        <el-tab-pane label="圆形" name="drawCircle"></el-tab-pane>
      </el-tabs>
      <div
        v-show="activeName == 'drawPoint'"
        class="tab-pane-content"
        :class="{ 'is-auto-height': isAutoHeightTab }"
      >
        <PointView />
      </div>
      <div
        v-show="activeName == 'drawPolyline'"
        class="tab-pane-content"
        :class="{ 'is-auto-height': isAutoHeightTab }"
      >
        <PolyLine />
      </div>
      <div
        v-show="activeName == 'drawPolygon'"
        class="tab-pane-content"
        :class="{ 'is-auto-height': isAutoHeightTab }"
      >
        <Polygon />
      </div>
      <div
        v-show="activeName == 'drawRectangle'"
        class="tab-pane-content"
        :class="{ 'is-auto-height': isAutoHeightTab }"
      >
        <Rectangle />
      </div>
      <div
        v-show="activeName == 'drawCircle'"
        class="tab-pane-content"
        :class="{ 'is-auto-height': isAutoHeightTab }"
      >
        <Circle />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'

import MapPlotting from './js/MapPlotting'
import ViewInit from '@/utils/ViewInit'

import PointView from './Point.vue'
import PolyLine from './PolyLine.vue'
import Polygon from './Polygon.vue'
import Rectangle from './Rectangle.vue'
import Circle from './Circle.vue'

const activeName = ref('drawPoint')
const autoHeightTabs = ['drawPoint', 'drawRectangle', 'drawCircle']
const isAutoHeightTab = computed(() => autoHeightTabs.includes(activeName.value))

onMounted(() => {
  if (ViewInit.viewer) {
    MapPlotting.init(ViewInit.viewer)
  }
})

const handleClick = (tab) => {
  const name = tab.paneName
  mapPlotting(name)
}

const mapPlotting = (name) => {
  if (!MapPlotting.draw) {
    MapPlotting.init(ViewInit.viewer) //保证点开时能初始化图层绘画工具
  }
  let drawType = null
  switch (name) {
    case 'drawPoint':
      drawType = 'Point'
      break
    case 'drawPolyline':
      drawType = 'Polyline'
      break
    case 'drawPolygon':
      drawType = 'Polygon'
      break
    case 'drawRectangle':
      drawType = 'Rectangle'
      break
    case 'drawCircle':
      drawType = 'Circle'
      break
  }
  MapPlotting.drawActivate(drawType)
}
</script>
<style lang="less" scoped>
.list-content {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  width: 548px;
  max-width: calc(100vw - 40px);
  height: 50%;
  max-height: calc(100% - 40px);
  box-sizing: border-box;
  background: #1a1a1a;
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  &.is-auto-height {
    height: auto;
    max-height: calc(100% - 40px);
  }

  .list-body {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    &.is-auto-height {
      height: auto;
      flex: none;
      overflow: visible;
    }

    :deep(.draw-edit-tabs.el-tabs) {
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      --el-text-color-primary: rgba(255, 255, 255, 0.5);
    }

    :deep(.draw-edit-tabs .el-tabs__header) {
      margin: 0;
      background: #2a2a2a;
      border-bottom: 1px solid rgba(0, 0, 0, 0.45);
    }

    :deep(.draw-edit-tabs .el-tabs__nav-wrap) {
      padding: 0;
      flex: 1;
    }

    :deep(.draw-edit-tabs .el-tabs__nav-wrap::after) {
      display: none;
    }

    :deep(.draw-edit-tabs .el-tabs__item) {
      color: rgba(255, 255, 255, 0.45);
      font-size: 14px;
      padding: 0;
      height: 44px;
      line-height: 44px;
      border: none;
      flex: 1 0 0;
      text-align: center;
    }

    // 让 5 个 tab 平均占满宽度（覆盖 element-plus 默认的滚动/固定宽行为）
    :deep(.draw-edit-tabs .el-tabs__nav) {
      width: 100%;
      display: flex;
    }

    :deep(.draw-edit-tabs .el-tabs__nav-scroll) {
      width: 100%;
      display: flex;
    }

    :deep(.draw-edit-tabs .el-tabs__item:hover) {
      color: rgba(255, 255, 255, 0.85);
    }

    :deep(.draw-edit-tabs .el-tabs__item.is-active) {
      color: #fff;
      font-weight: 500;
    }

    :deep(.draw-edit-tabs .el-tabs__active-bar) {
      background-color: #1890ff;
      height: 3px;
      border-radius: 2px 2px 0 0;
    }

    :deep(.draw-edit-tabs .el-tabs__content) {
      display: none;
    }

    .tab-pane-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
      background: #1a1a1a;

      &.is-auto-height {
        flex: none;
        overflow: visible;
      }
    }

    // Element Plus inputs：统一成截图里的深色细边框风格
    :deep(.el-input__wrapper) {
      background: rgba(0, 0, 0, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.14);
      box-shadow: none;
      border-radius: 3px;
    }

    :deep(.el-input__inner) {
      color: rgba(255, 255, 255, 0.9);
      background: transparent;
    }

    :deep(.el-input__wrapper:hover) {
      border-color: rgba(255, 255, 255, 0.22);
    }

    :deep(.el-input__wrapper.is-focus) {
      border-color: #409eff;
      box-shadow: 0 0 0 1px rgba(64, 158, 255, 0.18);
    }

    :deep(.el-input-number__decrease),
    :deep(.el-input-number__increase) {
      background: rgba(0, 0, 0, 0.12);
      border-left: 1px solid rgba(255, 255, 255, 0.12);
      border-right: 1px solid rgba(255, 255, 255, 0.12);
      color: rgba(255, 255, 255, 0.72);
    }

    :deep(.el-input-number__decrease:hover),
    :deep(.el-input-number__increase:hover) {
      color: rgba(255, 255, 255, 0.95);
      border-left-color: rgba(64, 158, 255, 0.45);
      border-right-color: rgba(64, 158, 255, 0.45);
    }
  }
}
</style>
