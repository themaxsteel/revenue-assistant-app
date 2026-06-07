<script setup>
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { Check, Building2, User, Link2, Repeat, Calendar, Plus, RotateCcw, X } from 'lucide-vue-next'
import Badge from './ui/Badge.vue'
import { taskPropertyName } from '@/mock/tasks'
import { idr } from '@/mock/util'

const props = defineProps({ task: { type: Object, required: true } })
const emit = defineEmits(['complete', 'reopen', 'remove', 'add-outcome', 'open'])

const done = computed(() => props.task.status === 'done')

// Brief "completing" beat: show the check + strikethrough, then emit so the
// removal isn't instant — gives the eye time and pairs with the Undo toast.
const completing = ref(false)
function onCheck() {
  if (done.value) {
    emit('reopen', props.task.id)
    return
  }
  if (completing.value) return
  completing.value = true
  setTimeout(() => emit('complete', props.task.id), 340)
}
const propName = computed(() => taskPropertyName(props.task.propertyId))

const priorityDot = { high: 'bg-rose-500', medium: 'bg-amber-500', low: 'bg-slate-300' }

const due = computed(() => {
  if (!props.task.dueAt) return null
  const d = dayjs(props.task.dueAt)
  const overdue = !done.value && d.isBefore(dayjs(), 'day')
  const today = d.isSame(dayjs(), 'day')
  return {
    label: today ? 'Today' : d.fromNow(),
    text: d.format('DD MMM'),
    overdue,
    today,
  }
})
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-card transition-opacity duration-300"
    :class="done ? 'border-slate-100 opacity-70' : 'border-slate-200'"
  >
    <!-- Complete toggle: quiet at rest, satisfying on press, reversible via Undo toast -->
    <button
      class="check-btn mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-150 ease-out"
      :class="done || completing ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'"
      :aria-label="done ? 'Reopen task' : 'Complete task'"
      @click="onCheck"
    >
      <Check v-if="done || completing" class="check-mark h-3 w-3" />
    </button>

    <div class="min-w-0 flex-1">
      <button class="group/title flex items-start gap-2 text-left" @click="emit('open', task)">
        <span class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" :class="priorityDot[task.priority]" />
        <p
          class="text-sm font-medium transition-colors duration-200 ease-out group-hover/title:text-brand-700"
          :class="done || completing ? 'text-slate-400 line-through' : 'text-slate-800'"
        >{{ task.title }}</p>
      </button>
      <p v-if="task.note && !done" class="ml-3.5 mt-0.5 line-clamp-1 text-xs text-slate-400">{{ task.note }}</p>

      <!-- Meta badges -->
      <div class="ml-3.5 mt-2 flex flex-wrap items-center gap-1.5">
        <Badge v-if="propName" tone="brand" size="sm"><Building2 class="h-3 w-3" />{{ propName }}</Badge>
        <Badge v-if="task.ownerName" tone="slate" size="sm"><User class="h-3 w-3" />{{ task.ownerName }}</Badge>
        <Badge v-if="task.link" tone="violet" size="sm"><Link2 class="h-3 w-3" />{{ task.link.label }}</Badge>
        <Badge v-if="task.recurring" tone="green" size="sm"><Repeat class="h-3 w-3" />{{ task.recurring }}</Badge>
        <span v-if="due" class="inline-flex items-center gap-1 text-[11px] font-medium" :class="due.overdue ? 'text-rose-600' : due.today ? 'text-amber-600' : 'text-slate-400'">
          <Calendar class="h-3 w-3" />{{ due.overdue ? 'Overdue · ' : '' }}{{ due.text }}
        </span>
      </div>

      <!-- Outcome (done) -->
      <div v-if="done" class="ml-3.5 mt-2">
        <div v-if="task.outcome" class="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs text-slate-600">
          ✓ {{ task.outcome.note }}
          <span v-if="task.outcome.impact" class="font-semibold text-emerald-700"> · +{{ idr(task.outcome.impact, { compact: true }) }}</span>
        </div>
        <button v-else class="pressable text-xs font-medium text-brand-600 hover:text-brand-700" @click="emit('add-outcome', task)">
          <Plus class="inline h-3 w-3" /> Add outcome
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex shrink-0 items-center gap-1">
      <button v-if="done" class="pressable rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" title="Reopen" @click="emit('reopen', task.id)">
        <RotateCcw class="h-3.5 w-3.5" />
      </button>
      <button class="pressable rounded-lg p-1.5 text-slate-300 hover:bg-rose-50 hover:text-rose-500" title="Remove" @click="emit('remove', task.id)">
        <X class="h-3.5 w-3.5" />
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Quiet at rest; clear press feedback so a tap feels heard, not accidental. */
.check-btn {
  transition: transform 140ms var(--ease-out), background-color 150ms var(--ease-out), border-color 150ms var(--ease-out);
}
.check-btn:active {
  transform: scale(0.9);
}
/* Hover affordance only where a real pointer exists (no false-positives on touch). */
@media (hover: hover) and (pointer: fine) {
  .check-btn:hover {
    border-color: #34d399;
    box-shadow: 0 0 0 3px rgb(16 185 129 / 0.12);
  }
}
/* Check draws in (scale from 0.6, never 0) when completing. */
.check-mark {
  animation: check-pop 180ms var(--ease-out) both;
}
@keyframes check-pop {
  from {
    opacity: 0;
    transform: scale(0.6);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@media (prefers-reduced-motion: reduce) {
  .check-mark {
    animation: none;
  }
}
</style>

