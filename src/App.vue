<!--
 * @Author: dys
 * @Date: 2025-12-09 09:31:51
 * @LastEditors: dys
 * @LastEditTime: 2025-12-09 11:15:00
 * @Descripttion: 
-->
<template>
  <div id="app">
    <div class="app-content">
      <router-view />
    </div>
    <div class="footer-nav">
      <Navigation />
    </div>
  </div>
</template>

<script setup>
import Navigation from './views/Navigation.vue'
</script>

<style lang="less">
html,
body {
  margin: 0;
  padding: 0;
  overflow: hidden;
}

#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

.app-content {
  width: 100%;
  height: calc(100vh - 150px);
}

.footer-nav {
  width: 100%;
  height: 150px;
  border: 1px solid #ccc;
  box-sizing: border-box;
  background: rgba(0, 0, 0, 0.8);
}

#cesiumContainer {
  width: 100%;
  height: calc(100vh - 150px);
}
</style>
