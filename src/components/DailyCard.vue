<script setup>
// One daily KPI card. Picks its presentation from the item + status:
//  - actionable & needs attention → "action" style (colour spine, mark-handled chip, Add task / Ask AI)
//  - everything else → clean "monitor" style (grayscale data, small Ask link)
import { computed, ref } from 'vue'
import {
  Trash2, MessageSquare, TrendingUp, CalendarX, Check, AlertTriangle,
  ListPlus, MessageCircle, Undo2, Sparkles,
} from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks'
import { useChatStore } from '@/stores/chat'
import { useUiStore } from '@/stores/ui'
import OtaLogo from '@/components/OtaLogo.vue'
import BookingsDonut from '@/components/BookingsDonut.vue'
import RingProgress from '@/components/ui/RingProgress.vue'

const props = defineProps({ card: Object, property: Object })
const tasks = useTasksStore()
const chat = useChatStore()
const ui = useUiStore()

const actionMeta = {
  cancellations: { signal: 'urgent', icon: Trash2 },
  reviews: { signal: 'urgent', icon: MessageSquare },
  'high-demand': { signal: 'opportunity', icon: TrendingUp },
  'low-occ': { signal: 'opportunity', icon: CalendarX },
}
const signalSpine = { urgent: 'bg-rose-500', opportunity: 'bg-amber-500' }
const signalChip = { urgent: 'bg-rose-50 text-rose-600', opportunity: 'bg-amber-50 text-amber-600' }
const statusDot = { good: 'bg-emerald-500', watch: 'bg-amber-500', attention: 'bg-rose-500' }

// low-occ is an action only when it's bad enough (attention); good/watch stay monitor.
const isAction = computed(() =>
  ['cancellations', 'reviews', 'high-demand'].includes(props.card.id) && props.card.status !== 'good',
)

const handled = ref(false)
function toggle() { handled.value = !handled.value }

const pickupHover = ref(null)

function actionTitle(c) {
  const n = c.detail.items?.length || 0
  switch (c.id) {
    case 'cancellations': return `Recover ${n > 1 ? `${n} cancellations` : 'a cancellation'}`
    case 'reviews': return `Reply to ${n} review${n > 1 ? 's' : ''}`
    case 'high-demand': return 'Raise the rate — high demand'
    default: return c.answer
  }
}
// Occupancy heat: high = good (green), mid = amber, low = rose.
function occHeat(occ) { return occ >= 70 ? 'bg-emerald-400' : occ >= 55 ? 'bg-amber-400' : 'bg-rose-400' }
// Demand heat for the high-demand table (Normal / Medium / High / Very High).
function demandLevel(v) {
  if (v >= 95) return 'bg-rose-100 text-rose-700'
  if (v >= 81) return 'bg-orange-100 text-orange-700'
  if (v >= 61) return 'bg-amber-100 text-amber-700'
  return 'bg-slate-100 text-slate-500'
}
function leftSum(items) { return items.reduce((a, it) => a + Math.round((it.pct / 100) * props.property.units), 0) }
function sliceSum(items, a, b) { return items.slice(a, b).reduce((s, d) => s + d.value, 0) }

// Y-axis scale for the pickup chart: a "nice" max + ~4 even levels.
const pickupScale = computed(() => {
  if (props.card.id !== 'pickup') return { niceMax: 1, ticks: [] }
  const rawMax = Math.max(...props.card.detail.items.map((i) => i.value), 1)
  const step = rawMax <= 6 ? 2 : Math.ceil(rawMax / 4)
  const niceMax = Math.ceil(Math.max(4, rawMax) / step) * step
  const ticks = []
  for (let v = 0; v <= niceMax; v += step) ticks.push(v)
  return { niceMax, ticks }
})

function addTask() {
  tasks.addTask({
    title: `${props.card.label}: ${props.card.answer}`,
    propertyId: props.property.id,
    ownerName: props.property.ownerName,
    priority: actionMeta[props.card.id]?.signal === 'urgent' ? 'high' : 'medium',
  })
  ui.toast('Task created')
}
function askAI() {
  chat.open = true
  chat.send(`${props.property.name} — ${props.card.question} (${props.card.label})`)
}
</script>

