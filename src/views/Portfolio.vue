<script setup>
import { ref, computed } from 'vue'
import { Wallet, Tag, Percent, TrendingUp, TrendingDown } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useUiStore } from '@/stores/ui'
import PropertyCard from '@/components/PropertyCard.vue'

const portfolio = usePortfolioStore()
const ui = useUiStore()
const sortKey = ref('attention')

// Personalised, time-aware welcome for the RA.
const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})
const firstName = computed(() => portfolio.currentUser.name.split(' ')[0])

// Revenue-impact KPIs — all derived from existing per-property fields.
const totalUnits = computed(() => portfolio.properties.reduce((s, p) => s + p.units, 0))
const avgRevpar = computed(() => Math.round(portfolio.totalRevpar / totalUnits.value))
const avgAdr = computed(() =>
  Math.round(portfolio.properties.reduce((s, p) => s + p.adr, 0) / portfolio.count),
)
const avgOcc = computed(() => portfolio.avgOccupancy)
const avgPace = computed(() =>
  Math.round(portfolio.properties.reduce((s, p) => s + p.paceDelta, 0) / portfolio.count),
)

// Compact IDR: Rp 1.4jt / Rp 820rb
function fmtIdr(v) {
  return v >= 1_000_000 ? `Rp ${(v / 1_000_000).toFixed(1)}jt` : `Rp ${Math.round(v / 1_000)}rb`
}

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

    <!-- Revenue-impact KPIs — the value the RA is protecting, at a glance -->
    <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <!-- Portfolio RevPAR -->
      <div class="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-4 shadow-card">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Wallet class="h-6 w-6" />
        </div>
        <div>
          <p class="text-2xl font-bold leading-none tracking-tight text-emerald-600">{{ fmtIdr(avgRevpar) }}</p>
          <p class="mt-1.5 text-xs font-medium text-slate-500">Portfolio RevPAR</p>
        </div>
      </div>

      <!-- Average ADR -->
      <div class="flex items-center gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-white p-4 shadow-card">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <Tag class="h-6 w-6" />
        </div>
        <div>
          <p class="text-2xl font-bold leading-none tracking-tight text-brand-600">{{ fmtIdr(avgAdr) }}</p>
          <p class="mt-1.5 text-xs font-medium text-slate-500">Average ADR</p>
        </div>
      </div>

      <!-- Occupancy -->
      <div class="flex items-center gap-4 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-white p-4 shadow-card">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          <Percent class="h-6 w-6" />
        </div>
        <div>
          <p class="text-2xl font-bold leading-none tracking-tight text-sky-600">{{ avgOcc }}%</p>
          <p class="mt-1.5 text-xs font-medium text-slate-500">Avg occupancy</p>
        </div>
      </div>

      <!-- Pace vs last year -->
      <div
        class="flex items-center gap-4 rounded-2xl border p-4 shadow-card"
        :class="avgPace >= 0 ? 'border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white' : 'border-rose-100 bg-gradient-to-br from-rose-50/70 to-white'"
      >
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          :class="avgPace >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'"
        >
          <component :is="avgPace >= 0 ? TrendingUp : TrendingDown" class="h-6 w-6" />
        </div>
        <div>
          <p class="text-2xl font-bold leading-none tracking-tight" :class="avgPace >= 0 ? 'text-emerald-600' : 'text-rose-600'">
            {{ avgPace >= 0 ? '+' : '' }}{{ avgPace }}%
          </p>
          <p class="mt-1.5 text-xs font-medium text-slate-500">Pace vs last year</p>
        </div>
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
