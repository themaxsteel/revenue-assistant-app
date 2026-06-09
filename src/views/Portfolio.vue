<script setup>
import { ref, computed } from 'vue'
import { ChevronRight, Sparkles, CheckCircle2, LayoutGrid, List, ArrowUpDown, Check } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAgentStore } from '@/stores/agent'
import { useUiStore } from '@/stores/ui'
import PropertyCard from '@/components/PropertyCard.vue'

const portfolio = usePortfolioStore()
const agent = useAgentStore()
const ui = useUiStore()

// Properties view + sort controls. View persists in the ui store so it survives
// navigating into a property and back.
const view = computed({
  get: () => ui.propertiesView,
  set: (v) => (ui.propertiesView = v),
})
const sortKey = ref('attention')
const sortOpen = ref(false)
const SORT_OPTIONS = [
  { key: 'attention', label: 'Priority (needs attention)' },
  { key: 'occupancy', label: 'Occupancy' },
  { key: 'pace', label: 'Booking pace' },
  { key: 'name', label: 'Name (A–Z)' },
]
const sortLabel = computed(() => SORT_OPTIONS.find((o) => o.key === sortKey.value)?.label)
function pickSort(key) {
  sortKey.value = key
  sortOpen.value = false
}

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

// ── Needs-attention spotlight: only properties with a real problem (alerts,
// weak demand, or a clear booking drop), matching the property-card logic. ──
function reasonFor(p) {
  if (p.alertCount > 0) return `${p.alertCount} alert${p.alertCount > 1 ? 's' : ''} ${p.alertCount > 1 ? 'need' : 'needs'} handling`
  if (p.occupancy < 55) return `Only ${p.occupancy}% booked — soft demand`
  if (p.paceDelta <= -10) return `Bookings down ${Math.abs(p.paceDelta)}% vs last year`
  return `Needs a closer look`
}
const attention = computed(() =>
  [...portfolio.properties]
    .filter((p) => p.alertCount > 0 || p.occupancy < 55 || p.paceDelta <= -10)
    .sort((a, b) => a.healthScore - b.healthScore)
    .slice(0, 4)
    .map((p) => ({ ...p, reason: reasonFor(p) })),
)

// ── AI briefing inputs ──
const pendingCount = computed(() => agent.pending.length)
const pipeline = computed(() => agent.estPipeline)
const attentionNames = computed(() =>
  attention.value.slice(0, 3).map((p) => p.name.split(' — ')[0]).join(', '),
)

// ── "Today's focus" — a finite, ordered checklist so a novice RA knows exactly
// what to do today. Each step auto-completes from existing data. ──
const steps = computed(() => [
  {
    key: 'recs',
    title: pendingCount.value
      ? `Review ${pendingCount.value} AI recommendation${pendingCount.value > 1 ? 's' : ''}`
      : 'AI recommendations reviewed',
    hint: pendingCount.value ? `~${fmtIdr(pipeline.value)}/wk upside waiting for your approval` : 'Nothing pending right now',
    done: pendingCount.value === 0,
    to: '/agent',
  },
  {
    key: 'attention',
    title: attention.value.length
      ? `Check ${attention.value.length} propert${attention.value.length > 1 ? 'ies' : 'y'} needing attention`
      : 'No properties need attention',
    hint: attention.value.length ? attentionNames.value : 'All properties are in good shape',
    done: attention.value.length === 0,
    scrollTo: 'properties',
  },
  {
    key: 'reviewed',
    title: "Review today's pricing across the portfolio",
    hint: `${portfolio.reviewedCount} of ${portfolio.count} properties reviewed today`,
    done: portfolio.reviewedCount === portfolio.count,
    scrollTo: 'properties',
  },
])
const doneSteps = computed(() => steps.value.filter((s) => s.done).length)
const allDone = computed(() => doneSteps.value === steps.value.length)

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Status priority for sorting: attention (0) → needs review (1) → on track (2).
function statusRank(p) {
  if (p.alertCount > 0 || p.occupancy < 55 || p.paceDelta <= -10) return 0
  if (!portfolio.isReviewedToday(p.id)) return 1
  return 2
}

