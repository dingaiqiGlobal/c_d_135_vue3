/*
 * @Author: dys
 * @Date: 2025-12-09 09:31:51
 * @LastEditors: dys
 * @LastEditTime: 2025-12-09 16:02:12
 * @Descripttion:
 */
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/AxisPlane',
      name: 'AxisPlane',
      component: () => import('../components/AxisPlane/AxisPlane.vue'),
    },
    {
      path: '/DrawEdit',
      name: 'DrawEdit',
      component: () => import('../components/DrawEdit/DrawEdit.vue'),
    },
  ],
})

export default router
