<script setup>
const props = defineProps({
  modelValue: Boolean,
  tone: { type: String, default: 'brand' }, // brand | red
})
const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    @click="emit('update:modelValue', !modelValue)"
    class="pressable relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
    :class="modelValue ? (tone === 'red' ? 'bg-rose-500' : 'bg-brand-600') : 'bg-slate-200'"
  >
    <span
      class="inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ease-out"
      :class="modelValue ? 'translate-x-5' : 'translate-x-0.5'"
    />
  </button>
</template>
