<script setup>
import { computed, ref } from 'vue'
import { TrendingUp, TrendingDown, Check, X, Sparkles } from 'lucide-vue-next'
import { kpiFor, KPI_CADENCES } from '@/mock/kpi'
import { useReputationStore } from '@/stores/reputation'
import { useChatStore } from '@/stores/chat'
import Sparkline from '@/components/ui/Sparkline.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import OtaLogo from '@/components/OtaLogo.vue'
import DailyCard from '@/components/DailyCard.vue'

const props = defineProps({ property: Object })
const reputation = useReputationStore()
const chat = useChatStore()

const cadence = ref('daily')
const activeCadence = computed(() => KPI_CADENCES.find((c) => c.key === cadence.value))

const ctx = computed(() => {
  const id = props.property.id
  const negThemes = {}
  reputation.forProperty(id).filter((r) => r.sentiment === 'negative').forEach((r) => {
    r.themes.forEach((t) => (negThemes[t] = (negThemes[t] || 0) + 1))
  })
  return {
    reviews: reputation.needsReplyForProperty(id),
    negThemes: Object.entries(negThemes).map(([theme, count]) => ({ theme, count })).sort((a, b) => b.count - a.count),
  }
})

const cards = computed(() => kpiFor(props.property, cadence.value, ctx.value))
const byId = computed(() => Object.fromEntries(cards.value.map((c) => [c.id, c])))

// ── Weekly / Monthly: routine-style groups (monitor cards) ─────────────
const WEEKLY_GROUPS = [
  { key: 'pricing', label: 'Pricing & demand', cols: 'sm:grid-cols-2', ids: ['booking-window', 'compset', 'adr-trend', 'promo-performance'] },
  { key: 'guest', label: 'Guest', cols: 'sm:grid-cols-2', ids: ['review-sentiment'] },
]
const MONTHLY_GROUPS = [
  { key: 'performance', label: 'Performance vs target', cols: 'sm:grid-cols-2 lg:grid-cols-3', ids: ['rev-vs-budget', 'occ-adr-revpar', 'market-share'] },
  { key: 'channels', label: 'Channels', cols: 'sm:grid-cols-2 lg:grid-cols-3', ids: ['net-rev-channel', 'direct-share', 'rate-leakage'] },
  { key: 'quality', label: 'Quality', cols: 'sm:grid-cols-2 lg:grid-cols-3', ids: ['cancel-rate', 'promo-roi', 'review-score', 'content-completion'] },
]
const cadenceGroups = computed(() => (cadence.value === 'weekly' ? WEEKLY_GROUPS : MONTHLY_GROUPS))

function askAI(card) {
  chat.open = true
  chat.send(`${props.property.name} — ${card.question} (${card.label})`)
}

const statusMeta = {
  good: { dot: 'bg-emerald-500', ring: 'ring-emerald-100' },
  watch: { dot: 'bg-amber-500', ring: 'ring-amber-100' },
  attention: { dot: 'bg-rose-500', ring: 'ring-rose-100' },
}
const barTone = {
  red: 'bg-rose-400', amber: 'bg-amber-400', green: 'bg-emerald-400', brand: 'bg-brand-400', slate: 'bg-slate-300',
}
const textTone = {
  red: 'text-rose-600', amber: 'text-amber-600', green: 'text-emerald-600', brand: 'text-brand-600', slate: 'text-slate-500',
}
function maxVal(items) {
  return Math.max(...items.map((i) => i.value), 1)
}

// ── Daily routine grouping: Catch up → Decide → Monitor ────────────────
const DAILY_GROUPS = [
  { key: 'catchup', label: 'Catch up', cols: 'sm:grid-cols-3', ids: ['high-demand', 'cancellations', 'reviews'] },
  { key: 'decide', label: 'Decide', cols: 'sm:grid-cols-2', ids: ['new-bookings', 'low-occ'] },
  { key: 'monitor', label: 'Monitor', cols: 'sm:grid-cols-3', ids: ['left-to-sell', 'pickup'] },
]
</script>

