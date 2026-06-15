<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Bot, ShieldCheck, LayoutGrid, List, ChevronLeft, ChevronRight, Clock, X, Check, CheckSquare, ListPlus } from 'lucide-vue-next'
import { useAgentStore } from '@/stores/agent'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTasksStore } from '@/stores/tasks'
import { SUGGESTION_REJECT_REASONS } from '@/mock/suggestionEvents'
import RecommendationCard from '@/components/RecommendationCard.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import dayjs from 'dayjs'
import { idr } from '@/mock/util'

const agent = useAgentStore()
const portfolio = usePortfolioStore()
const tasks = useTasksStore()
const tab = ref('inbox')
const filter = ref('all') // all | approval | auto
const mode = ref('grid') // grid | queue (#1 review queue)

// ── #2 Bulk add-to-task (grid only) ──
const selectMode = ref(false)
const selected = ref(new Set())
function toggleSelect(id) {
  const s = new Set(selected.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selected.value = s
}
function clearSel() {
  selected.value = new Set()
}
function toggleSelectMode() {
  selectMode.value = !selectMode.value
  if (!selectMode.value) clearSel()
}
function addSelectedToTasks() {
  const recs = [...selected.value]
    .map((id) => agent.recommendations.find((r) => r.id === id && r.status === 'pending'))
    .filter(Boolean)
  tasks.bulkAddFromRecommendations(recs)
  clearSel()
  selectMode.value = false
}

const inbox = computed(() => {
  if (filter.value === 'snoozed') return agent.snoozed
  let list = agent.pending
  if (filter.value === 'approval') list = list.filter((r) => r.risk === 'approval')
  if (filter.value === 'auto') list = list.filter((r) => r.risk === 'auto')
  return list
})
const propName = (id) => portfolio.byId(id)?.name

// ── #1 Review queue: one suggestion at a time, with keyboard shortcuts ──
const queueIndex = ref(0)
const current = computed(() => inbox.value[Math.min(queueIndex.value, inbox.value.length - 1)] || null)
// Mark the visible card as viewed (acceptance denominator).
watch(
  current,
  (rec) => { if (rec && mode.value === 'queue') agent.recordViewed(rec.id) },
  { immediate: true },
)
// Keep the index in range as the list shrinks (acted items leave `pending`).
watch(
  () => inbox.value.length,
  (n) => { if (queueIndex.value > n - 1) queueIndex.value = Math.max(0, n - 1) },
)
function next() {
  if (queueIndex.value < inbox.value.length - 1) queueIndex.value += 1
}
function prev() {
  if (queueIndex.value > 0) queueIndex.value -= 1
}
function snoozeCurrent() {
  if (current.value) agent.snooze(current.value.id) // leaves pending → list reindexes
}
const dismissOpen = ref(false)
function dismissCurrent(reason) {
  if (current.value) agent.reject(current.value.id, reason)
  dismissOpen.value = false
}

// Keyboard navigation, only while the queue is active and not typing in a field.
function onKey(e) {
  if (mode.value !== 'queue' || tab.value !== 'inbox') return
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) return
  if (e.key === 'ArrowRight') { next(); e.preventDefault() }
  else if (e.key === 'ArrowLeft') { prev(); e.preventDefault() }
  else if (e.key.toLowerCase() === 's') { snoozeCurrent(); e.preventDefault() }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))

function setMode(m) {
  mode.value = m
  queueIndex.value = 0
  dismissOpen.value = false
  selectMode.value = false
  clearSel()
}

