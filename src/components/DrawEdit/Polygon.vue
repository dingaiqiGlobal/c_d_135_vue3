<template>
<div class="polygon-container">
    <div v-show="addlistShow" @focusin="onPanelFocus" @focusout="onPanelBlur">
    <!-- 绝对高度 -->
    <div style="margin-top: 10px;">
            <span style="margin-left: 8px; font-size: 14px">上限高度：</span>
        </div>
    <div style="margin-top: 10px;">
      <el-input-number
        style="width: 49%"
        v-model="tableData.absHeight"
        :step="10"
        controls-position="right"
        size="small"
        @change="handleAbsHeightChange"
      />
      <span style="margin-left: 8px; ">m</span>
    </div>
    <!-- 海拔高度 -->
    <div style="margin-top: 10px;">
            <span style="margin-left: 8px; font-size: 14px">海拔高度：</span>
        </div>
    <div style="margin-top: 10px;">
      <el-input-number
        style="width: 49%"
        v-model="tableData.altitude"
        :step="10"
        controls-position="right"
        size="small"
        @change="handleAltitudeChange"
      />
      <span style="margin-left: 8px;">m</span>
    </div>
    <!-- 经纬度列表 -->
    <div class="lonlat-container">
      <dl class="lonlat-list" v-for="(item, index) in tableData.lonlat" :key="index">
        <dt>
          <div style="width: 100%; color: #fff; margin-bottom: 5px">
            <span style="width: 48%; color: #409eff; font-size: 14px">节点-{{ index + 1 }}</span>
          </div>
          <div style="width: 100%; color: #fff">
            <span style="display: inline-block; width: 48%; margin-bottom: 5px">经度：</span>
            <span style="display: inline-block; width: 48%">纬度：</span>
          </div>
          <!-- 经度 -->
          <el-input
            size="small"
            style="width: 14%"
            v-model="item.lngdu"
            onkeyup="if(isNaN(value))execCommand('undo')"
            onafterpaste="if(isNaN(value))execCommand('undo')"
            oninput="if(value>359){value=359}if(value<0)value=0"
            @change="handleChangeCoords($event, index)"
          />
          <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">°</span>
          <el-input
            size="small"
            onkeyup="if(isNaN(value))execCommand('undo')"
            onafterpaste="if(isNaN(value))execCommand('undo')"
            oninput="if(value>=60){value=59.99}if(value<0)value=0"
            style="width: 14%"
            v-model="item.lngfen"
            @change="handleChangeCoords($event, index)"
          />
          <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">'</span>
          <el-input
            size="small"
            style="width: 14%"
            onkeyup="if(isNaN(value))execCommand('undo')"
            onafterpaste="if(isNaN(value))execCommand('undo')"
            oninput="if(value>=60){value=59.99}if(value<0)value=0"
            v-model="item.lngmiao"
            @change="handleChangeCoords($event, index)"
          />
          <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">"</span>
          <!-- 纬度 -->
          <el-input
            size="small"
            style="width: 14%"
            v-model="item.latdu"
            onkeyup="if(isNaN(value))execCommand('undo')"
            onafterpaste="if(isNaN(value))execCommand('undo')"
            oninput="if(value>359){value=359}if(value<0)value=0"
            @change="handleChangeCoords($event, index)"
          />
          <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">°</span>
          <el-input
            size="small"
            onkeyup="if(isNaN(value))execCommand('undo')"
            onafterpaste="if(isNaN(value))execCommand('undo')"
            oninput="if(value>=60){value=59.99}if(value<0)value=0"
            style="width: 14%"
            v-model="item.latfen"
            @change="handleChangeCoords($event, index)"
          />
          <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">'</span>
          <el-input
            size="small"
            style="width: 14%"
            onkeyup="if(isNaN(value))execCommand('undo')"
            onafterpaste="if(isNaN(value))execCommand('undo')"
            oninput="if(value>=60){value=59.99}if(value<0)value=0"
            v-model="item.latmiao"
            @change="handleChangeCoords($event, index)"
          />
          <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">"</span>

          <!-- 底部 -->
          <div
            style="width: 100%; color: rgba(255, 255, 255, 0.4); line-height: 26px; margin-top: 5px"
          >
            <span style="display: inline-block; width: 50%">
              <span
                >{{ item.longitude
                }}<span style="color: #fff; height: 16px; line-height: 0px; padding: 2px"
                  >°</span
                ></span
              >/
              <span
                >{{ item.latitude
                }}<span style="color: #fff; height: 16px; line-height: 0px; padding: 2px"
                  >°</span
                ></span
              >
            </span>
            <span style="display: inline-block; width: 50%; text-align: right">
              <span style="margin-left: 63%; float: left; margin-top: 2px; cursor: pointer">
                <el-icon
                  @click.prevent="handleDeleteRow($event, index)"
                  class="action-icon delete-icon"
                  ><el-icon-Delete /></el-icon
              ></span>
              <span style="margin-right: 30px; cursor: pointer"
                ><el-icon @click.prevent="handleAddRow(index)" class="action-icon add-icon"
                  ><el-icon-Plus /></el-icon
              ></span>
            </span>
          </div>
        </dt>
      </dl>
    </div>
    </div>
    <!-- 未绘制时显示 -->
    <div
      style="width: 100%; line-height: 32px; text-align: center; color: #fff; font-size: 16px"
      v-show="!addlistShow"
    >
      <div style="margin: auto; margin-top: 100px">
        <img src="@/assets/icon/drawEdit/down.png" alt="" />
      </div>
      <div style="margin: auto">请先在地图上绘制</div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, computed } from 'vue'
