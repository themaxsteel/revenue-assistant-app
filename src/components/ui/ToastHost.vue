<script setup>
import { useUiStore } from '@/stores/ui'
import { CheckCircle2, Info, AlertTriangle, X } from 'lucide-vue-next'
const ui = useUiStore()

const META = {
  success: { icon: CheckCircle2, accent: 'border-l-emerald-500', chip: 'bg-emerald-50 text-emerald-600' },
  neutral: { icon: Info, accent: 'border-l-slate-400', chip: 'bg-slate-100 text-slate-500' },
  danger: { icon: AlertTriangle, accent: 'border-l-rose-500', chip: 'bg-rose-50 text-rose-600' },
}
const meta = (type) => META[type] || META.neutral
</script>

<template>
  <div class="pointer-events-none fixed right-5 top-20 z-[80] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2.5">
    <TransitionGroup name="toast">
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        class="pointer-events-auto flex items-start gap-3 rounded-2xl border border-l-4 border-slate-200 bg-white p-3 pr-2.5 shadow-pop"
        :class="meta(t.type).accent"
      >
        <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" :class="meta(t.type).chip">
          <component :is="meta(t.type).icon" class="h-4 w-4" />
        </span>
        <p class="min-w-0 flex-1 py-1 text-sm font-medium leading-snug text-slate-700">{{ t.message }}</p>
        <button
          v-if="t.action"
          class="pressable shrink-0 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors duration-150 hover:bg-brand-700"
          @click="t.action.onClick(); ui.dismissToast(t.id)"
        >
          {{ t.action.label }}
        </button>
        <button
          class="pressable shrink-0 rounded-lg p-1.5 text-slate-300 transition-colors duration-150 hover:bg-slate-100 hover:text-slate-500"
          title="Dismiss"
          @click="ui.dismissToast(t.id)"
        >
          <X class="h-3.5 w-3.5" />
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
  right: 0;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(20px) scale(0.96);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.toast-move {
  transition: transform 280ms var(--ease-out);
}
</style>
