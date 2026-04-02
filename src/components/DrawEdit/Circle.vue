<template>
  <div class="circle-container">
    <div v-show="addlistShow" @focusin="onPanelFocus" @focusout="onPanelBlur">
      <div style="margin-top: 20px">
        <span style="margin-left: 8px; font-size: 14px">上限高度：</span>
      </div>
      <div style="margin-top: 10px">
        <el-input-number
          v-model="tableData.absHeight"
          style="width: 49%"
          :step="10"
          controls-position="right"
          size="small"
          @change="handleAbsHeightChange"
        />
        <span style="margin-left: 8px">m</span>
      </div>

      <div style="margin-top: 20px">
        <span style="margin-left: 8px; font-size: 14px">海拔高度：</span>
      </div>
      <div style="margin-top: 10px">
        <el-input-number
          v-model="tableData.altitude"
          style="width: 49%"
          :step="10"
          controls-position="right"
          size="small"
          @change="handleAltitudeChange"
        />
        <span style="margin-left: 8px">m</span>
      </div>

      <div style="margin-top: 20px">
        <span style="margin-left: 8px; font-size: 14px">半径：</span>
      </div>
      <div style="margin-top: 10px">
        <el-input-number
          v-model="tableData.radius"
          style="width: 49%"
          :step="10"
          controls-position="right"
          size="small"
          @change="handleRadiusChange"
        />
        <span style="margin-left: 8px">m</span>
      </div>

      <div class="lonlat-container">
        <dl v-for="(item, index) in tableData.lonlat" :key="index" class="lonlat-list">
          <dt>
            <div style="width: 100%; color: #fff; margin-bottom: 5px">
              <span style="width: 48%; color: #409eff; font-size: 14px">
                {{ index === 0 ? '中心点' : '边缘点' }}
              </span>
            </div>
            <div style="width: 100%; color: #fff">
              <span style="display: inline-block; width: 48%; margin-bottom: 5px">经度：</span>
              <span style="display: inline-block; width: 48%">纬度：</span>
            </div>

            <el-input
              v-model="item.lngdu"
              size="small"
              style="width: 14%"
              onkeyup="if(isNaN(value))execCommand('undo')"
              onafterpaste="if(isNaN(value))execCommand('undo')"
              oninput="if(value>359){value=359}if(value<0)value=0"
              @change="handleChangeCoords($event, index)"
            />
            <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">°</span>
            <el-input
              v-model="item.lngfen"
              size="small"
              style="width: 14%"
              onkeyup="if(isNaN(value))execCommand('undo')"
              onafterpaste="if(isNaN(value))execCommand('undo')"
              oninput="if(value>=60){value=59.99}if(value<0)value=0"
              @change="handleChangeCoords($event, index)"
            />
            <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">'</span>
            <el-input
              v-model="item.lngmiao"
              size="small"
              style="width: 14%"
              onkeyup="if(isNaN(value))execCommand('undo')"
              onafterpaste="if(isNaN(value))execCommand('undo')"
              oninput="if(value>=60){value=59.99}if(value<0)value=0"
              @change="handleChangeCoords($event, index)"
            />
            <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">"</span>

            <el-input
              v-model="item.latdu"
              size="small"
              style="width: 14%"
              onkeyup="if(isNaN(value))execCommand('undo')"
              onafterpaste="if(isNaN(value))execCommand('undo')"
              oninput="if(value>359){value=359}if(value<0)value=0"
              @change="handleChangeCoords($event, index)"
            />
            <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">°</span>
            <el-input
              v-model="item.latfen"
              size="small"
              style="width: 14%"
              onkeyup="if(isNaN(value))execCommand('undo')"
              onafterpaste="if(isNaN(value))execCommand('undo')"
              oninput="if(value>=60){value=59.99}if(value<0)value=0"
              @change="handleChangeCoords($event, index)"
            />
            <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">'</span>
            <el-input
              v-model="item.latmiao"
              size="small"
              style="width: 14%"
              onkeyup="if(isNaN(value))execCommand('undo')"
              onafterpaste="if(isNaN(value))execCommand('undo')"
              oninput="if(value>=60){value=59.99}if(value<0)value=0"
              @change="handleChangeCoords($event, index)"
            />
            <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">"</span>

            <div
              style="
                width: 100%;
                color: rgba(255, 255, 255, 0.4);
                line-height: 26px;
                margin-top: 5px;
              "
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
            </div>
          </dt>
        </dl>
      </div>
    </div>

    <div
      v-show="!addlistShow"
      style="width: 100%; line-height: 32px; text-align: center; color: #fff; font-size: 16px"
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

const ENTITY_TYPE = 'EditableCircle'
const drawEditStore = useDrawEditStore()
const tableData = ref({
  radius: 0,
  absHeight: 0,
  altitude: 0,
  lonlat: [],
})
const addlistShow = computed(() => (drawEditStore.circleData?.lonlat?.length ?? 0) > 0)
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
  () => drawEditStore.circleData,
  (data) => {
    if (!data) {
      tableData.value = {
        radius: 0,
        absHeight: 0,
        altitude: 0,
        lonlat: [],
      }
      return
    }

    tableData.value = {
      radius: data.radius ?? 0,
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
          height: item.height ?? data.absHeight ?? 0,
        }
      }),
    }
  },
  { deep: true, immediate: true },
)

function handleAbsHeightChange() {
  const absHeight = Number(tableData.value.absHeight) || 0
  const altitude = drawEditStore.circleData.altitude ?? 0
  drawEditStore.setCircleHeights(absHeight, altitude)
  bus.emit('bindEditCircle', { action: 'absHeight', value: absHeight })
}

function handleAltitudeChange() {
  const altitude = Number(tableData.value.altitude) || 0
  const absHeight = drawEditStore.circleData.absHeight ?? 0
  drawEditStore.setCircleHeights(absHeight, altitude)
  bus.emit('bindEditCircle', { action: 'altitude', value: altitude })
}

function handleRadiusChange() {
  const radius = Number(tableData.value.radius) || 0
  drawEditStore.setCircleRadius(radius)
  bus.emit('bindEditCircle', { action: 'radius', value: radius })
}

function handleChangeCoords(_e, index) {
  const item = tableData.value.lonlat[index]
  if (!item) return
  const lngSign = Number(item.lngdu) < 0 ? -1 : 1
  const latSign = Number(item.latdu) < 0 ? -1 : 1
  const longitude =
    lngSign *
    parseFloat(
      CoordTransform.DMSToDD([Number(item.lngdu), Number(item.lngfen), Number(item.lngmiao)]) || 0,
    )
  const latitude =
    latSign *
    parseFloat(
      CoordTransform.DMSToDD([Number(item.latdu), Number(item.latfen), Number(item.latmiao)]) || 0,
    )
  const height = parseFloat(item.height) || 0
  drawEditStore.updateCircleNode(index, longitude, latitude, height)
  bus.emit('bindEditCircle', { action: 'update', index, longitude, latitude, height })
}
</script>

<style lang="less" scoped>
.circle-container {
  padding: 0 10px 10px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
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
      }
    }
  }
}
</style>
