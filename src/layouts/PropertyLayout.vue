<script setup>
import { computed } from 'vue'
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTasksStore } from '@/stores/tasks'
import { useMonitorStore } from '@/stores/monitor'
import { useReputationStore } from '@/stores/reputation'

const props = defineProps({ id: String })
const route = useRoute()
const portfolio = usePortfolioStore()
const tasksStore = useTasksStore()
const monitorStore = useMonitorStore()
const reputationStore = useReputationStore()
const property = computed(() => portfolio.byId(props.id))

const monitorDecisionCount = computed(() => monitorStore.needsDecisionForProperty(props.id).length)
const reputationReplyCount = computed(() => reputationStore.needsReplyForProperty(props.id).length)

const tasksOpenCount = computed(() =>
  tasksStore.forProperty(props.id).filter((t) => t.status === 'todo').length,
)
const tasksOverdueCount = computed(() =>
  tasksStore.overdue.filter((t) => t.propertyId === props.id).length,
)

// Promotions & Upselling hidden for now (routes still exist).
const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'kpi', label: 'KPI Check' },
  { key: 'agent', label: 'Smart Suggestions' },
  { key: 'monitor', label: 'Monitoring' },
  { key: 'pricing', label: 'Pricing & Calendar' },
  { key: 'channels', label: 'Channels' },
  { key: 'social', label: 'Social Media' },
  { key: 'reputation', label: 'Reputation' },
  { key: 'reports', label: 'Reports' },
]
const base = computed(() => `/property/${props.id}`)
</script>

<template>
  <div v-if="property">
    <!-- Tabs -->
    <div class="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.key"
        :to="`${base}/${tab.key}`"
        class="pressable relative whitespace-nowrap rounded-t-lg px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ease-out"
        :class="route.path === `${base}/${tab.key}` ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700'"
      >
        <span class="flex items-center gap-1.5">
          {{ tab.label }}
          <span
            v-if="tab.key === 'overview' && tasksOpenCount > 0"
            class="rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none"
            :class="tasksOverdueCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-brand-100 text-brand-700'"
          >{{ tasksOpenCount }}</span>
          <span
            v-if="tab.key === 'monitor' && monitorDecisionCount > 0"
            class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-amber-700"
          >{{ monitorDecisionCount }}</span>
          <span
            v-if="tab.key === 'reputation' && reputationReplyCount > 0"
            class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-amber-700"
          >{{ reputationReplyCount }}</span>
        </span>
        <span
          v-if="route.path === `${base}/${tab.key}`"
          class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600"
        />
      </RouterLink>
    </div>

    <div class="py-5">
      <RouterView v-slot="{ Component, route: r }">
        <Transition name="tab">
          <component :is="Component" :property="property" :key="r.path" />
        </Transition>
      </RouterView>
    </div>
  </div>
  <div v-else class="py-20 text-center text-slate-400">Property not found.</div>
</template>

<style scoped>
.tab-enter-active {
  transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out);
}
.tab-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
</style>
