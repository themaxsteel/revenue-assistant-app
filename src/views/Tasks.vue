<script setup>
import { ref, computed, reactive } from 'vue'
import dayjs from 'dayjs'
import {
  ListTodo, Plus, Bot, Hand, CalendarCheck, List, CalendarDays,
} from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks'
import { usePortfolioStore } from '@/stores/portfolio'
import { TASK_TEMPLATES, taskPropertyName } from '@/mock/tasks'
import TaskItem from '@/components/TaskItem.vue'
import TaskCalendar from '@/components/TaskCalendar.vue'
import TaskDetailModal from '@/components/TaskDetailModal.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Modal from '@/components/ui/Modal.vue'
import { idr } from '@/mock/util'

const tasks = useTasksStore()
const portfolio = usePortfolioStore()

const tab = ref('tasks')
const taskView = ref('list') // list | calendar
const filter = ref('all') // all | overdue | today | done

// Add-task form (in a modal so the list stays focused on doing the work).
const addOpen = ref(false)
const form = reactive({ title: '', propertyId: '', priority: 'medium', due: 'none', recurring: '' })
const dueOptions = { none: null, today: () => dayjs().toISOString(), tomorrow: () => dayjs().add(1, 'day').toISOString(), week: () => dayjs().add(7, 'day').toISOString() }

function openAdd() {
  form.title = ''
  form.propertyId = ''
  form.priority = 'medium'
  form.due = 'none'
  form.recurring = ''
  addOpen.value = true
}
function applyTemplate(t) {
  form.title = t.label
  form.priority = t.priority
  form.recurring = t.recurring || ''
}
function add() {
  if (!form.title.trim()) return
  const prop = form.propertyId ? portfolio.byId(form.propertyId) : null
  tasks.addTask({
    title: form.title,
    propertyId: form.propertyId || null,
    ownerName: prop?.ownerName || null,
    priority: form.priority,
    dueAt: dueOptions[form.due] ? dueOptions[form.due]() : null,
    recurring: form.recurring || null,
  })
  addOpen.value = false
}

// Filtered + grouped open tasks
const visible = computed(() => {
  if (filter.value === 'overdue') return tasks.overdue
  if (filter.value === 'today') return tasks.dueToday
  if (filter.value === 'done') return tasks.done
  return tasks.open
})
const groups = computed(() => {
  if (filter.value !== 'all') return null
  const o = tasks.open
  return {
    Overdue: o.filter((t) => t.dueAt && dayjs(t.dueAt).isBefore(dayjs(), 'day')),
    Today: o.filter((t) => t.dueAt && dayjs(t.dueAt).isSame(dayjs(), 'day')),
    Upcoming: o.filter((t) => !t.dueAt || dayjs(t.dueAt).isAfter(dayjs(), 'day')),
  }
})

// Task detail modal
const detail = reactive({ open: false, task: null })
function openDetail(task) {
  detail.task = task
  detail.open = true
}

// Outcome modal
const outcomeModal = reactive({ open: false, task: null, note: '', impact: '' })
function openOutcome(task) {
  outcomeModal.open = true
  outcomeModal.task = task
  outcomeModal.note = ''
  outcomeModal.impact = ''
}
function saveOutcome() {
  const t = outcomeModal.task
  t.outcome = { note: outcomeModal.note || 'Completed', impact: Number(outcomeModal.impact) * 1_000_000 || 0 }
  outcomeModal.open = false
}

// Activity timeline — grouped by date, filterable by source, paginated.
const activityKind = ref('all') // all | manual | ai
const activityLimit = ref(25)
const activities = computed(() => tasks.activities)

const filteredActivities = computed(() =>
  activities.value.filter((a) => activityKind.value === 'all' || a.kind === activityKind.value),
)
const visibleActivities = computed(() => filteredActivities.value.slice(0, activityLimit.value))

