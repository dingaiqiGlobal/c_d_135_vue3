<template>
  <div class="point-container">
    <!-- 经纬度列表：store 有数据时显示 -->
    <div
      class="lonlat-container"
      v-show="addlistShow"
      @focusin="onPanelFocus"
      @focusout="onPanelBlur"
    >
      <!-- 经纬度列表 -->
      <dl class="lonlat-list" v-for="(item, index) in tableData" :key="index">
        <dt>
          <div style="width: 100%; color: #fff; margin-bottom: 5px" >
            <span style="width: 48%; color: #409eff; font-size: 14px">位置</span>
          </div>
          <div style="width: 100%; color: #fff">
            <span style="display: inline-block; width: 38%; margin-bottom: 5px">经度：</span>
            <span style="display: inline-block; width: 38%">纬度：</span>
            <span style="display: inline-block; width: 24%">高度：</span>
          </div>
          <!-- 经度 -->
          <el-input
            size="small"
            style="width: 11%"
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
            style="width: 11%"
            v-model="item.lngfen"
            @change="handleChangeCoords($event, index)"
          />
          <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">'</span>
          <el-input
            size="small"
            style="width: 11%"
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
            style="width: 11%"
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
            style="width: 11%"
            v-model="item.latfen"
            @change="handleChangeCoords($event, index)"
          />
          <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">'</span>
          <el-input
            size="small"
            style="width: 11%"
            onkeyup="if(isNaN(value))execCommand('undo')"
            onafterpaste="if(isNaN(value))execCommand('undo')"
            oninput="if(value>=60){value=59.99}if(value<0)value=0"
            v-model="item.latmiao"
            @change="handleChangeCoords($event, index)"
          />
          <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">"</span>

          <!-- 高度 -->
          <el-input
            size="small"
            style="width: 20%"
            onkeyup="if(isNaN(value) && value !== '-')execCommand('undo')"
            onafterpaste="if(isNaN(value) && value !== '-')execCommand('undo')"
            v-model="item.height"
            @change="handleChangeCoords($event, index)"
          />
          <span style="color: #fff; height: 16px; line-height: 0px; padding: 2px">m</span>

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
              >/
              <span
                >{{ item.height
                }}<span style="color: #fff; height: 16px; line-height: 0px; padding: 2px"
                  >m</span
                ></span
              >
            </span>
          </div>
        </dt>
      </dl>
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
import CoordTransform from '@/utils/CoordTransform'
import bus from '@/utils/bus.js'

const ENTITY_TYPE = 'EditableMarker'
const drawEditStore = useDrawEditStore()
const tableData = ref([])
const addlistShow = computed(() => (drawEditStore.pointData?.lonlat?.length ?? 0) > 0)
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
  () => drawEditStore.pointData,
  (data) => {
    const pos = data?.lonlat?.[0]
    if (!pos) {
      tableData.value = []
      return
    }
    const lngDms = CoordTransform.DDToDMS(pos.longitude)
    const latDms = CoordTransform.DDToDMS(pos.latitude)
    tableData.value = [
      {
        lngdu: lngDms[0],
        lngfen: lngDms[1],
        lngmiao: lngDms[2],
        latdu: latDms[0],
        latfen: latDms[1],
        latmiao: latDms[2],
        longitude: pos.longitude,
        latitude: pos.latitude,
        height: pos.height,
      },
    ]
  },
  { deep: true },
)

function handleChangeCoords(_val, index) {
  const item = tableData.value[index]
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
  drawEditStore.setPointPosition(longitude, latitude, height)
  bus.emit('bindEditPoint', { longitude, latitude, height })
}
</script>
<style lang="less" scoped>
.point-container {
  padding: 0 10px 10px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  // 覆盖全局居中，确保文字/内容从左对齐
  text-align: left;
  .lonlat-container {
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