const acc = computed(() => agent.acceptanceStats)
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-xl font-bold text-slate-900"><Bot class="h-5 w-5 text-brand-600" /> Smart Suggestions</h1>
        <p class="text-sm text-slate-500">{{ agent.pending.length }} pending · est. {{ idr(agent.estPipeline, { compact: true }) }}/wk impact — add the ones you want to your tasks and apply them yourself</p>
      </div>
      <!-- Adoption snapshot (operational, not BI) -->
      <div class="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-center">
        <p class="text-[11px] font-medium text-slate-400">Acceptance rate</p>
        <p class="text-lg font-bold text-brand-700">{{ acc.rate }}%</p>
        <p class="text-[10px] text-slate-400">{{ acc.accepted }} accepted · {{ acc.rejected }} dismissed</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mt-4 flex gap-1 border-b border-slate-200">
      <button
        v-for="t in [['inbox','Recommendations',inbox.length],['log','Activity log',agent.log.length]]"
        :key="t[0]"
        class="pressable relative px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ease-out"
        :class="tab === t[0] ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700'"
        @click="tab = t[0]"
      >
        {{ t[1] }} <span class="ml-1 text-xs text-slate-400">{{ t[2] }}</span>
        <span v-if="tab === t[0]" class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
      </button>
    </div>

    <!-- Inbox -->
    <div v-if="tab === 'inbox'" class="mt-5">
      <div class="mb-3 flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
          <button
            v-for="f in [['all','All'],['approval','Needs review'],['auto','Quick win']]"
            :key="f[0]"
            class="pressable rounded-lg px-3 py-1.5 font-medium transition-colors duration-150 ease-out"
            :class="filter === f[0] ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'"
            @click="filter = f[0]"
          >
            {{ f[1] }}
          </button>
        </div>

        <!-- Bulk select (grid only) -->
        <button
          v-if="mode === 'grid' && inbox.length"
          class="pressable ml-auto inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-colors duration-150"
          :class="selectMode ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-500 hover:text-slate-700'"
          @click="toggleSelectMode"
        >
          <CheckSquare class="h-3.5 w-3.5" /> {{ selectMode ? 'Cancel select' : 'Select' }}
        </button>

        <!-- View: grid / review queue -->
        <div class="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-0.5" :class="mode === 'grid' && inbox.length ? '' : 'ml-auto'">
          <button
            class="pressable inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-150"
            :class="mode === 'grid' ? 'bg-brand-50 text-brand-700' : 'text-slate-400 hover:text-slate-600'"
            @click="setMode('grid')"
          >
            <LayoutGrid class="h-3.5 w-3.5" /> Grid
          </button>
          <button
            class="pressable inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-150"
            :class="mode === 'queue' ? 'bg-brand-50 text-brand-700' : 'text-slate-400 hover:text-slate-600'"
            @click="setMode('queue')"
          >
            <List class="h-3.5 w-3.5" /> Review queue
          </button>
        </div>
      </div>

      <!-- Empty -->
      <div v-if="!inbox.length" class="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
        <ShieldCheck class="mx-auto h-8 w-8 text-emerald-400" />
        <p class="mt-2 text-sm font-medium text-slate-600">Inbox zero — all recommendations handled.</p>
      </div>

      <!-- Grid -->
      <div v-else-if="mode === 'grid'">
        <div class="stagger grid gap-3 lg:grid-cols-2">
          <div
            v-for="(rec, i) in inbox"
            :key="rec.id"
            class="relative rounded-2xl transition-shadow"
            :class="selectMode && selected.has(rec.id) ? 'ring-2 ring-brand-500 ring-offset-2' : ''"
            :style="{ '--i': i % 6 }"
          >
            <div :class="selectMode ? 'pointer-events-none' : ''">
              <RecommendationCard :rec="rec" show-property />
            </div>
            <!-- Selection overlay -->
            <button
              v-if="selectMode"
              class="absolute inset-0 z-10 rounded-2xl"
              :title="selected.has(rec.id) ? 'Deselect' : 'Select'"
              @click="toggleSelect(rec.id)"
            >
              <span
                class="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors"
                :class="selected.has(rec.id) ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white'"
              >
                <Check v-if="selected.has(rec.id)" class="h-3 w-3" />
              </span>
            </button>
          </div>
        </div>

        <!-- Bulk action bar -->
        <div
          v-if="selectMode && selected.size"
          class="sticky bottom-4 z-20 mx-auto mt-4 flex w-fit items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-pop"
        >
          <span class="text-sm font-medium text-slate-700">{{ selected.size }} selected</span>
          <AppButton variant="primary" size="sm" @click="addSelectedToTasks">
            <ListPlus class="h-3.5 w-3.5" /> Add to tasks
          </AppButton>
          <AppButton variant="ghost" size="sm" @click="clearSel">Clear</AppButton>
        </div>
      </div>

      <!-- Review queue -->
      <div v-else class="mx-auto max-w-2xl">
        <div class="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span class="font-medium">{{ Math.min(queueIndex + 1, inbox.length) }} of {{ inbox.length }}</span>
          <span class="text-slate-400">← → to navigate · S to snooze</span>
        </div>
        <div class="flex items-stretch gap-2">
          <button
            class="pressable flex w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-40"
            :disabled="queueIndex === 0"
            title="Previous (←)"
            @click="prev"
          >
            <ChevronLeft class="h-5 w-5" />
          </button>

          <div class="min-w-0 flex-1">
            <RecommendationCard v-if="current" :key="current.id" :rec="current" show-property />
          </div>

          <button
            class="pressable flex w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors duration-150 hover:bg-slate-50 disabled:opacity-40"
            :disabled="queueIndex >= inbox.length - 1"
            title="Next (→)"
            @click="next"
          >
            <ChevronRight class="h-5 w-5" />
          </button>
        </div>

        <!-- Queue action bar -->
        <div class="mt-3 flex flex-wrap items-center justify-center gap-2">
          <AppButton variant="secondary" size="sm" title="Snooze until tomorrow (S)" @click="snoozeCurrent">
            <Clock class="h-3.5 w-3.5" /> Snooze
          </AppButton>
          <div class="relative">
            <AppButton variant="ghost" size="sm" @click="dismissOpen = !dismissOpen">
              <X class="h-3.5 w-3.5" /> Dismiss
            </AppButton>
            <div v-if="dismissOpen" class="fixed inset-0 z-10" @click="dismissOpen = false"></div>
            <div v-if="dismissOpen" class="absolute left-1/2 z-20 mt-1.5 w-48 -translate-x-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-pop">
              <p class="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Reason</p>
              <button
                v-for="r in SUGGESTION_REJECT_REASONS"
                :key="r"
                class="pressable block w-full px-3 py-2 text-left text-sm text-slate-600 transition-colors duration-150 hover:bg-slate-50"
                @click="dismissCurrent(r)"
              >
                {{ r }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Activity log -->
    <div v-else class="mt-5">
      <Card title="Audit trail" subtitle="Every action you approved or applied">
        <ol class="relative space-y-4 border-l border-slate-100 pl-5">
          <li v-for="a in agent.log" :key="a.id" class="relative">
            <span class="absolute -left-[23px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-medium text-slate-800">{{ a.summary }}</p>
              <Badge tone="green" size="sm">Applied</Badge>
            </div>
            <p class="mt-0.5 text-xs text-slate-400">
              {{ propName(a.propertyId) }} · {{ dayjs(a.timestamp).format('DD MMM, HH:mm') }}
              <span v-if="a.before !== '—'"> · {{ a.before }} → {{ a.after }}</span>
            </p>
          </li>
        </ol>
      </Card>
    </div>
  </div>
</template>
