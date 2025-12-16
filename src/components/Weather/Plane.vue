<!--
 * @Author: dys
 * @Date: 2025-12-16 15:14:40
 * @LastEditors: dys
 * @LastEditTime: 2025-12-16 16:26:02
 * @Descripttion: 
-->
<template>
  <div class="layerTree">
    <el-header class="header">
      <span>基础图层</span>
    </el-header>
    <el-main class="legend-main">
      <el-tree
        :data="data"
        show-checkbox
        node-key="id"
        :default-expanded-keys="[1]"
        :props="defaultProps"
        class="black-text-tree"
      >
      </el-tree>
    </el-main>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as Cesium from 'cesium'

const data = reactive([
  {
    id: 1,
    label: '气象',
    children: [
      { id: 41, label: '雷达回波' },
      { id: 42, label: '云' },
      { id: 43, label: '雾' },
    ],
  },
])
const defaultProps = reactive({
  children: 'children',
  label: 'label',
})
</script>
<style lang="less" scoped>
.layerTree {
  position: absolute;
  top: 12px;
  left: 50px;
  color: #fbfbfb;
  width: 200px;
  background: rgba(34, 34, 34, 0.7);
  .header {
    display: flex;
    align-items: center;
    background: rgba(34, 34, 34, 0.7);
    justify-content: center;
    border-bottom: 1px solid #616161;
    height: 10%;
    font-size: 14px;
  }
}
</style>
