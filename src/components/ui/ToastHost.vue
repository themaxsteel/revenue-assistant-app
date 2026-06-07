<script setup>
import { useUiStore } from '@/stores/ui'
import { CheckCircle2, Info, AlertTriangle } from 'lucide-vue-next'
const ui = useUiStore()
const icons = { success: CheckCircle2, neutral: Info, danger: AlertTriangle }
const tones = {
  success: 'text-emerald-600',
  neutral: 'text-slate-500',
  danger: 'text-rose-600',
}
</script>

<template>
  <div class="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
    <!-- TransitionGroup uses transitions (interruptible), enters from translateY+opacity -->
    <TransitionGroup name="toast">
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        class="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-pop"
      >
        <component :is="icons[t.type]" class="h-4.5 w-4.5 shrink-0" :class="tones[t.type]" />
        <span class="text-sm font-medium text-slate-700">{{ t.message }}</span>
        <button
          v-if="t.action"
          class="pressable ml-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-slate-200"
          @click="t.action.onClick(); ui.dismissToast(t.id)"
        >
          {{ t.action.label }}
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active {
  transition: transform 280ms var(--ease-out), opacity 280ms var(--ease-out);
}
.toast-leave-active {
  transition: transform 200ms var(--ease-out), opacity 200ms var(--ease-out);
  position: absolute;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
.toast-move {
  transition: transform 280ms var(--ease-out);
}
</style>
