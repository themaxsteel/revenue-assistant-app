<script setup>
import { ref, computed } from 'vue'
import { LayoutGrid, List, BarChart3, AlertCircle, Settings } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useUiStore } from '@/stores/ui'
import PropertyCard from '@/components/PropertyCard.vue'

const portfolio = usePortfolioStore()
const ui = useUiStore()
const sortKey = ref('attention')

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

const cap = computed(() => portfolio.currentUser.capacity)
const used = computed(() => portfolio.count)
const modes = computed(() => portfolio.modeCounts)
const pct = computed(() => Math.round((used.value / cap.value) * 100))

// circular ring geometry for the capacity stat
const RING_R = 18
const RING_C = 2 * Math.PI * RING_R
const ringDash = computed(() => `${(pct.value / 100) * RING_C} ${RING_C}`)
</script>

<template>
  <div>
    <div>
      <h1 class="text-xl font-bold text-slate-900">Portfolio</h1>
      <p class="text-sm text-slate-500">{{ portfolio.count }} properties managed by {{ portfolio.currentUser.name }}</p>
    </div>

    <!-- RA capacity stats — proves the "1 RA up to 20" premise, at a glance -->
    <div class="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <!-- Slots used — circular ring -->
      <div class="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white p-4 shadow-card">
        <div class="relative h-14 w-14 shrink-0">
          <svg class="h-14 w-14 -rotate-90" viewBox="0 0 44 44">
            <circle cx="22" cy="22" :r="RING_R" fill="none" stroke="currentColor" stroke-width="4" class="text-emerald-100" />
            <circle
              cx="22" cy="22" :r="RING_R" fill="none" stroke="currentColor" stroke-width="4"
              stroke-linecap="round" :stroke-dasharray="ringDash" class="text-emerald-500 ring-progress"
            />
          </svg>
          <span class="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-emerald-700">{{ pct }}%</span>
        </div>
        <div>
          <p class="text-2xl font-bold leading-none tracking-tight text-emerald-600">
            {{ used }}<span class="text-base font-semibold text-slate-400">/{{ cap }}</span>
          </p>
          <p class="mt-1.5 text-xs font-medium text-slate-500">Properties managed</p>
        </div>
      </div>

      <!-- Reviewed today -->
      <div class="flex items-center gap-4 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50/70 to-white p-4 shadow-card">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
          <BarChart3 class="h-6 w-6" />
        </div>
        <div>
          <p class="text-2xl font-bold leading-none tracking-tight text-sky-600">{{ portfolio.reviewedCount }}</p>
          <p class="mt-1.5 text-xs font-medium text-slate-500">Priced today</p>
        </div>
      </div>

      <!-- Need review -->
      <div
        class="flex items-center gap-4 rounded-2xl border p-4 shadow-card"
        :class="portfolio.staleCount ? 'border-amber-100 bg-gradient-to-br from-amber-50/70 to-white' : 'border-slate-100 bg-gradient-to-br from-slate-50/70 to-white'"
      >
        <div
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
          :class="portfolio.staleCount ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'"
        >
          <AlertCircle class="h-6 w-6" />
        </div>
        <div>
          <p class="text-2xl font-bold leading-none tracking-tight" :class="portfolio.staleCount ? 'text-amber-600' : 'text-slate-700'">{{ portfolio.staleCount }}</p>
          <p class="mt-1.5 text-xs font-medium text-slate-500">Action needed</p>
        </div>
      </div>

      <!-- On Auto -->
      <div class="flex items-center gap-4 rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/70 to-white p-4 shadow-card">
        <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <Settings class="h-6 w-6" />
        </div>
        <div>
          <p class="text-2xl font-bold leading-none tracking-tight text-brand-600">{{ modes.auto }}</p>
          <p class="mt-1.5 text-xs font-medium text-slate-500">Auto-managed</p>
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
