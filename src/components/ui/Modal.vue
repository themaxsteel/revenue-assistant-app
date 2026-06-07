<script setup>
import { watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: Boolean,
  title: String,
  size: { type: String, default: 'md' }, // md | lg
})
const emit = defineEmits(['close'])

watch(
  () => props.open,
  (v) => {
    document.body.style.overflow = v ? 'hidden' : ''
  },
)
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
        @click.self="emit('close')"
      >
        <Transition name="modal" appear>
          <div
            v-if="open"
            class="my-8 w-full rounded-2xl bg-white shadow-pop"
            :class="size === 'lg' ? 'max-w-3xl' : 'max-w-lg'"
          >
            <div class="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 class="text-base font-semibold text-slate-900">{{ title }}</h3>
              <button
                class="pressable rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                @click="emit('close')"
              >
                <X class="h-4 w-4" />
              </button>
            </div>
            <div class="px-5 py-4"><slot /></div>
            <div v-if="$slots.footer" class="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Overlay: fade only. Modal: scale from 0.95 (never 0), centered origin. */
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 200ms var(--ease-out);
}
.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
.modal-enter-active {
  transition: transform 220ms var(--ease-out), opacity 220ms var(--ease-out);
}
.modal-leave-active {
  transition: transform 160ms var(--ease-out), opacity 160ms var(--ease-out);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
