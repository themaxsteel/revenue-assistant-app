<script setup>
import { ref, computed, reactive } from 'vue'
import dayjs from 'dayjs'
import { ListTodo, Plus, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks'
import TaskItem from '@/components/TaskItem.vue'
import TaskDetailModal from '@/components/TaskDetailModal.vue'
import Card from '@/components/ui/Card.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Modal from '@/components/ui/Modal.vue'

const props = defineProps({ property: { type: Object, required: true } })
const tasks = useTasksStore()

const all = computed(() => tasks.forProperty(props.property.id))
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
  tasks.addTask({
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
</script>

<template>
  <div class="space-y-4">
    <!-- Stats row -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-card">
        <ListTodo class="h-4 w-4 text-brand-600" />
        <span class="text-sm font-semibold text-slate-700">{{ open.length + overdue.length }}</span>
        <span class="text-sm text-slate-400">open</span>
      </div>
      <div
        v-if="overdue.length"
        class="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5"
      >
        <AlertTriangle class="h-4 w-4 text-rose-500" />
        <span class="text-sm font-semibold text-rose-700">{{ overdue.length }}</span>
        <span class="text-sm text-rose-500">overdue</span>
      </div>
      <div class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-card">
        <CheckCircle2 class="h-4 w-4 text-emerald-500" />
        <span class="text-sm font-semibold text-slate-700">{{ done.length }}</span>
        <span class="text-sm text-slate-400">completed</span>
      </div>
    </div>

    <!-- Quick add -->
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

    <!-- Overdue -->
    <Card v-if="overdue.length">
      <template #default>
        <div class="mb-3 flex items-center gap-2">
          <AlertTriangle class="h-4 w-4 text-rose-500" />
          <h2 class="text-sm font-semibold text-rose-700">Overdue ({{ overdue.length }})</h2>
        </div>
        <div class="space-y-2">
          <TaskItem
            v-for="t in overdue"
            :key="t.id"
            :task="t"
            @complete="tasks.complete"
            @reopen="tasks.reopen"
            @remove="tasks.remove"
            @add-outcome="openOutcome"
            @open="openDetail"
          />
        </div>
      </template>
    </Card>

    <!-- Open tasks -->
    <Card>
      <template #default>
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
            @complete="tasks.complete"
            @reopen="tasks.reopen"
            @remove="tasks.remove"
            @add-outcome="openOutcome"
            @open="openDetail"
          />
        </div>
        <div v-else class="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
          <CheckCircle2 class="h-4 w-4 text-emerald-500" />
          No open tasks{{ done.length ? ` · ${done.length} completed` : '' }}.
        </div>
      </template>
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
              @complete="tasks.complete"
              @reopen="tasks.reopen"
              @remove="tasks.remove"
              @add-outcome="openOutcome"
              @open="openDetail"
            />
          </div>
        </Card>
      </Transition>
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
