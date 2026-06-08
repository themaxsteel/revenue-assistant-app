import { createRouter, createWebHistory } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import PropertyLayout from '@/layouts/PropertyLayout.vue'

const routes = [
  {
    path: '/',
    component: AppShell,
    children: [
      { path: '', redirect: '/portfolio' },
      { path: 'today', name: 'today', component: () => import('@/views/Today.vue') },
      { path: 'portfolio', name: 'portfolio', component: () => import('@/views/Portfolio.vue') },
      { path: 'agent', name: 'agent', component: () => import('@/views/AgentCenter.vue') },
      { path: 'tasks', name: 'tasks', component: () => import('@/views/Tasks.vue') },
      { path: 'reports', name: 'reports', component: () => import('@/views/Reports.vue') },
      { path: 'social', name: 'social', component: () => import('@/views/Social.vue') },
      { path: 'analytics', name: 'analytics', component: () => import('@/views/Analytics.vue') },
      { path: 'monitor', name: 'monitor', component: () => import('@/views/Monitor.vue') },
      { path: 'alerts', name: 'alerts', component: () => import('@/views/Alerts.vue') },
      { path: 'settings', name: 'settings', component: () => import('@/views/Settings.vue') },
      {
        path: 'property/:id',
        component: PropertyLayout,
        props: true,
        children: [
          { path: '', redirect: (to) => `/property/${to.params.id}/overview` },
          { path: 'overview', component: () => import('@/views/property/Overview.vue') },
          { path: 'pricing', component: () => import('@/views/property/Pricing.vue') },
          { path: 'forecast', component: () => import('@/views/property/Forecast.vue') },
          { path: 'compset', component: () => import('@/views/property/Compset.vue') },
          { path: 'channels', component: () => import('@/views/property/Channels.vue') },
          { path: 'promotions', component: () => import('@/views/property/Promotions.vue') },
          { path: 'upselling', component: () => import('@/views/property/Upselling.vue') },
          { path: 'social', component: () => import('@/views/property/Social.vue') },
          { path: 'agent', component: () => import('@/views/property/AgentTab.vue') },
          { path: 'monitor', component: () => import('@/views/property/Monitor.vue') },
          { path: 'tasks', redirect: (to) => `/property/${to.params.id}/overview` },
          { path: 'reports', component: () => import('@/views/property/ReportTab.vue') },
        ],
      },
    ],
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})