<template>
  <div
    class="relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white shadow-card transition-colors duration-150 ease-out"
    :class="isAction ? 'overflow-hidden p-4 pl-5 hover:bg-slate-50/40' : 'p-4'"
  >
    <!-- ── Action style ── -->
    <template v-if="isAction">
    <span class="absolute inset-y-0 left-0 w-1" :class="handled ? 'bg-emerald-500' : signalSpine[actionMeta[card.id].signal]" />

    <div class="flex items-start gap-2.5">
      <button
        class="pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 ease-out"
        :class="handled ? 'bg-emerald-50 text-emerald-600' : signalChip[actionMeta[card.id].signal]"
        :aria-label="handled ? 'Mark as not handled' : 'Mark as handled'"
        @click="toggle"
      >
        <component :is="handled ? Check : actionMeta[card.id].icon" class="h-4 w-4" />
      </button>
      <p class="flex-1 pt-1 text-sm font-bold leading-snug" :class="handled ? 'text-slate-400 line-through' : 'text-slate-900'">
        {{ actionTitle(card) }}
      </p>
    </div>

    <!-- reviews → snippet boxes -->
    <div v-if="card.id === 'reviews'" class="mt-2 space-y-1.5" :class="handled ? 'opacity-50' : ''">
      <div v-for="(it, idx) in card.detail.items" :key="idx" class="rounded-lg bg-slate-50 px-3 py-2">
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <OtaLogo v-if="it.logoName" :src="it.logo" :name="it.logoName" :size="15" />
          <span class="font-semibold text-slate-700">{{ it.title }}</span>
          <span class="text-slate-400">· {{ it.logoName }} ·</span>
          <span class="tabular-nums text-slate-600">{{ it.right }}</span>
        </div>
        <p class="mt-1 text-[11px] leading-snug text-slate-500">“{{ it.sub }}”</p>
      </div>
    </div>

    <!-- high-demand → 7-day demand heatmap table -->
    <div v-else-if="card.id === 'high-demand'" class="mt-3" :class="handled ? 'opacity-50' : ''">
      <div class="overflow-x-auto">
        <div class="grid min-w-max gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-center" style="grid-template-columns: 76px repeat(7, minmax(44px, 1fr))">
          <!-- corner -->
          <div class="sticky left-0 z-10 bg-white" style="grid-column: 1; grid-row: 1 / span 2" />
          <!-- month bar -->
          <div class="bg-slate-50 py-1 text-xs font-semibold text-slate-600" style="grid-column: 2 / span 7; grid-row: 1">{{ card.detail.monthLabel }}</div>
          <!-- day header (dow + date) -->
          <div v-for="(d, i) in card.detail.days" :key="'h' + i" class="bg-white py-1.5" :style="{ gridColumn: i + 2, gridRow: 2 }">
            <p class="text-[9px] uppercase leading-none text-slate-400">{{ d.dow }}</p>
            <p class="mt-0.5 text-xs font-bold leading-none tabular-nums text-slate-800">{{ d.day }}</p>
          </div>
          <!-- demand -->
          <div class="sticky left-0 z-10 flex items-center bg-white px-2 text-left text-[10px] text-slate-500" style="grid-column: 1; grid-row: 3">Demand (%)</div>
          <div v-for="(d, i) in card.detail.days" :key="'dem' + i" class="py-1.5 text-[11px] font-bold tabular-nums" :class="demandLevel(d.demand)" :style="{ gridColumn: i + 2, gridRow: 3 }">{{ d.demand }}</div>
          <!-- rate change -->
          <div class="sticky left-0 z-10 flex items-center bg-white px-2 text-left text-[10px] text-slate-500" style="grid-column: 1; grid-row: 4">Rate change</div>
          <div v-for="(d, i) in card.detail.days" :key="'rc' + i" class="py-1.5 text-[10px] font-semibold tabular-nums" :class="d.uplift > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-slate-300'" :style="{ gridColumn: i + 2, gridRow: 4 }">{{ d.uplift > 0 ? `+${d.uplift}%` : '—' }}</div>
          <!-- price range -->
          <div class="sticky left-0 z-10 flex items-center bg-white px-2 text-left text-[10px] text-slate-500" style="grid-column: 1; grid-row: 5">Price range</div>
          <div v-for="(d, i) in card.detail.days" :key="'pr' + i" class="bg-slate-50 py-1.5 leading-tight" :style="{ gridColumn: i + 2, gridRow: 5 }">
            <p class="text-[9px] tabular-nums text-slate-400">{{ d.currentText }}</p>
            <p class="text-[10px] font-semibold tabular-nums" :class="d.uplift > 0 ? 'text-emerald-600' : 'text-slate-300'">{{ d.deltaText }}</p>
          </div>
        </div>
      </div>
      <!-- legend -->
      <div class="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[9px] text-slate-400">
        <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-slate-300" /> 0–60% Normal</span>
        <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-amber-400" /> 61–80% Medium</span>
        <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-orange-400" /> 81–94% High</span>
        <span class="flex items-center gap-1"><span class="h-2 w-2 rounded-full bg-rose-500" /> 95–100% Very High</span>
      </div>
    </div>

    <!-- cancellations → recover rows -->
    <div v-else class="mt-3 space-y-2" :class="handled ? 'opacity-50' : ''">
      <div v-for="(it, idx) in card.detail.items" :key="idx" class="flex items-center gap-2.5 rounded-xl bg-rose-50/60 px-3 py-2">
        <OtaLogo v-if="it.logoName" :src="it.logo" :name="it.logoName" :size="22" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-xs font-semibold text-slate-800">{{ it.sub }}</p>
          <p class="truncate text-[11px] text-slate-500">{{ it.title }}</p>
        </div>
        <div class="shrink-0 text-right">
          <p class="text-xs font-bold tabular-nums text-rose-600">{{ it.right }}</p>
          <p class="text-[10px] text-slate-400">at risk</p>
        </div>
      </div>
    </div>

    <div class="mt-auto flex items-center gap-2 pt-3">
      <button
        v-if="handled"
        class="pressable inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
        @click="toggle"
      >
        <Undo2 class="h-3.5 w-3.5" /> Undo
      </button>
      <template v-else>
        <button class="pressable inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-150 ease-out hover:bg-slate-50" aria-label="Add task" @click="addTask">
          <ListPlus class="h-3.5 w-3.5" /> Add task
        </button>
        <button class="pressable inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-150 ease-out hover:bg-slate-50" aria-label="Ask AI" @click="askAI">
          <MessageCircle class="h-3.5 w-3.5" /> Ask AI
        </button>
      </template>
    </div>
    </template>

    <!-- ── Monitor style ── -->
    <template v-else>
    <!-- New bookings -->
    <template v-if="card.id === 'new-bookings'">
      <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span>New bookings</span>
        <span class="h-1 w-1 rounded-full bg-slate-300" />
        <span>Last 7 days</span>
      </div>
      <BookingsDonut :items="card.detail.items" class="mt-3" />
    </template>

    <!-- Occupancy (healthy / watch) -->
    <template v-else-if="card.id === 'low-occ'">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2">
          <span class="h-2 w-2 rounded-full" :class="statusDot[card.status]" />
          <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Occupancy · next 7 days</span>
        </div>
        <button class="pressable inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600" @click="askAI"><Sparkles class="h-3 w-3" /> Ask</button>
      </div>
      <div class="mt-3 flex items-center gap-3">
        <RingProgress
          :value="card.detail.avg"
          :size="68"
          :stroke="7"
          :color="card.status === 'good' ? '#10b981' : card.status === 'watch' ? '#f59e0b' : '#f43f5e'"
          track="#e2e8f0"
        >
          <span class="text-sm font-bold tracking-tight tabular-nums text-slate-900">{{ card.detail.avg }}%</span>
        </RingProgress>
        <div class="min-w-0">
          <span
            v-if="card.status !== 'good'"
            class="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold"
            :class="card.status === 'attention' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'"
          >{{ card.status === 'attention' ? 'Needs promo' : 'Watch' }}</span>
          <p
            class="flex items-center gap-1.5 text-xs font-medium"
            :class="[card.status === 'good' ? 'text-emerald-600' : card.status === 'watch' ? 'text-amber-600' : 'text-rose-600', card.status !== 'good' ? 'mt-1' : '']"
          >
            <component :is="card.status === 'good' ? Check : AlertTriangle" class="h-3.5 w-3.5 shrink-0" />
            {{ card.status === 'good'
              ? 'Above target · no soft dates'
              : card.status === 'watch'
                ? `Just below target · ${card.detail.softCount} date${card.detail.softCount > 1 ? 's' : ''} softening`
                : `${card.detail.softCount} date${card.detail.softCount > 1 ? 's' : ''} need a promo` }}
          </p>
          <p class="mt-1 text-[11px] text-slate-400">{{ property.units }} rooms total</p>
        </div>
      </div>

      <!-- Occupancy calendar · next 7 days -->
      <div class="mt-4 grid gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-center" style="grid-template-columns: repeat(7, minmax(0, 1fr))">
        <!-- month bar -->
        <div class="bg-slate-50 py-1 text-xs font-semibold text-slate-600" style="grid-column: 1 / -1; grid-row: 1">{{ card.detail.monthLabel }}</div>
        <!-- day header (dow + date) -->
        <div v-for="(d, idx) in card.detail.days" :key="'h' + idx" class="bg-white py-1.5" :style="{ gridColumn: idx + 1, gridRow: 2 }" :title="`${d.dow} ${d.day}: ${d.occ}%`">
          <p class="text-[9px] font-semibold uppercase leading-none" :class="d.weekend ? 'text-sky-500' : 'text-slate-400'">{{ d.dow }}</p>
          <p class="mt-0.5 text-xs font-bold leading-none tabular-nums" :class="d.weekend ? 'text-sky-600' : 'text-slate-800'">{{ d.day }}</p>
        </div>
        <!-- occupancy cell -->
        <div v-for="(d, idx) in card.detail.days" :key="'o' + idx" class="flex items-center justify-center py-2 text-[10px] font-bold text-white" :class="occHeat(d.occ)" :style="{ gridColumn: idx + 1, gridRow: 3 }">{{ d.occ }}%</div>
      </div>
    </template>

    <!-- Left to sell -->
    <template v-else-if="card.id === 'left-to-sell'">
      <div class="flex items-start justify-between">
        <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span>Left to sell</span>
          <span class="h-1 w-1 rounded-full bg-slate-300" />
          <span>Next 7 days</span>
        </div>
        <button class="pressable inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600" @click="askAI"><Sparkles class="h-3 w-3" /> Ask</button>
      </div>
      <p class="mt-2 text-lg font-bold tracking-tight text-slate-900">~{{ leftSum(card.detail.items) }} open</p>
      <p class="text-[11px] text-slate-400">Rooms still available, of {{ property.units }} / night</p>
      <ul class="mt-3 space-y-2">
        <li v-for="(it, idx) in card.detail.items" :key="idx" class="flex items-center gap-2 text-xs">
          <span class="w-14 shrink-0 text-slate-500">{{ it.title }}</span>
          <div class="flex min-w-0 flex-1 gap-1">
            <span
              v-for="n in property.units"
              :key="n"
              class="h-3.5 flex-1 rounded-sm"
              :class="n <= it.rooms ? (it.pct <= 30 ? 'bg-emerald-500' : 'bg-slate-700') : 'bg-slate-200'"
            />
          </div>
          <span class="w-12 shrink-0 whitespace-nowrap text-right tabular-nums" :class="it.pct <= 30 ? 'font-semibold text-emerald-600' : 'text-slate-700'">{{ it.right }}</span>
        </li>
      </ul>
    </template>

    <!-- Pickup (full width) -->
    <template v-else-if="card.id === 'pickup'">
      <div class="flex items-start justify-between">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">Pickup · next 14 days</span>
        <button class="pressable inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600" @click="askAI"><Sparkles class="h-3 w-3" /> Ask</button>
      </div>
      <p class="mt-2 text-lg font-bold tracking-tight text-slate-900">{{ sliceSum(card.detail.items, 0, 7) }} rooms picked up this week</p>
      <p class="text-[11px] text-slate-400">Rooms booked per arrival date · {{ sliceSum(card.detail.items, 7, 14) }} more in days 8–14</p>
      <div class="mt-4 flex gap-2">
        <!-- Y axis -->
        <div class="relative w-5 shrink-0" style="height: 110px">
          <span
            v-for="t in pickupScale.ticks"
            :key="t"
            class="absolute right-0 translate-y-1/2 text-[9px] leading-none tabular-nums text-slate-400"
            :style="{ bottom: `${(t / pickupScale.niceMax) * 100}%` }"
          >{{ t }}</span>
        </div>
        <!-- Plot + date labels -->
        <div class="min-w-0 flex-1">
          <div class="relative" style="height: 110px">
            <!-- gridlines -->
            <span
              v-for="t in pickupScale.ticks"
              :key="t"
              class="absolute inset-x-0 border-t border-slate-100"
              :style="{ bottom: `${(t / pickupScale.niceMax) * 100}%` }"
            />
            <!-- bars -->
            <div class="absolute inset-0 flex items-end gap-1.5">
              <div
                v-for="(it, idx) in card.detail.items"
                :key="idx"
                class="relative flex h-full flex-1 items-end justify-center"
                @mouseenter="pickupHover = idx"
                @mouseleave="pickupHover = null"
              >
                <span
                  class="w-2/3 rounded-t transition-[height,opacity] duration-150 ease-out"
                  :class="[idx < 7 ? 'bg-slate-700' : 'bg-slate-400', pickupHover !== null && pickupHover !== idx ? 'opacity-40' : '']"
                  :style="{ height: `${(it.value / pickupScale.niceMax) * 100}%` }"
                />
                <!-- hover tooltip -->
                <div
                  v-if="pickupHover === idx"
                  class="pointer-events-none absolute left-1/2 z-20 -translate-x-1/2 -translate-y-2"
                  :style="{ bottom: `${(it.value / pickupScale.niceMax) * 100}%` }"
                >
                  <div class="relative whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-center shadow-pop">
                    <p class="text-[11px] font-bold leading-none text-white"><span class="tabular-nums">{{ it.value }}</span> rooms</p>
                    <p class="mt-1 text-[10px] leading-none text-slate-300">{{ it.full }}</p>
                    <span class="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45 bg-slate-900" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="mt-1.5 flex gap-1.5">
            <span v-for="(it, idx) in card.detail.items" :key="idx" class="flex-1 truncate text-center text-[10px] tabular-nums text-slate-400">{{ it.label }}</span>
          </div>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
        <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-slate-700" /> Next 7 days</span>
        <span class="flex items-center gap-1.5"><span class="h-2.5 w-2.5 rounded-sm bg-slate-400" /> Days 8–14</span>
      </div>
    </template>

    <!-- Calm confirmation (actionable item with nothing to do) -->
    <template v-else>
      <div class="flex items-start justify-between">
        <span class="text-xs font-semibold uppercase tracking-wide text-slate-400">{{ card.label }}</span>
        <button class="pressable inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-600" @click="askAI"><Sparkles class="h-3 w-3" /> Ask</button>
      </div>
      <div class="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
        <span class="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check class="h-5 w-5" /></span>
        <p class="text-sm font-semibold text-slate-700">{{ card.answer }}</p>
      </div>
    </template>
    </template>
  </div>
</template>
