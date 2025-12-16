/*
 * @Author: dys
 * @Date: 2025-12-09 09:31:51
 * @LastEditors: dys
 * @LastEditTime: 2025-12-16 14:51:47
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
        title: '坐标轴',
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
  ],
})

export default router