function dateBucket(ts) {
  const d = dayjs(ts)
  if (d.isSame(dayjs(), 'day')) return 'Today'
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday'
  if (d.isAfter(dayjs().subtract(7, 'day'))) return 'Earlier this week'
  return 'Older'
}
const groupedActivities = computed(() => {
  const buckets = { Today: [], Yesterday: [], 'Earlier this week': [], Older: [] }
  visibleActivities.value.forEach((a) => buckets[dateBucket(a.timestamp)].push(a))
  return Object.entries(buckets).filter(([, items]) => items.length)
})
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="flex items-center gap-2 text-xl font-bold text-slate-900"><ListTodo class="h-5 w-5 text-brand-600" /> Tasks & Activities</h1>
        <p class="text-sm text-slate-500">Track manual work and keep a log of everything you do across your properties.</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="mt-4 flex gap-1 border-b border-slate-200">
      <button
        v-for="t in [['tasks','Tasks', tasks.open.length],['activity','Activity', activities.length]]"
        :key="t[0]"
        class="pressable relative px-3.5 py-2.5 text-sm font-medium transition-colors duration-150 ease-out"
        :class="tab === t[0] ? 'text-brand-700' : 'text-slate-500 hover:text-slate-700'"
        @click="tab = t[0]"
      >
        {{ t[1] }} <span class="ml-1 text-xs text-slate-400">{{ t[2] }}</span>
        <span v-if="tab === t[0]" class="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />
      </button>
    </div>

    <!-- TASKS TAB -->
    <div v-if="tab === 'tasks'">
      <div class="mt-4 flex items-center justify-between gap-2">
        <div class="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 text-xs w-fit">
          <button
            v-for="v in [['list','List', List],['calendar','Calendar', CalendarDays]]"
            :key="v[0]"
            class="pressable inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors duration-150 ease-out"
            :class="taskView === v[0] ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'"
            @click="taskView = v[0]"
          >
            <component :is="v[2]" class="h-3.5 w-3.5" /> {{ v[1] }}
          </button>
        </div>
        <AppButton variant="primary" size="sm" @click="openAdd"><Plus class="h-4 w-4" /> Add task</AppButton>
      </div>

      <TaskCalendar v-if="taskView === 'calendar'" class="mt-4" @add-outcome="openOutcome" @open="openDetail" />
    </div>

    <div v-if="tab === 'tasks' && taskView === 'list'" class="mt-4">
      <div class="space-y-4">
        <!-- Filter chips + bulk reschedule -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
            <button
              v-for="f in [['all','All'],['overdue','Overdue'],['today','Today'],['done','Done']]"
              :key="f[0]"
              class="pressable rounded-lg px-3 py-1.5 font-medium transition-colors duration-150 ease-out"
              :class="filter === f[0] ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'"
              @click="filter = f[0]"
            >
              {{ f[1] }}
              <span v-if="f[0] === 'overdue' && tasks.overdue.length" class="ml-1 rounded-full bg-rose-100 px-1.5 text-rose-600">{{ tasks.overdue.length }}</span>
            </button>
          </div>
          <button
            v-if="tasks.overdue.length"
            class="pressable inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition-colors duration-150 ease-out hover:bg-amber-100"
            @click="tasks.rescheduleOverdue()"
          >
            <CalendarCheck class="h-3.5 w-3.5" /> Reschedule {{ tasks.overdue.length }} overdue → today
          </button>
        </div>

        <!-- Grouped (All) -->
        <template v-if="groups">
          <div v-for="(items, name) in groups" :key="name" v-show="items.length">
            <div class="mb-2 flex items-center gap-2">
              <h2 class="text-sm font-semibold text-slate-700">{{ name }}</h2>
              <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{{ items.length }}</span>
            </div>
            <TransitionGroup name="task" tag="div" class="space-y-2">
              <TaskItem
                v-for="t in items"
                :key="t.id"
                :task="t"
                @complete="tasks.complete"
                @reopen="tasks.reopen"
                @remove="tasks.remove"
                @add-outcome="openOutcome"
                @open="openDetail"
              />
            </TransitionGroup>
          </div>
          <p v-if="!tasks.open.length" class="rounded-2xl border border-dashed border-slate-200 py-14 text-center text-sm text-slate-400">No open tasks — you're all caught up. 🎉</p>
        </template>

        <!-- Flat (filtered) -->
        <div v-else class="space-y-2">
          <TaskItem
            v-for="t in visible"
            :key="t.id"
            :task="t"
            @complete="tasks.complete"
            @reopen="tasks.reopen"
            @remove="tasks.remove"
            @add-outcome="openOutcome"
            @open="openDetail"
          />
          <p v-if="!visible.length" class="py-12 text-center text-sm text-slate-400">Nothing here.</p>
        </div>
      </div>
    </div>

    <!-- ACTIVITY TAB -->
    <div v-else class="mt-5">
      <Card title="Activity timeline" subtitle="Manual actions + AI agent actions, combined">
        <template #actions>
          <div class="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
            <button
              v-for="f in [['all','All'],['manual','Manual'],['ai','AI']]"
              :key="f[0]"
              class="pressable rounded-lg px-2.5 py-1 font-medium transition-colors duration-150 ease-out"
              :class="activityKind === f[0] ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:text-slate-700'"
              @click="activityKind = f[0]"
            >{{ f[1] }}</button>
          </div>
        </template>

        <div v-for="[bucket, items] in groupedActivities" :key="bucket" class="mb-5 last:mb-0">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{{ bucket }}</p>
          <ol class="relative space-y-4 border-l border-slate-100 pl-5">
            <li v-for="a in items" :key="a.id" class="relative">
              <span class="absolute -left-[23px] top-1 flex h-4 w-4 items-center justify-center rounded-full" :class="a.kind === 'ai' ? 'bg-brand-100' : 'bg-emerald-100'">
                <component :is="a.kind === 'ai' ? Bot : Hand" class="h-2.5 w-2.5" :class="a.kind === 'ai' ? 'text-brand-600' : 'text-emerald-600'" />
              </span>
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-sm font-medium text-slate-800">{{ a.summary }}</p>
                <Badge :tone="a.kind === 'ai' ? 'brand' : 'green'" size="sm">{{ a.kind === 'ai' ? 'AI Recommendation' : 'Manual' }}</Badge>
                <span v-if="a.impact" class="text-xs font-semibold text-emerald-600">+{{ idr(a.impact, { compact: true }) }}</span>
              </div>
              <p class="mt-0.5 text-xs text-slate-400">
                <span v-if="taskPropertyName(a.propertyId)">{{ taskPropertyName(a.propertyId) }} · </span>
                {{ dayjs(a.timestamp).format('DD MMM, HH:mm') }}
                <span v-if="a.outcomeNote"> · {{ a.outcomeNote }}</span>
              </p>
            </li>
          </ol>
        </div>

        <div v-if="filteredActivities.length > activityLimit" class="mt-2 text-center">
          <AppButton variant="secondary" size="sm" @click="activityLimit += 25">
            Show more ({{ filteredActivities.length - activityLimit }} older)
          </AppButton>
        </div>
        <p v-if="!filteredActivities.length" class="py-8 text-center text-sm text-slate-400">No activity yet.</p>
      </Card>
    </div>

    <!-- Add task -->
    <Modal :open="addOpen" title="Add task" @close="addOpen = false">
      <div class="space-y-3">
        <div>
          <label class="text-xs font-medium text-slate-500">Task</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="e.g. Call owner of Villa A"
            class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            @keyup.enter="add"
          />
          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            <span class="text-xs text-slate-400">Templates:</span>
            <button
              v-for="t in TASK_TEMPLATES"
              :key="t.label"
              class="pressable rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors duration-150 ease-out hover:border-brand-300 hover:text-brand-700"
              @click="applyTemplate(t)"
            >{{ t.label }}</button>
          </div>
        </div>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="text-xs font-medium text-slate-500">Property</label>
            <select v-model="form.propertyId" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none">
              <option value="">No property</option>
              <option v-for="p in portfolio.properties" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-500">Priority</label>
            <select v-model="form.priority" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-500">Due</label>
            <select v-model="form.due" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none">
              <option value="none">No date</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="week">This week</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-500">Recurring</label>
            <select v-model="form.recurring" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none">
              <option value="">One-off</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>
      <template #footer>
        <AppButton variant="ghost" size="sm" @click="addOpen = false">Cancel</AppButton>
        <AppButton variant="primary" size="sm" :disabled="!form.title.trim()" @click="add"><Plus class="h-4 w-4" /> Add task</AppButton>
      </template>
    </Modal>

    <!-- Task detail / edit -->
    <TaskDetailModal :open="detail.open" :task="detail.task" @close="detail.open = false" />

    <!-- Outcome modal -->
    <Modal :open="outcomeModal.open" title="Log task outcome" @close="outcomeModal.open = false">
      <p class="text-sm text-slate-500">What was the result of “{{ outcomeModal.task?.title }}”?</p>
      <label class="mt-3 block text-xs font-medium text-slate-500">Outcome</label>
      <input v-model="outcomeModal.note" type="text" placeholder="e.g. Owner approved higher weekend rates" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100" />
      <label class="mt-3 block text-xs font-medium text-slate-500">Revenue impact (optional, in million IDR)</label>
      <input v-model="outcomeModal.impact" type="number" placeholder="e.g. 2.5" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100" />
      <template #footer>
        <AppButton variant="ghost" size="sm" @click="outcomeModal.open = false">Cancel</AppButton>
        <AppButton variant="primary" size="sm" @click="saveOutcome">Save outcome</AppButton>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
/* Completed/removed tasks collapse out instead of popping — others slide up. */
.task-enter-active {
  transition: opacity 260ms var(--ease-out), transform 260ms var(--ease-out);
}
.task-leave-active {
  transition: opacity 240ms var(--ease-out), transform 240ms var(--ease-out);
  position: absolute;
  width: 100%;
}
.task-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.task-leave-to {
  opacity: 0;
  transform: translateX(14px);
}
.task-move {
  transition: transform 260ms var(--ease-out);
}
</style>

