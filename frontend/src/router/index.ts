import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/views/Dashboard.vue')
    },
    {
      path: '/incidents',
      name: 'incidents',
      component: () => import('@/views/Incidents.vue')
    },
    {
      path: '/incidents/:id',
      name: 'incident-detail',
      component: () => import('@/views/IncidentDetail.vue'),
      props: true
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('@/views/Users.vue')
    },
    {
      path: '/playbooks',
      name: 'playbooks',
      component: () => import('@/views/Playbooks.vue')
    }
  ]
})

export default router
