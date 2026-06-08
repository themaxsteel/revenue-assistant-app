<script setup>
import { computed } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, MapPin, Star, ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTasksStore } from '@/stores/tasks'
import { useMonitorStore } from '@/stores/monitor'
import { propertyTypeLabel } from '@/mock/properties'
import HealthRing from '@/components/ui/HealthRing.vue'
import Badge from '@/components/ui/Badge.vue'
import AutonomySelector from '@/components/AutonomySelector.vue'

const props = defineProps({ id: String })
const route = useRoute()
const router = useRouter()
const portfolio = usePortfolioStore()
const tasksStore = useTasksStore()
const monitorStore = useMonitorStore()
const property = computed(() => portfolio.byId(props.id))

const monitorDecisionCount = computed(() => monitorStore.needsDecisionForProperty(props.id).length)

const tasksOpenCount = computed(() =>
  tasksStore.forProperty(props.id).filter((t) => t.status === 'todo').length,
)
const tasksOverdueCount = computed(() =>
  tasksStore.overdue.filter((t) => t.propertyId === props.id).length,
)

const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'pricing', label: 'Pricing & Calendar' },
  { key: 'forecast', label: 'Demand & Forecast' },
  { key: 'compset', label: 'Compset' },
  { key: 'channels', label: 'Channels' },
  { key: 'promotions', label: 'Promotions' },
  { key: 'upselling', label: 'Upselling' },
  { key: 'social', label: 'Social Media' },
  { key: 'agent', label: 'AI Agent' },
  { key: 'monitor', label: 'Monitoring' },
  { key: 'reports', label: 'Reports' },
]
const base = computed(() => `/property/${props.id}`)

// Property switcher — cycle through the portfolio without going back each time.
const currentTab = computed(() => route.path.split('/').pop())
const index = computed(() => portfolio.properties.findIndex((p) => p.id === props.id))
const prevId = computed(() => portfolio.properties[(index.value - 1 + portfolio.count) % portfolio.count]?.id)
const nextId = computed(() => portfolio.properties[(index.value + 1) % portfolio.count]?.id)
function goTo(pid) {
  if (pid) router.push(`/property/${pid}/${currentTab.value}`)
}
function onSelect(e) {
  goTo(e.target.value)
}
const reviewedToday = computed(() => portfolio.isReviewedToday(props.id))
function toggleReviewed() {
  portfolio.setReviewed(props.id, !reviewedToday.value)
}
</script>

<template>
  <div v-if="property">
    <!-- Top bar: back + property switcher -->
    <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
      <RouterLink to="/portfolio" class="pressable inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
        <ArrowLeft class="h-4 w-4" /> Portfolio
      </RouterLink>
      <div class="flex items-center gap-1.5">
        <button class="pressable rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50" title="Previous property" @click="goTo(prevId)"><ChevronLeft class="h-4 w-4" /></button>
        <div class="relative">
          <select :value="id" class="cursor-pointer rounded-lg border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-100" @change="onSelect">
            <option v-for="p in portfolio.properties" :key="p.id" :value="p.id">{{ p.name }}{{ portfolio.isReviewedToday(p.id) ? ' ✓' : '' }}</option>
          </select>
        </div>
        <span class="hidden text-xs text-slate-400 sm:inline">{{ index + 1 }}/{{ portfolio.count }}</span>
        <button class="pressable rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50" title="Next property" @click="goTo(nextId)"><ChevronRight class="h-4 w-4" /></button>
      </div>
    </div>

    <!-- Property header -->
    <div class="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <HealthRing :score="property.healthScore" :size="52" />
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-lg font-bold text-slate-900">{{ property.name }}</h1>
          <Badge tone="brand" size="sm">{{ propertyTypeLabel[property.type] }}</Badge>
          <Badge tone="amber" size="sm"><Star class="h-3 w-3" />{{ property.rating }}</Badge>
          <Badge v-if="reviewedToday" tone="green" size="sm"><CheckCircle2 class="h-3 w-3" />Reviewed</Badge>
        </div>
        <p class="mt-0.5 flex items-center gap-1 text-sm text-slate-400">
          <MapPin class="h-3.5 w-3.5" />{{ property.city }} · {{ property.units }} units · Owner {{ property.ownerName }}
        </p>
      </div>
      <div class="flex flex-col items-end gap-2">
        <button
          class="pressable inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-out"
          :class="reviewedToday ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'"
          @click="toggleReviewed"
        >
          <component :is="reviewedToday ? CheckCircle2 : Circle" class="h-3.5 w-3.5" />
          {{ reviewedToday ? 'Reviewed today' : 'Mark reviewed' }}
        </button>
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-medium uppercase text-slate-400">AI Autonomy</span>
          <AutonomySelector :property-id="property.id" />
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
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