const filtered = computed(() => {
  const q = ui.search.trim().toLowerCase()
  let list = portfolio.properties.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q),
  )
  if (sortKey.value === 'attention') {
    list = [...list].sort((a, b) => statusRank(a) - statusRank(b) || a.healthScore - b.healthScore)
  } else if (sortKey.value === 'occupancy') {
    list = [...list].sort((a, b) => b.occupancy - a.occupancy)
  } else if (sortKey.value === 'pace') {
    list = [...list].sort((a, b) => b.paceDelta - a.paceDelta)
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

    <!-- Today's focus — narrative briefing + a finite checklist so the RA knows
         exactly what to do today. -->
    <div class="mt-3 overflow-hidden rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 via-white to-white shadow-card">
      <div class="flex items-start gap-3.5 p-4">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <Sparkles class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-sm font-semibold text-slate-900">Today's focus</p>
            <span class="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> Updated just now
            </span>
            <span class="ml-auto text-[11px] font-medium text-slate-400">{{ doneSteps }} of {{ steps.length }} done</span>
          </div>

          <!-- Narrative context -->
          <p class="mt-1.5 text-sm leading-relaxed text-slate-600">
            Portfolio is pacing
            <strong :class="avgPace >= 0 ? 'text-emerald-600' : 'text-rose-600'">{{ avgPace >= 0 ? '+' : '' }}{{ avgPace }}%</strong>
            vs last year at <strong class="text-slate-800">{{ avgOcc }}%</strong> occupancy.
            <template v-if="attention.length">
              <strong class="text-slate-800">{{ attention.length }}</strong>
              propert{{ attention.length > 1 ? 'ies' : 'y' }} need a look — <span class="text-slate-500">{{ attentionNames }}</span>.
            </template>
            <template v-else>Every property is in good shape right now.</template>
          </p>

          <!-- All-clear celebration -->
          <div v-if="allDone" class="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-700">
            <CheckCircle2 class="h-4 w-4 shrink-0" /> You're all caught up for today 🎉
          </div>

          <!-- Step checklist -->
          <ol v-else class="mt-3 space-y-1.5">
            <li
              v-for="(s, i) in steps"
              :key="s.key"
              class="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-150"
              :class="s.done ? 'border-transparent bg-emerald-50/60' : 'border-slate-200 bg-white'"
            >
              <span
                class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                :class="s.done ? 'bg-emerald-500 text-white' : 'bg-brand-100 text-brand-700'"
              >
                <CheckCircle2 v-if="s.done" class="h-4 w-4" />
                <template v-else>{{ i + 1 }}</template>
              </span>
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-semibold" :class="s.done ? 'text-slate-400 line-through' : 'text-slate-800'">{{ s.title }}</span>
                <span class="block truncate text-xs text-slate-400">{{ s.hint }}</span>
              </span>
              <RouterLink
                v-if="s.to && !s.done"
                :to="s.to"
                class="pressable inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-brand-700"
              >
                Start <ChevronRight class="h-3.5 w-3.5" />
              </RouterLink>
              <button
                v-else-if="s.scrollTo && !s.done"
                class="pressable inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors duration-150 hover:bg-slate-50"
                @click="scrollToId(s.scrollTo)"
              >
                View <ChevronRight class="h-3.5 w-3.5" />
              </button>
            </li>
          </ol>

          <p class="mt-2.5 text-[11px] text-slate-400">
            Nothing runs automatically — the Revenue Assistant only prepares; you decide what to apply.
          </p>
        </div>
      </div>
    </div>

    <!-- divider + view toggle + sort dropdown -->
    <div id="properties" class="mt-5 flex items-center gap-3 scroll-mt-4">
      <p class="shrink-0 text-sm font-semibold text-slate-700">Properties</p>
      <div class="h-px flex-1 bg-slate-200"></div>

      <!-- View: card / list -->
      <div class="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5">
        <button
          class="pressable rounded-lg p-1.5 transition-colors duration-150"
          :class="view === 'card' ? 'bg-brand-50 text-brand-700' : 'text-slate-400 hover:text-slate-600'"
          title="Card view"
          @click="view = 'card'"
        >
          <LayoutGrid class="h-4 w-4" />
        </button>
        <button
          class="pressable rounded-lg p-1.5 transition-colors duration-150"
          :class="view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-slate-400 hover:text-slate-600'"
          title="List view"
          @click="view = 'list'"
        >
          <List class="h-4 w-4" />
        </button>
      </div>

      <!-- Sort by: click → popup -->
      <div class="relative">
        <button
          class="pressable inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-150 hover:bg-slate-50"
          @click="sortOpen = !sortOpen"
        >
          <ArrowUpDown class="h-3.5 w-3.5 text-slate-400" />
          <span class="hidden sm:inline">Sort: </span>{{ sortLabel }}
        </button>
        <!-- backdrop to close on outside click -->
        <div v-if="sortOpen" class="fixed inset-0 z-10" @click="sortOpen = false"></div>
        <div
          v-if="sortOpen"
          class="absolute right-0 z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-pop"
        >
          <button
            v-for="o in SORT_OPTIONS"
            :key="o.key"
            class="pressable flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors duration-150"
            :class="sortKey === o.key ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-600 hover:bg-slate-50'"
            @click="pickSort(o.key)"
          >
            {{ o.label }}
            <Check v-if="sortKey === o.key" class="h-4 w-4 shrink-0 text-brand-600" />
          </button>
        </div>
      </div>
    </div>

    <!-- Card grid -->
    <div v-if="view === 'card'" class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div v-for="(p, i) in filtered" :key="p.id" class="stagger-item" :style="{ '--i': i % 8 }">
        <PropertyCard :property="p" />
      </div>
    </div>
    <!-- List (2 columns) -->
    <div v-else class="mt-4 grid grid-cols-1 gap-2 lg:grid-cols-2">
      <div v-for="(p, i) in filtered" :key="p.id" class="stagger-item" :style="{ '--i': i % 8 }">
        <PropertyCard :property="p" view="list" />
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
