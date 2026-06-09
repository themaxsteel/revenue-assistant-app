<script setup>
import { computed, ref, reactive, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import dayjs from 'dayjs'
import {
  Bell, Check, ListTodo, AlertTriangle, Plus, CheckCircle2,
  ChevronDown, ChevronUp, ListPlus, Sparkles, Zap, ShieldCheck,
} from 'lucide-vue-next'
import { useAgentStore } from '@/stores/agent'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTasksStore } from '@/stores/tasks'
import { useUiStore } from '@/stores/ui'
import StatCard from '@/components/ui/StatCard.vue'
import Card from '@/components/ui/Card.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Badge from '@/components/ui/Badge.vue'
import TaskItem from '@/components/TaskItem.vue'
import TaskDetailModal from '@/components/TaskDetailModal.vue'
import Modal from '@/components/ui/Modal.vue'
import { idr } from '@/mock/util'

const props = defineProps({ property: Object })
const route = useRoute()
const agent = useAgentStore()
const portfolio = usePortfolioStore()
const tasksStore = useTasksStore()
const ui = useUiStore()

// ── Recommendations (right rail, compact) ───────────────────────────
const pending = computed(() =>
  agent.forProperty(props.property.id).filter((r) => r.status === 'pending'),
)
const alerts = computed(() =>
  portfolio.alerts.filter((a) => a.propertyId === props.property.id && !a.resolved),
)

function approveRec(rec) {
  agent.approve(rec.id)
  ui.toast('Recommendation approved')
}
function recToTask(rec) {
  tasksStore.addFromRecommendation(rec)
}

// ── Tasks working area (main column) ────────────────────────────────
const all = computed(() => tasksStore.forProperty(props.property.id))
const overdue = computed(() =>
  all.value.filter((t) => t.status === 'todo' && t.dueAt && dayjs(t.dueAt).isBefore(dayjs(), 'day')),
)
const open = computed(() =>
  all.value.filter(
    (t) => t.status === 'todo' && !(t.dueAt && dayjs(t.dueAt).isBefore(dayjs(), 'day')),
  ),
)
const done = computed(() =>
  all.value
    .filter((t) => t.status === 'done')
    .sort((a, b) => (b.completedAt > a.completedAt ? 1 : -1))
    .slice(0, 20),
)
const showDone = ref(false)

const title = ref('')
function add() {
  if (!title.value.trim()) return
  tasksStore.addTask({
    title: title.value,
    propertyId: props.property.id,
    ownerName: props.property.ownerName,
    priority: 'medium',
  })
  title.value = ''
}

const detail = reactive({ open: false, task: null })
function openDetail(task) {
  detail.task = task
  detail.open = true
}

const outcome = reactive({ open: false, task: null, note: '', impact: '' })
function openOutcome(task) {
  Object.assign(outcome, { open: true, task, note: '', impact: '' })
}
function saveOutcome() {
  outcome.task.outcome = {
    note: outcome.note || 'Completed',
    impact: Number(outcome.impact) * 1_000_000 || 0,
  }
  outcome.open = false
}