import { useDrawEditStore } from '@/stores/drawEdit'
import bus from '@/utils/bus.js'
import CoordTransform from '@/utils/CoordTransform.js'

const ENTITY_TYPE = 'EditablePolygon'
const drawEditStore = useDrawEditStore()
const tableData = ref({
  absHeight: 0,
  altitude: 0,
  lonlat: [],
})
const addlistShow = computed(() => (drawEditStore.polygonData?.lonlat?.length ?? 0) > 0)
let _blurTimer = null

function onPanelFocus() {
  clearTimeout(_blurTimer)
  bus.emit('panel:enterEdit', { entityType: ENTITY_TYPE })
}

function onPanelBlur() {
  clearTimeout(_blurTimer)
  _blurTimer = setTimeout(() => {
    bus.emit('panel:exitEdit', { entityType: ENTITY_TYPE })
  }, 200)
}

watch(
  () => drawEditStore.polygonData,
  (data) => {
    if (!data) {
      tableData.value = {
        absHeight: 0,
        altitude: 0,
        lonlat: [],
      }
      return
    }

    tableData.value = {
      absHeight: data.absHeight ?? 0,
      altitude: data.altitude ?? 0,
      lonlat: (data.lonlat || []).map((item) => {
        const lngDms = CoordTransform.DDToDMS(Number(item.longitude || 0))
        const latDms = CoordTransform.DDToDMS(Number(item.latitude || 0))
        return {
          lngdu: lngDms[0],
          lngfen: lngDms[1],
          lngmiao: lngDms[2],
          latdu: latDms[0],
          latfen: latDms[1],
          latmiao: latDms[2],
          longitude: item.longitude,
          latitude: item.latitude,
        }
      }),
    }
  },
  { deep: true, immediate: true },
)

function handleAbsHeightChange() {
  const absHeight = Number(tableData.value.absHeight) || 0
  const altitude = drawEditStore.polygonData.altitude ?? 0
  drawEditStore.setPolygonHeights(absHeight, altitude)
  bus.emit('bindEditPolygon', { action: 'absHeight', value: absHeight })
}
function handleAltitudeChange() {
  const altitude = Number(tableData.value.altitude) || 0
  const absHeight = drawEditStore.polygonData.absHeight ?? 0
  drawEditStore.setPolygonHeights(absHeight, altitude)
  bus.emit('bindEditPolygon', { action: 'altitude', value: altitude })
}

function handleAddRow(index) {
  clearTimeout(_blurTimer)
  bus.emit('panel:enterEdit', { entityType: ENTITY_TYPE })
  bus.emit('bindEditPolygon', { action: 'add', index: index + 1 })
}

function handleDeleteRow(_e, index) {
  if (tableData.value.lonlat.length <= 3) return
  clearTimeout(_blurTimer)
  bus.emit('panel:enterEdit', { entityType: ENTITY_TYPE })
  bus.emit('bindEditPolygon', { action: 'delete', index })
}

function handleChangeCoords(_e, index) {
  const item = tableData.value.lonlat[index]
  if (!item) return
  const lngSign = Number(item.lngdu) < 0 ? -1 : 1
  const latSign = Number(item.latdu) < 0 ? -1 : 1
  const longitude =
    lngSign *
    parseFloat(
      CoordTransform.DMSToDD([
        Number(item.lngdu),
        Number(item.lngfen),
        Number(item.lngmiao),
      ]) || 0,
    )
  const latitude =
    latSign *
    parseFloat(
      CoordTransform.DMSToDD([
        Number(item.latdu),
        Number(item.latfen),
        Number(item.latmiao),
      ]) || 0,
    )
  drawEditStore.updatePolygonNode(index, longitude, latitude)
  bus.emit('bindEditPolygon', { action: 'update', index, longitude, latitude })
}
</script>
<style lang="less" scoped>
.polygon-container {
  padding: 0 10px 10px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  // 覆盖全局居中，确保文字从左对齐
  text-align: left;
  .lonlat-container {
    margin-top: 10px;
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    .lonlat-list {
      padding: 8px 8px 5px;
      width: 100%;
      margin-top: 10px;
      overflow: hidden;
      border-radius: 4px;
      background: #2a2a2a;
      border: 1px solid transparent;
      transition: border-color 0.3s ease;

      &:hover {
        border-color: #409eff;
      }

      dt {
        width: 100%;
        text-align: left;

        .action-icon {
          transition: all 0.2s ease;

          &.delete-icon {
            font-size: 17px;
            color: rgba(255, 255, 255, 0.4);

            &:hover {
              color: #3c8be6;
            }

            &:active {
              color: #3c8be6;
              transform: scale(0.9);
            }
          }

          &.add-icon {
            font-size: 12px;
            border-radius: 3px;
            border: 0.75px solid rgba(255, 255, 255, 0.4);
            color: rgba(255, 255, 255, 0.4);
            width: 17px;
            height: 17px;
            line-height: 17px;

            &:hover {
              color: #3c8be6;
              border-color: #3c8be6;
            }

            &:active {
              color: #3c8be6;
              border-color: #3c8be6;
              transform: scale(0.9);
            }
          }
        }
      }
    }
  }
}
</style>
