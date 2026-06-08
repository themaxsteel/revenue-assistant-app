<script setup>
import { reactive, ref, watch, computed } from 'vue'
import dayjs from 'dayjs'
import { User, Link2, Sparkles, Bell, Trash2, Check, RotateCcw, Activity, ArrowLeft } from 'lucide-vue-next'
import { useTasksStore } from '@/stores/tasks'
import { usePortfolioStore } from '@/stores/portfolio'
import { useMonitorStore } from '@/stores/monitor'
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
const monitor = useMonitorStore()

// Modal has two views: task details and the "start monitoring" form.
const view = ref('details')
const mon = reactive({
  channel: 'Booking.com',
  type: 'promo',
  discountPct: 15,
  windowDays: 7,
  targetMetric: 'occupancy',
  targetGoal: 12,
})

const recId = computed(() => (props.task?.link?.type === 'recommendation' ? props.task.link.id : null))
const existingMonitor = computed(() =>
  props.task ? monitor.forTask(props.task.id, recId.value) : null,
)
const canMonitor = computed(() => !!draft.propertyId && !existingMonitor.value)

// Smart defaults: infer discount % from the title if present (e.g. "−15%").
function openMonitorForm() {
  const m = props.task?.title?.match(/(\d{1,2})\s*%/)
  if (m) mon.discountPct = Number(m[1])
  const t = (props.task?.title || '').toLowerCase()
  if (t.includes('reopen') || t.includes('inventory')) mon.type = 'ota_open'
  else if (t.includes('increase') || t.includes('raise') || t.includes('+')) mon.type = 'rate_increase'
  else mon.type = 'promo'
  view.value = 'monitor'
}
function startMonitoring() {
  const id = monitor.trackFromTask(props.task, { ...mon, propertyId: draft.propertyId })
  if (!id) return // duplicate / no property — store already toasted
  tasks.complete(props.task.id) // applying the action = task done
  view.value = 'details'
  emit('close')
}

// Editable draft, cloned from the task each time the modal opens.
const draft = reactive({ title: '', note: '', priority: 'medium', dueDate: '', recurring: '', propertyId: '' })

watch(
  () => props.open,
  (v) => {
    if (v && props.task) {
      view.value = 'details'
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
const isDiscountType = computed(() => mon.type === 'promo' || mon.type === 'rate_decrease')
const goalUnit = computed(
  () => ({ occupancy: 'pts occupancy', revpar: '% RevPAR', bookings: 'bookings/day' }[mon.targetMetric]),
)
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
  <Modal :open="open" :title="view === 'monitor' ? 'Start monitoring' : 'Task details'" size="lg" @close="emit('close')">
    <template v-if="task">
      <div v-if="view === 'details'">
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

      <!-- Monitoring entry -->
      <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <div v-if="existingMonitor" class="flex items-center justify-between gap-2">
          <p class="flex items-center gap-1.5 text-xs font-medium text-slate-600">
            <Activity class="h-3.5 w-3.5 text-brand-500" /> This action is being monitored.
          </p>
          <RouterLink
            v-if="linkedProperty"
            :to="`/property/${linkedProperty.id}/monitor`"
            class="pressable text-xs font-medium text-brand-600 hover:text-brand-700"
            @click="emit('close')"
          >Open Monitoring →</RouterLink>
        </div>
        <div v-else class="flex items-center justify-between gap-2">
          <p class="text-xs text-slate-500">Applied this action manually? Track its impact over a window.</p>
          <AppButton variant="secondary" size="sm" :disabled="!canMonitor" title="Start monitoring this action" @click="openMonitorForm">
            <Activity class="h-3.5 w-3.5" /> Monitor this action
          </AppButton>
        </div>
        <p v-if="!draft.propertyId && !existingMonitor" class="mt-1.5 text-[11px] text-slate-400">
          Attach a property first to enable monitoring.
        </p>
      </div>
      </div>

      <!-- Monitor form view -->
      <div v-else class="space-y-4">
        <p class="text-sm text-slate-500">
          Set up tracking for <span class="font-medium text-slate-700">"{{ task.title }}"</span>.
          Baseline is locked from
          <span class="font-medium text-slate-700">{{ linkedProperty?.name }}</span> when you start.
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="text-xs font-medium text-slate-500">Channel</label>
            <select v-model="mon.channel" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none">
              <option>Booking.com</option>
              <option>Agoda</option>
              <option>Direct</option>
              <option>Direct + Booking.com</option>
              <option>All channels</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-500">Action type</label>
            <select v-model="mon.type" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none">
              <option value="promo">Promo / discount</option>
              <option value="rate_increase">Rate increase</option>
              <option value="rate_decrease">Rate decrease</option>
              <option value="ota_open">OTA reopen</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div v-if="isDiscountType">
            <label class="text-xs font-medium text-slate-500">Discount %</label>
            <input v-model.number="mon.discountPct" type="number" min="0" max="90" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-500">Monitoring window (days)</label>
            <input v-model.number="mon.windowDays" type="number" min="1" max="60" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none" />
          </div>
          <div>
            <label class="text-xs font-medium text-slate-500">Target metric</label>
            <select v-model="mon.targetMetric" class="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none">
              <option value="occupancy">Occupancy (pts)</option>
              <option value="revpar">RevPAR (%)</option>
              <option value="bookings">Bookings/day</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-slate-500">Target goal</label>
            <div class="mt-1 flex items-center gap-2">
              <input v-model.number="mon.targetGoal" type="number" min="1" class="w-full rounded-xl border border-slate-200 px-2.5 py-2 text-sm text-slate-600 focus:outline-none" />
              <span class="whitespace-nowrap text-xs text-slate-400">{{ goalUnit }}</span>
            </div>
          </div>
        </div>
        <p class="rounded-xl bg-brand-50/60 px-3 py-2 text-xs text-brand-700">
          Starting will mark this task complete and begin the {{ mon.windowDays }}-day window now.
        </p>
      </div>
    </template>

    <template #footer>
      <template v-if="view === 'monitor'">
        <AppButton variant="ghost" size="sm" class="mr-auto" @click="view = 'details'">
          <ArrowLeft class="h-3.5 w-3.5" /> Back
        </AppButton>
        <AppButton variant="primary" size="sm" @click="startMonitoring">
          <Activity class="h-3.5 w-3.5" /> Start monitoring
        </AppButton>
      </template>
      <template v-else>
        <AppButton variant="danger" size="sm" class="mr-auto" @click="remove"><Trash2 class="h-3.5 w-3.5" /> Delete</AppButton>
        <AppButton :variant="done ? 'secondary' : 'success'" size="sm" @click="toggleDone">
          <component :is="done ? RotateCcw : Check" class="h-3.5 w-3.5" /> {{ done ? 'Reopen' : 'Complete' }}
        </AppButton>
        <AppButton variant="primary" size="sm" @click="save">Save changes</AppButton>
      </template>
    </template>
  </Modal>
</template>