// ── Alerts deep-link focus ──────────────────────────────────────────
function resolve(id) {
  portfolio.resolveAlert(id)
  ui.toast('Alert resolved')
}
const focused = ref(null)
function applyFocus() {
  const id = route.query.focus
  if (!id) return
  focused.value = id
  nextTick(() => document.getElementById(`alert-anchor-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  setTimeout(() => { focused.value = null }, 2600)
}
watch(() => route.query.focus, applyFocus, { immediate: true })
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-3">
    <!-- ══ Main column: RA working area ══ -->
    <div class="space-y-5 lg:col-span-2">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Occupancy" :value="`${property.occupancy}%`" :delta="property.paceDelta" />
        <StatCard label="ADR" :value="idr(property.adr, { compact: true })" :delta="Math.round(property.paceDelta * 0.4)" />
        <StatCard label="RevPAR" :value="idr(property.revpar, { compact: true })" :delta="property.paceDelta" />
        <StatCard label="Pace vs LY" :value="`${property.paceDelta > 0 ? '+' : ''}${property.paceDelta}%`" :delta="property.paceDelta" />
      </div>

      <!-- Task counters -->
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-card">
          <ListTodo class="h-4 w-4 text-brand-600" />
          <span class="text-sm font-semibold text-slate-700">{{ open.length + overdue.length }}</span>
          <span class="text-sm text-slate-400">open</span>
        </div>
        <div v-if="overdue.length" class="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5">
          <AlertTriangle class="h-4 w-4 text-rose-500" />
          <span class="text-sm font-semibold text-rose-700">{{ overdue.length }}</span>
          <span class="text-sm text-rose-500">overdue</span>
        </div>
        <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-card">
          <CheckCircle2 class="h-4 w-4 text-emerald-500" />
          <span class="text-sm font-semibold text-slate-700">{{ done.length }}</span>
          <span class="text-sm text-slate-400">done</span>
        </div>
      </div>

      <!-- Quick add — where the RA logs its work -->
      <Card>
        <div class="flex items-center gap-2">
          <input
            v-model="title"
            type="text"
            :placeholder="`New task for ${property.name}…`"
            class="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            @keyup.enter="add"
          />
          <AppButton variant="primary" size="md" @click="add">
            <Plus class="h-4 w-4" /> Add
          </AppButton>
        </div>
      </Card>

      <!-- Overdue tasks -->
      <Card v-if="overdue.length">
        <div class="mb-3 flex items-center gap-2">
          <AlertTriangle class="h-4 w-4 text-rose-500" />
          <h2 class="text-sm font-semibold text-rose-700">Overdue ({{ overdue.length }})</h2>
        </div>
        <div class="space-y-2">
          <TaskItem
            v-for="t in overdue"
            :key="t.id"
            :task="t"
            @complete="tasksStore.complete"
            @reopen="tasksStore.reopen"
            @remove="tasksStore.remove"
            @add-outcome="openOutcome"
            @open="openDetail"
          />
        </div>
      </Card>

      <!-- Open tasks -->
      <Card>
        <div class="mb-3 flex items-center gap-2">
          <ListTodo class="h-4 w-4 text-brand-600" />
          <h2 class="text-sm font-semibold text-slate-900">
            Open tasks
            <span v-if="open.length" class="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{{ open.length }}</span>
          </h2>
        </div>
        <div v-if="open.length" class="space-y-2">
          <TaskItem
            v-for="t in open"
            :key="t.id"
            :task="t"
            @complete="tasksStore.complete"
            @reopen="tasksStore.reopen"
            @remove="tasksStore.remove"
            @add-outcome="openOutcome"
            @open="openDetail"
          />
        </div>
        <div v-else class="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
          <CheckCircle2 class="h-4 w-4 text-emerald-500" />
          No open tasks{{ done.length ? ` · ${done.length} done` : '' }}. Approve a recommendation to spin one up.
        </div>
      </Card>

      <!-- Completed (collapsible) -->
      <div v-if="done.length">
        <button
          class="pressable flex w-full items-center gap-2 rounded-xl px-1 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-700"
          @click="showDone = !showDone"
        >
          <component :is="showDone ? ChevronUp : ChevronDown" class="h-4 w-4" />
          Completed ({{ done.length }})
        </button>
        <Transition name="expand">
          <Card v-if="showDone" class="mt-2">
            <div class="space-y-2">
              <TaskItem
                v-for="t in done"
                :key="t.id"
                :task="t"
                @complete="tasksStore.complete"
                @reopen="tasksStore.reopen"
                @remove="tasksStore.remove"
                @add-outcome="openOutcome"
                @open="openDetail"
              />
            </div>
          </Card>
        </Transition>
      </div>
    </div>

    <!-- ══ Right rail: recommendations + activity ══ -->
    <div class="space-y-5">
      <Card title="AI recommendations">
        <template #actions>
          <Badge v-if="pending.length" tone="brand" size="sm">{{ pending.length }}</Badge>
        </template>
        <div v-if="pending.length" class="space-y-2.5">
          <div
            v-for="rec in pending"
            :key="rec.id"
            class="rounded-xl border border-slate-200 p-3 transition-colors duration-150 hover:border-brand-200"
          >
            <div class="flex items-start justify-between gap-2">
              <Badge :tone="rec.risk === 'auto' ? 'brand' : 'amber'" size="sm">
                <component :is="rec.risk === 'auto' ? Zap : ShieldCheck" class="h-3 w-3" />
                {{ rec.risk === 'auto' ? 'Auto' : 'Approve' }}
              </Badge>
              <span class="shrink-0 text-xs font-bold text-emerald-600">
                +{{ (rec.estImpact / 1_000_000).toFixed(1) }}M<span class="font-medium text-slate-400">/wk</span>
              </span>
            </div>
            <h3 class="mt-2 text-sm font-semibold leading-snug text-slate-900">{{ rec.title }}</h3>
            <p v-if="rec.drivers?.[0]" class="mt-1 flex items-start gap-1 text-xs text-slate-500">
              <Sparkles class="mt-0.5 h-3 w-3 shrink-0 text-brand-400" />{{ rec.drivers[0] }}
            </p>
            <div class="mt-3 flex items-center gap-2">
              <AppButton variant="success" size="sm" class="flex-1" @click="approveRec(rec)">
                <Check class="h-3.5 w-3.5" /> Approve
              </AppButton>
              <AppButton
                variant="secondary"
                size="sm"
                class="border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                title="Add as a follow-up task"
                @click="recToTask(rec)"
              >
                <ListPlus class="h-3.5 w-3.5" /> Task
              </AppButton>
            </div>
          </div>
        </div>
        <p v-else class="py-6 text-center text-sm text-slate-400">No pending recommendations — this property is on track.</p>
      </Card>

      <Card v-if="alerts.length" title="Active alerts">
        <ul class="space-y-2">
          <li
            v-for="a in alerts"
            :id="`alert-anchor-${a.id}`"
            :key="a.id"
            class="flex items-start gap-2 rounded-lg p-1.5 text-sm transition-all duration-300"
            :class="focused === a.id ? 'bg-brand-50 ring-2 ring-brand-300' : ''"
          >
            <Bell class="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
            <span class="flex-1 text-slate-600">{{ a.message }}</span>
            <button class="pressable shrink-0 rounded-lg p-1 text-emerald-600 hover:bg-emerald-50" title="Resolve" @click="resolve(a.id)">
              <Check class="h-3.5 w-3.5" />
            </button>
          </li>
        </ul>
      </Card>

    </div>
  </div>

  <TaskDetailModal :open="detail.open" :task="detail.task" @close="detail.open = false" />

  <Modal :open="outcome.open" title="Log task outcome" @close="outcome.open = false">
    <p class="text-sm text-slate-500">What was the result of "{{ outcome.task?.title }}"?</p>
    <label class="mt-3 block text-xs font-medium text-slate-500">Outcome</label>
    <input
      v-model="outcome.note"
      type="text"
      placeholder="e.g. Owner approved higher weekend rates"
      class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
    />
    <label class="mt-3 block text-xs font-medium text-slate-500">Revenue impact (optional, in million IDR)</label>
    <input
      v-model="outcome.impact"
      type="number"
      placeholder="e.g. 2.5"
      class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
    />
    <template #footer>
      <AppButton variant="ghost" size="sm" @click="outcome.open = false">Cancel</AppButton>
      <AppButton variant="primary" size="sm" @click="saveOutcome">Save outcome</AppButton>
    </template>
  </Modal>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: opacity 180ms var(--ease-out), transform 180ms var(--ease-out);
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
