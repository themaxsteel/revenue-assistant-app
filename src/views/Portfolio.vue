<script setup>
import { ref, computed } from 'vue'
import { ChevronRight, Sparkles, ArrowUpRight, ArrowDownRight } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAgentStore } from '@/stores/agent'
import { useUiStore } from '@/stores/ui'
import PropertyCard from '@/components/PropertyCard.vue'

const portfolio = usePortfolioStore()
const agent = useAgentStore()
const ui = useUiStore()
const sortKey = ref('attention')

// Personalised, time-aware welcome for the RA.
const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})
const firstName = computed(() => portfolio.currentUser.name.split(' ')[0])

// Portfolio momentum — derived from existing per-property fields.
const avgOcc = computed(() => portfolio.avgOccupancy)
const avgPace = computed(() =>
  Math.round(portfolio.properties.reduce((s, p) => s + p.paceDelta, 0) / portfolio.count),
)

// Compact IDR: Rp 1.4jt / Rp 820rb
function fmtIdr(v) {
  return v >= 1_000_000 ? `Rp ${(v / 1_000_000).toFixed(1)}jt` : `Rp ${Math.round(v / 1_000)}rb`
}

// ── Needs-attention spotlight: worst-health / off-pace / alerting properties ──
function reasonFor(p) {
  if (p.alertCount > 0) return `${p.alertCount} active alert${p.alertCount > 1 ? 's' : ''}`
  if (p.occupancy < 55) return `Occupancy only ${p.occupancy}%`
  if (p.pickup7d < 0) return `Pickup down ${Math.abs(p.pickup7d)} this week`
  return `Health score ${p.healthScore}`
}
const attention = computed(() =>
  [...portfolio.properties]
    .filter((p) => p.healthScore < 60 || p.alertCount > 0 || p.paceDelta <= -8)
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 4)
    .map((p) => ({ ...p, reason: reasonFor(p) })),
)

// ── AI briefing inputs ──
const pendingCount = computed(() => agent.pending.length)
const pipeline = computed(() => agent.estPipeline)
const autoCount = computed(() => portfolio.modeCounts.auto)
const attentionNames = computed(() =>
  attention.value.slice(0, 3).map((p) => p.name.split(' — ')[0]).join(', '),
)

const filtered = computed(() => {
  const q = ui.search.trim().toLowerCase()
  let list = portfolio.properties.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q),
  )
  if (sortKey.value === 'attention') {
    list = [...list].sort((a, b) => a.healthScore - b.healthScore)
  } else if (sortKey.value === 'revpar') {
    list = [...list].sort((a, b) => b.revpar - a.revpar)
  } else {
    list = [...list].sort((a, b) => a.name.localeCompare(b.name))
  }
  return list
})
</script>

