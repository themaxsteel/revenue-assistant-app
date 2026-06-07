<script setup>
import { ref, computed, reactive } from 'vue'
import { ListTodo, Plus, ArrowRight, CheckCircle2 } from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks'
import TaskItem from './TaskItem.vue'
import TaskDetailModal from './TaskDetailModal.vue'
import Card from './ui/Card.vue'
import AppButton from './ui/AppButton.vue'
import Modal from './ui/Modal.vue'

const props = defineProps({ property: { type: Object, required: true } })
const tasks = useTasksStore()

const all = computed(() => tasks.forProperty(props.property.id))
const open = computed(() => all.value.filter((t) => t.status === 'todo'))
const doneCount = computed(() => all.value.filter((t) => t.status === 'done').length)

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

// Task detail modal
const detail = reactive({ open: false, task: null })
function openDetail(task) {
  detail.task = task
  detail.open = true
}

// Outcome modal (same pattern as the Tasks page)
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
  <Card>
    <template #default>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <ListTodo class="h-4 w-4 text-brand-600" /> Tasks for this property
          <span v-if="open.length" class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">{{ open.length }}</span>
        </h2>
        <RouterLink to="/tasks">
          <AppButton variant="ghost" size="sm">All tasks <ArrowRight class="h-3.5 w-3.5" /></AppButton>
        </RouterLink>
      </div>

      <!-- Quick add, pre-linked to this property + owner -->
      <div class="flex items-center gap-2">
        <input
          v-model="title"
          type="text"
          :placeholder="`Add a task for ${property.name}…`"
          class="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          @keyup.enter="add"
        />
        <AppButton variant="primary" size="md" @click="add"><Plus class="h-4 w-4" /> Add</AppButton>
      </div>

      <!-- Open tasks -->
      <div v-if="open.length" class="mt-3 space-y-2">
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
      <div v-else class="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-500">
        <CheckCircle2 class="h-4 w-4 text-emerald-500" />
        No open tasks for this property{{ doneCount ? ` · ${doneCount} completed` : '' }}.
      </div>
    </template>
  </Card>

  <TaskDetailModal :open="detail.open" :task="detail.task" @close="detail.open = false" />

  <Modal :open="outcome.open" title="Log task outcome" @close="outcome.open = false">
    <p class="text-sm text-slate-500">What was the result of “{{ outcome.task?.title }}”?</p>
    <label class="mt-3 block text-xs font-medium text-slate-500">Outcome</label>
    <input v-model="outcome.note" type="text" placeholder="e.g. Owner approved higher weekend rates" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100" />
    <label class="mt-3 block text-xs font-medium text-slate-500">Revenue impact (optional, in million IDR)</label>
    <input v-model="outcome.impact" type="number" placeholder="e.g. 2.5" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100" />
    <template #footer>
      <AppButton variant="ghost" size="sm" @click="outcome.open = false">Cancel</AppButton>
      <AppButton variant="primary" size="sm" @click="saveOutcome">Save outcome</AppButton>
    </template>
  </Modal>
</template>
