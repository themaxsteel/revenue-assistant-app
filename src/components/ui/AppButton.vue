<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: { type: String, default: 'primary' }, // primary | secondary | ghost | danger | success
  size: { type: String, default: 'md' }, // sm | md
  block: Boolean,
})

const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm',
  secondary: 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
  ghost: 'text-slate-600 hover:bg-slate-100',
  danger: 'bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
}
const sizes = { sm: 'text-xs px-2.5 py-1.5 gap-1.5', md: 'text-sm px-3.5 py-2 gap-2' }

const cls = computed(() => [
  'pressable inline-flex items-center justify-center rounded-xl font-medium transition-colors duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 disabled:opacity-50 disabled:pointer-events-none',
  variants[props.variant],
  sizes[props.size],
  props.block ? 'w-full' : '',
])
</script>

<template>
  <button :class="cls">
    <slot />
  </button>
</template>
