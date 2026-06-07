<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'
import { ChevronLeft, ChevronRight, Plus, CalendarOff } from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks'
import TaskItem from './TaskItem.vue'
import AppButton from './ui/AppButton.vue'

const emit = defineEmits(['add-outcome', 'open'])
const tasks = useTasksStore()

const cursor = ref(dayjs().startOf('month'))
const selected = ref(dayjs().format('YYYY-MM-DD'))

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const priorityDot = { high: 'bg-rose-500', medium: 'bg-amber-500', low: 'bg-slate-300' }

// Index open tasks by due date.
const byDate = computed(() => {
  const map = {}
  tasks.open.forEach((t) => {
    if (!t.dueAt) return
    const k = dayjs(t.dueAt).format('YYYY-MM-DD')
    ;(map[k] ||= []).push(t)
  })
  return map
})
const noDate = computed(() => tasks.open.filter((t) => !t.dueAt))

// 6-week grid covering the visible month.
const cells = computed(() => {
  const start = cursor.value.startOf('month')
  const lead = (start.day() + 6) % 7 // Monday-first offset
  const gridStart = start.subtract(lead, 'day')
  return Array.from({ length: 42 }, (_, i) => {
    const d = gridStart.add(i, 'day')
    const key = d.format('YYYY-MM-DD')
    return {
      key,
      day: d.date(),
      inMonth: d.month() === cursor.value.month(),
      isToday: d.isSame(dayjs(), 'day'),
      isPast: d.isBefore(dayjs(), 'day'),
      tasks: byDate.value[key] || [],
    }
  })
})

const selectedTasks = computed(() => byDate.value[selected.value] || [])
const selectedLabel = computed(() => dayjs(selected.value).format('dddd, DD MMM'))

function prevMonth() { cursor.value = cursor.value.subtract(1, 'month') }
function nextMonth() { cursor.value = cursor.value.add(1, 'month') }
function goToday() {
  cursor.value = dayjs().startOf('month')
  selected.value = dayjs().format('YYYY-MM-DD')
}

const quickTitle = ref('')
function addForSelected() {
  if (!quickTitle.value.trim()) return
  tasks.addTask({ title: quickTitle.value, dueAt: dayjs(selected.value).toISOString(), priority: 'medium' })
  quickTitle.value = ''
}
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-[1fr_320px]">
    <!-- Calendar grid -->
    <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-slate-900">{{ cursor.format('MMMM YYYY') }}</h2>
        <div class="flex items-center gap-1.5">
          <AppButton variant="ghost" size="sm" @click="goToday">Today</AppButton>
          <button class="pressable rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50" @click="prevMonth"><ChevronLeft class="h-4 w-4" /></button>
          <button class="pressable rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50" @click="nextMonth"><ChevronRight class="h-4 w-4" /></button>
        </div>
      </div>

      <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
        <div v-for="w in weekdays" :key="w">{{ w }}</div>
      </div>
      <div class="mt-1 grid grid-cols-7 gap-1">
        <button
          v-for="c in cells"
          :key="c.key"
          class="pressable flex min-h-[68px] flex-col rounded-lg border p-1.5 text-left transition-colors duration-150 ease-out"
          :class="[
            c.key === selected ? 'border-brand-400 ring-1 ring-brand-200' : 'border-slate-100 hover:border-slate-300',
            c.inMonth ? 'bg-white' : 'bg-slate-50/60',
          ]"
          @click="selected = c.key"
        >
          <span
            class="mb-1 inline-flex h-5 w-5 items-center justify-center self-start rounded-full text-xs font-semibold"
            :class="c.isToday ? 'bg-brand-600 text-white' : c.inMonth ? 'text-slate-600' : 'text-slate-300'"
          >{{ c.day }}</span>
          <div class="flex flex-col gap-0.5">
            <span
              v-for="t in c.tasks.slice(0, 2)"
              :key="t.id"
              class="flex items-center gap-1 truncate rounded px-1 text-[10px] font-medium"
              :class="c.isPast ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'"
            >
              <span class="h-1 w-1 shrink-0 rounded-full" :class="priorityDot[t.priority]" />
              <span class="truncate">{{ t.title }}</span>
            </span>
            <span v-if="c.tasks.length > 2" class="px-1 text-[10px] font-medium text-slate-400">+{{ c.tasks.length - 2 }} more</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Selected day panel -->
    <div class="space-y-4">
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <p class="text-sm font-semibold text-slate-900">{{ selectedLabel }}</p>
        <p class="text-xs text-slate-400">{{ selectedTasks.length }} task{{ selectedTasks.length === 1 ? '' : 's' }} due</p>

        <div class="mt-3 flex items-center gap-2">
          <input
            v-model="quickTitle"
            type="text"
            placeholder="Add task on this day…"
            class="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            @keyup.enter="addForSelected"
          />
          <AppButton variant="primary" size="sm" @click="addForSelected"><Plus class="h-4 w-4" /></AppButton>
        </div>

        <div v-if="selectedTasks.length" class="mt-3 space-y-2">
          <TaskItem
            v-for="t in selectedTasks"
            :key="t.id"
            :task="t"
            @complete="tasks.complete"
            @reopen="tasks.reopen"
            @remove="tasks.remove"
            @add-outcome="(task) => emit('add-outcome', task)"
            @open="(task) => emit('open', task)"
          />
        </div>
        <p v-else class="mt-3 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-400">Nothing scheduled this day.</p>
      </div>

      <!-- Tasks without a due date -->
      <div v-if="noDate.length" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
        <p class="flex items-center gap-1.5 text-sm font-semibold text-slate-900"><CalendarOff class="h-4 w-4 text-slate-400" /> No date ({{ noDate.length }})</p>
        <div class="mt-3 space-y-2">
          <TaskItem
            v-for="t in noDate"
            :key="t.id"
            :task="t"
            @complete="tasks.complete"
            @reopen="tasks.reopen"
            @remove="tasks.remove"
            @add-outcome="(task) => emit('add-outcome', task)"
            @open="(task) => emit('open', task)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