<template>
  <div class="space-y-5">
    <!-- Cadence switcher + intent caption -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <div class="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 shadow-card">
          <button
            v-for="c in KPI_CADENCES"
            :key="c.key"
            class="pressable rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ease-out"
            :class="cadence === c.key ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'"
            @click="cadence = c.key"
          >{{ c.label }}</button>
        </div>
        <p class="hidden text-sm text-slate-400 sm:block">{{ activeCadence.caption }}</p>
      </div>
    </div>

    <!-- ════════════ DAILY ════════════ -->
    <template v-if="cadence === 'daily'">
      <section v-for="g in DAILY_GROUPS" :key="g.key" class="space-y-2.5">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ g.label }}</h2>
        <div class="grid gap-3" :class="g.cols">
          <DailyCard
            v-for="id in g.ids"
            :key="property.id + id"
            :card="byId[id]"
            :property="property"
            :class="id === 'pickup' ? 'sm:col-span-2' : ''"
          />
        </div>
      </section>
    </template>


    <!-- ════════════ WEEKLY / MONTHLY ════════════ -->
    <template v-else>
      <section v-for="g in cadenceGroups" :key="cadence + g.key" class="space-y-2.5">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ g.label }}</h2>

        <div class="grid gap-3" :class="g.cols">
          <div
            v-for="card in g.ids.map((id) => byId[id])"
            :key="cadence + card.id"
            class="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-card"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex items-center gap-2">
                <span class="h-2 w-2 shrink-0 rounded-full ring-4" :class="[statusMeta[card.status].dot, statusMeta[card.status].ring]" />
                <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ card.label }}</span>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span
                  v-if="card.delta != null"
                  class="inline-flex items-center gap-0.5 text-xs font-bold"
                  :class="card.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'"
                >
                  <component :is="card.delta >= 0 ? TrendingUp : TrendingDown" class="h-3.5 w-3.5" />
                  {{ card.delta >= 0 ? '+' : '' }}{{ card.delta }}{{ card.deltaUnit }}
                </span>
                <button class="pressable inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600" @click="askAI(card)"><Sparkles class="h-3 w-3" /> Ask</button>
              </div>
            </div>

            <p class="mt-2 text-[11px] text-slate-400">{{ card.question }}</p>
            <p class="mt-0.5 text-sm font-semibold leading-snug text-slate-900">{{ card.answer }}</p>

            <div class="mt-3">
              <!-- list -->
              <template v-if="card.detail.type === 'list'">
                <ul v-if="card.detail.items.length" class="space-y-2">
                  <li v-for="(it, idx) in card.detail.items" :key="idx" class="flex items-start gap-2 text-xs">
                    <OtaLogo v-if="it.logoName" :src="it.logo" :name="it.logoName" :size="20" />
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between gap-2">
                        <span class="min-w-0 flex-1 truncate font-medium text-slate-700">{{ it.title }}</span>
                        <span v-if="it.right" class="shrink-0 font-semibold" :class="it.tone ? textTone[it.tone] : 'text-slate-500'">{{ it.right }}</span>
                      </div>
                      <p v-if="it.sub" class="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-400">{{ it.sub }}</p>
                      <span v-if="it.pct != null" class="mt-1 block h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <span class="block h-full rounded-full" :class="barTone[it.tone] || barTone.brand" :style="{ width: `${Math.min(100, it.pct)}%` }" />
                      </span>
                    </div>
                  </li>
                </ul>
                <p v-else class="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-400">
                  <Check class="h-3.5 w-3.5 text-emerald-500" />{{ card.detail.empty }}
                </p>
              </template>

              <!-- horizontal bars -->
              <template v-else-if="card.detail.type === 'bars'">
                <div v-if="card.detail.items.length" class="space-y-1.5">
                  <div v-for="(it, idx) in card.detail.items" :key="idx" class="flex items-center gap-2 text-xs">
                    <span class="flex w-28 shrink-0 items-center gap-1.5" :class="it.highlight ? 'font-semibold text-slate-800' : 'text-slate-500'">
                      <OtaLogo v-if="it.logoName" :src="it.logo" :name="it.logoName" :size="16" />
                      <span class="truncate">{{ it.label }}</span>
                    </span>
                    <span class="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <span class="block h-full rounded-full transition-[width] duration-300 ease-out" :class="it.highlight ? 'bg-brand-500' : (barTone[it.tone] || barTone.brand)" :style="{ width: `${Math.round((it.value / maxVal(card.detail.items)) * 100)}%` }" />
                    </span>
                    <span class="shrink-0 text-right font-medium text-slate-500" :class="it.display ? 'w-28' : 'w-8'">{{ it.display ?? it.value }}</span>
                  </div>
                </div>
                <p v-else class="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-400">
                  <Check class="h-3.5 w-3.5 text-emerald-500" />{{ card.detail.empty }}
                </p>
              </template>

              <!-- vertical column bars -->
              <template v-else-if="card.detail.type === 'colbars'">
                <div class="flex items-end gap-1" style="height: 84px">
                  <div v-for="(it, idx) in card.detail.items" :key="idx" class="flex flex-1 flex-col items-center justify-end" :title="`${it.label}: ${it.display ?? it.value}`">
                    <span class="w-full rounded-t transition-[height] duration-300 ease-out" :class="barTone[it.tone] || barTone.brand" :style="{ height: `${Math.max(4, Math.round((it.value / maxVal(card.detail.items)) * 72))}px` }" />
                  </div>
                </div>
                <div class="mt-1 flex gap-1">
                  <span v-for="(it, idx) in card.detail.items" :key="idx" class="flex-1 truncate text-center text-[9px] text-slate-400">{{ it.label }}</span>
                </div>
              </template>

              <!-- sparkline trend -->
              <template v-else-if="card.detail.type === 'spark'">
                <Sparkline :data="card.detail.data" :width="240" :height="44" :tone="card.detail.tone || 'brand'" class="w-full" preserveAspectRatio="none" />
                <p v-if="card.detail.caption" class="mt-1 text-[10px] text-slate-400">{{ card.detail.caption }}</p>
              </template>

              <!-- stats trio -->
              <template v-else-if="card.detail.type === 'stats'">
                <div class="grid grid-cols-3 gap-2">
                  <div v-for="(it, idx) in card.detail.items" :key="idx" class="rounded-xl bg-slate-50 px-2.5 py-2">
                    <p class="text-[10px] font-medium text-slate-400">{{ it.label }}</p>
                    <p class="mt-0.5 text-sm font-bold text-slate-900">{{ it.value }}</p>
                    <span v-if="it.delta != null" class="text-[10px] font-semibold" :class="it.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'">{{ it.delta >= 0 ? '+' : '' }}{{ it.delta }}%</span>
                  </div>
                </div>
              </template>

              <!-- progress + checklist -->
              <template v-else-if="card.detail.type === 'progress'">
                <ProgressBar :value="card.detail.value" :tone="card.detail.value < 85 ? 'amber' : 'green'" />
                <ul class="mt-2.5 space-y-1.5">
                  <li v-for="(it, idx) in card.detail.items" :key="idx" class="flex items-center gap-2 text-xs">
                    <component :is="it.done ? Check : X" class="h-3.5 w-3.5 shrink-0" :class="it.done ? 'text-emerald-500' : 'text-slate-300'" />
                    <span :class="it.done ? 'text-slate-600' : 'text-slate-400'">{{ it.label }}</span>
                  </li>
                </ul>
              </template>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
