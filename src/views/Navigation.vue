<!-- 下面导航栏  -->
<template>
  <div class="nav-wrap" ref="scrollContainer" @wheel="handleMouseWheel">
    <div class="column-wrap" v-for="(item, index) in list" :key="index">
      <router-link :to="item.path">
        {{ item.text }}
        <img :src="item.img" alt="" />
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const scrollContainer = ref(null)

const list = ref([
  {
    id: 1,
    img: '/images/nav/AxisPlane.jpg',
    text: '轴面板',
    path: '/AxisPlane',
  },
  {
    id: 2,
    img: '/images/nav/DrawEdit.jpg',
    text: '绘制编辑',
    path: '/DrawEdit',
  },
  {
    id: 3,
    img: '/images/nav/Popup.jpg',
    text: '组件弹框',
    path: '/Popup',
  },
  {
    id: 4,
    img: '/images/nav/Weather.jpg',
    text: '气象集合',
    path: '/Weather',
  },
  {
    id: 5,
    img: '/images/nav/ModelAnimationPlayer.jpg',
    text: 'glb动画播放器',
    path: '/ModelAnimationPlayer',
  },
  {
    id: 6,
    img: '/images/nav/Roaming.jpg',
    text: '轨迹漫游',
    path: '/Roaming',
  },
  {
    id: 7,
    img: '/images/nav/Roaming.jpg',
    text: '夜景城市',
    path: '/NightCity',
  },
])

// 方法
const handleMouseWheel = (e) => {
  let eventDelta = -e.wheelDelta || -e.deltaY * 40
  if (scrollContainer.value) {
    scrollContainer.value.scrollLeft = scrollContainer.value.scrollLeft + eventDelta / 4
  }
}
</script>

<style lang="less" scoped>
.nav-wrap {
  text-align: left;
  overflow: auto;
  white-space: nowrap;
  scroll-behavior: smooth; /* 添加平滑滚动效果 */

  .column-wrap {
    font-size: 16px;
    display: inline-block;
    text-align: center;
    width: 170px;
    height: 130px;
    margin-top: 4px;
    margin-left: 10px;
    border: 1px solid #759dc0;
    padding: 2px 4px 4px 4px;
    background-color: #bcd8f4;
    background-image: linear-gradient(
      #ffffff 0px,
      rgba(255, 255, 255, 0) 3px,
      rgba(255, 255, 255, 0.75) 100%
    );
    box-sizing: content-box;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s ease; /* 添加过渡效果 */

    &:hover {
      background-color: #86bdf2;
    }

    img {
      width: 150px;
      margin: 5px auto;
      height: 100px;
      display: block;
      object-fit: cover; /* 确保图片比例正确 */
    }
  }

  /*包含以下四种的链接*/
  a {
    color: #000;
    text-decoration: none; /* 统一设置，简化代码 */

    /*正常的未被访问过的链接*/
    &:link {
      text-decoration: none;
    }

    /*已经访问过的链接*/
    &:visited {
      text-decoration: none;
    }

    /*鼠标划过(停留)的链接*/
    &:hover {
      text-decoration: none;
    }

    /* 正在点击的链接*/
    &:active {
      text-decoration: none;
    }
  }
}

/* 隐藏滚动条但保持滚动功能（可选） */
.nav-wrap::-webkit-scrollbar {
  height: 6px;
}

.nav-wrap::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.nav-wrap::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.nav-wrap::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
