<script setup>
// Small OTA/channel logo so the RA recognises the platform at a glance.
// `src` is the resolved logo asset (or null). Falls back to the RatePilot mark
// for "Direct" and to an initial chip for anything without a logo.
import AppIcon from './ui/AppIcon.vue'

defineProps({
  src: { type: String, default: null },
  name: { type: String, default: '' },
  size: { type: Number, default: 20 },
})
</script>

<template>
  <img
    v-if="src"
    :src="src"
    :alt="name"
    class="shrink-0 rounded-md border border-slate-100 bg-white object-contain"
    :style="{ width: size + 'px', height: size + 'px' }"
  />
  <span
    v-else-if="name === 'Direct'"
    class="flex shrink-0 items-center justify-center rounded-md bg-brand-600 text-white"
    :style="{ width: size + 'px', height: size + 'px' }"
  >
    <AppIcon name="logo" :size="Math.round(size * 0.62)" />
  </span>
  <span
    v-else
    class="flex shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-bold text-slate-500"
    :style="{ width: size + 'px', height: size + 'px' }"
  >{{ name?.[0] }}</span>
</template>
