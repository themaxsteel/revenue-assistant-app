<script setup>
import { reactive, watch, computed } from 'vue'
import dayjs from 'dayjs'
import { Building2, User, Link2, Sparkles, Bell, Trash2, Check, RotateCcw } from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks'
import { usePortfolioStore } from '@/stores/portfolio'
import Modal from './ui/Modal.vue'
import AppButton from './ui/AppButton.vue'
import Badge from './ui/Badge.vue'

const props = defineProps({
  open: Boolean,
  task: Object,
})
const emit = defineEmits(['close'])
const tasks = useTasksStore()
const portfolio = usePortfolioStore()

// Editable draft, cloned from the task each time the modal opens.
const draft = reactive({ title: '', note: '', priority: 'medium', dueDate: '', recurring: '', propertyId: '' })

watch(
  () => props.open,
  (v) => {
    if (v && props.task) {
      draft.title = props.task.title
      draft.note = props.task.note || ''
      draft.priority = props.task.priority
      draft.dueDate = props.task.dueAt ? dayjs(props.task.dueAt).format('YYYY-MM-DD') : ''
      draft.recurring = props.task.recurring || ''
      draft.propertyId = props.task.propertyId || ''
    }
  },
)

const done = computed(() => props.task?.status === 'done')
const linkedProperty = computed(() => (draft.propertyId ? portfolio.byId(draft.propertyId) : null))
const sourceTab = computed(() => (props.task?.link?.type === 'alert' ? 'overview' : 'agent'))

function save() {
  const prop = draft.propertyId ? portfolio.byId(draft.propertyId) : null
  tasks.updateTask(props.task.id, {
    title: draft.title.trim() || props.task.title,
    note: draft.note,
    priority: draft.priority,
    dueAt: draft.dueDate ? dayjs(draft.dueDate).toISOString() : null,
    recurring: draft.recurring || null,
    propertyId: draft.propertyId || null,
    ownerName: prop?.ownerName || null,
  })
  emit('close')
}
function toggleDone() {
  if (done.value) tasks.reopen(props.task.id)
  else tasks.complete(props.task.id)
  emit('close')
}
function remove() {
  tasks.remove(props.task.id)
  emit('close')
}
</script>

<template>
  <Modal :open="open" title="Task details" size="lg" @close="emit('close')">
    <template v-if="task">
      <div class="grid gap-5 sm:grid-cols-[1fr_220px]">
        <!-- Editable fields -->
        <div class="space-y-3">
          <div>
            <label class="text-xs font-medium text-slate-500">Title</label>
            <input v-model="draft.title" type="text" class="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-500">Description</label>
            <textarea v-model="draft.note" rows="5" placeholder="Add context, steps, what the owner said, links…" class="mt-1 w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100" />
          </div>

          <!-- Linked context -->
          <div v-if="task.link" class="rounded-xl border border-violet-100 bg-violet-50/60 p-3">
            <p class="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
              <component :is="task.link.type === 'alert' ? Bell : Sparkles" class="h-3.5 w-3.5" />
              From {{ task.link.type === 'alert' ? 'an alert' : 'an AI recommendation' }}
            </p>
            <p class="mt-1 text-xs text-slate-500">{{ task.link.label }}</p>
            <RouterLink
              v-if="linkedProperty"
              :to="`/property/${linkedProperty.id}/${sourceTab}`"
              class="pressable mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              @click="emit('close')"
            >
              <Link2 class="h-3 w-3" /> Open source on {{ linkedProperty.name }}
            </RouterLink>
          </div>
        </div>

        <!-- Meta editor -->
        <div class="space-y-3">
          <div>
            <label class="text-xs font-medium text-slate-500">Property</label>
            <select v-model="draft.propertyId" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none">
              <option value="">No property</option>
              <option v-for="p in portfolio.properties" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <p v-if="linkedProperty" class="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><User class="h-3 w-3" /> Owner {{ linkedProperty.ownerName }}</p>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-500">Priority</label>
            <select v-model="draft.priority" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-500">Due date</label>
            <input v-model="draft.dueDate" type="date" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-500">Recurring</label>
            <select v-model="draft.recurring" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none">
              <option value="">One-off</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div v-if="done && task.outcome" class="rounded-xl bg-emerald-50 p-2.5 text-xs text-slate-600">
            ✓ {{ task.outcome.note }}
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <AppButton variant="danger" size="sm" class="mr-auto" @click="remove"><Trash2 class="h-3.5 w-3.5" /> Delete</AppButton>
      <AppButton :variant="done ? 'secondary' : 'success'" size="sm" @click="toggleDone">
        <component :is="done ? RotateCcw : Check" class="h-3.5 w-3.5" /> {{ done ? 'Reopen' : 'Complete' }}
      </AppButton>
      <AppButton variant="primary" size="sm" @click="save">Save changes</AppButton>
    </template>
  </Modal>
</template>
