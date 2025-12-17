/*
 * @Author: dys
 * @Date: 2025-12-09 09:31:51
 * @LastEditors: dys
 * @LastEditTime: 2025-12-17 15:01:11
 * @Descripttion:
 */
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      name: 'AxisPlane',
      path: '/AxisPlane',
      component: () => import('../components/AxisPlane/index.vue'),
      meta: {
        title: '坐标轴', //路由守卫
      },
    },
    {
      name: 'DrawEdit',
      path: '/DrawEdit',
      component: () => import('../components/DrawEdit/index.vue'),
      meta: {
        title: '绘制',
      },
    },
    {
      name: 'Popup',
      path: '/Popup',
      component: () => import('@/components/Popup/index.vue'),
      meta: {
        title: '组件弹框',
      },
    },
    {
      name: 'Weather',
      path: '/Weather',
      component: () => import('@/components/Weather/index.vue'),
      meta: {
        title: '气象',
      },
    },
    {
      name: 'ModelAnimationPlayer',
      path: '/ModelAnimationPlayer',
      component: () => import('@/components/ModelAnimationPlayer/index.vue'),
      meta: {
        title: 'glb动画播放器',
      },
    },
  ],
})

//全局后置守卫：初始化时执行、每次路由切换后执行
router.afterEach((to, from) => {
  if (to.meta.title) {
    document.title = to.meta.title
  } else {
    document.title = 'Vite App'
  }
})

export default router
