<script setup>
defineProps({
  title: String,
  subtitle: String,
  padding: { type: String, default: 'p-5' },
})
</script>

<template>
  <section class="rounded-2xl border border-slate-200 bg-white shadow-card">
    <header
      v-if="title || $slots.actions"
      class="flex items-center justify-between border-b border-slate-100 px-5 py-3.5"
    >
      <div>
        <h2 class="text-sm font-semibold text-slate-900">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-slate-400">{{ subtitle }}</p>
      </div>
      <div class="flex items-center gap-2"><slot name="actions" /></div>
    </header>
    <div :class="padding"><slot /></div>
  </section>
</template>