<template>
  <div>
    <div>
      <h1 class="text-xl font-bold text-slate-900">{{ greeting }}, {{ firstName }} 👋</h1>
      <p class="text-sm text-slate-500">
        Welcome back to your Revenue Assistant — here's how your {{ portfolio.count }} properties are pacing today.
      </p>
    </div>

    <!-- AI Portfolio Briefing — the RA's morning read on the whole portfolio -->
    <div class="mt-3 overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white shadow-card">
      <div class="flex items-start gap-3.5 p-4">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <Sparkles class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="text-sm font-semibold text-slate-900">AI Briefing</p>
            <span class="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> Updated just now
            </span>
          </div>
          <p class="mt-1.5 text-sm leading-relaxed text-slate-600">
            Portfolio is pacing
            <strong :class="avgPace >= 0 ? 'text-emerald-600' : 'text-rose-600'">{{ avgPace >= 0 ? '+' : '' }}{{ avgPace }}%</strong>
            vs last year at <strong class="text-slate-800">{{ avgOcc }}%</strong> occupancy.
            <template v-if="attention.length">
              <strong class="text-slate-800">{{ attention.length }}</strong>
              propert{{ attention.length > 1 ? 'ies' : 'y' }} need a look — <span class="text-slate-500">{{ attentionNames }}</span>.
            </template>
            <template v-else>Every property is in good shape right now.</template>
            <template v-if="pendingCount">
              I've prepared <strong class="text-brand-700">{{ pendingCount }}</strong> pricing recommendation{{ pendingCount > 1 ? 's' : '' }}
              (~<strong class="text-brand-700">{{ fmtIdr(pipeline) }}</strong> upside), and
              <strong class="text-slate-800">{{ autoCount }}</strong> propert{{ autoCount > 1 ? 'ies are' : 'y is' }} on autopilot.
            </template>
          </p>
          <RouterLink
            v-if="pendingCount"
            to="/agent"
            class="pressable mt-2.5 inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-brand-700"
          >
            Review {{ pendingCount }} recommendation{{ pendingCount > 1 ? 's' : '' }}
            <ChevronRight class="h-3.5 w-3.5" />
          </RouterLink>
        </div>
      </div>
    </div>

    <!-- Needs-attention spotlight — clickable worklist of the few that matter -->
    <div v-if="attention.length" class="mt-3">
      <div class="mb-2 flex items-center gap-2">
        <p class="text-sm font-semibold text-slate-700">Needs attention</p>
        <span class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">{{ attention.length }}</span>
      </div>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <RouterLink
          v-for="p in attention"
          :key="p.id"
          :to="`/property/${p.id}/overview`"
          class="pressable group flex items-center gap-3 rounded-xl border-l-2 border border-slate-200 bg-white p-3 shadow-card transition-colors duration-150 hover:border-brand-200 hover:bg-brand-50/40"
          :class="p.healthScore < 45 ? 'border-l-rose-400' : 'border-l-amber-400'"
        >
          <span
            class="flex h-9 shrink-0 items-center gap-0.5 rounded-lg px-2 text-sm font-bold tabular-nums"
            :class="p.paceDelta >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'"
            title="Pace vs last year"
          >
            <component :is="p.paceDelta >= 0 ? ArrowUpRight : ArrowDownRight" class="h-4 w-4" />
            {{ p.paceDelta >= 0 ? '+' : '' }}{{ p.paceDelta }}%
          </span>
          <span class="min-w-0 flex-1">
            <span class="block truncate text-sm font-semibold text-slate-800">{{ p.name }}</span>
            <span class="block truncate text-xs text-slate-500">{{ p.reason }}</span>
          </span>
          <span
            class="shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold tabular-nums"
            :class="p.healthScore < 45 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'"
            title="Health score"
          >
            {{ p.healthScore }}
          </span>
          <ChevronRight class="h-4 w-4 shrink-0 text-slate-300 transition-colors group-hover:text-brand-500" />
        </RouterLink>
      </div>
    </div>

    <!-- divider + sort filters -->
    <div class="mt-5 flex items-center gap-4">
      <p class="shrink-0 text-sm font-semibold text-slate-700">Properties</p>
      <div class="h-px flex-1 bg-slate-200"></div>
      <div class="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
        <button
          v-for="s in [['attention','Needs attention'],['revpar','RevPAR'],['name','Name']]"
          :key="s[0]"
          class="pressable rounded-lg px-3 py-1.5 font-medium transition-colors duration-150 ease-out"
          :class="sortKey === s[0] ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'"
          @click="sortKey = s[0]"
        >
          {{ s[1] }}
        </button>
      </div>
    </div>

    <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="(p, i) in filtered" :key="p.id" class="stagger-item" :style="{ '--i': i % 8 }">
        <PropertyCard :property="p" />
      </div>
    </div>
    <p v-if="!filtered.length" class="py-16 text-center text-sm text-slate-400">No properties match “{{ ui.search }}”.</p>
  </div>
</template>

<style scoped>
.stagger-item {
  opacity: 0;
  transform: translateY(8px);
  animation: fade-up 300ms var(--ease-out) forwards;
  animation-delay: calc(var(--i, 0) * 40ms);
}
@keyframes fade-up {
  to { opacity: 1; transform: translateY(0); }
}
@media (prefers-reduced-motion: reduce) {
  .stagger-item { opacity: 1; transform: none; animation: none; }
}
.ring-progress {
  transition: stroke-dasharray 600ms var(--ease-out);
}
</style>
