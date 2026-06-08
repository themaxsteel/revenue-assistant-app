<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { Activity, ArrowRight, Sparkles } from 'lucide-vue-next'
import { useMonitorStore } from '@/stores/monitor'
import MonitorCard from '@/components/MonitorCard.vue'
import Card from '@/components/ui/Card.vue'
import AppButton from '@/components/ui/AppButton.vue'

const props = defineProps({ property: Object })
const monitor = useMonitorStore()

const all = computed(() => monitor.forProperty(props.property.id))
const needsDecision = computed(() => all.value.filter((a) => a.status === 'ended'))
const active = computed(() => all.value.filter((a) => a.status === 'active'))
const decided = computed(() => all.value.filter((a) => a.status === 'decided' || a.status === 'scheduled'))
</script>

<template>
  <div class="space-y-5">
    <div v-if="!all.length" class="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
      <Activity class="mx-auto h-8 w-8 text-slate-300" />
      <p class="mt-2 text-sm font-medium text-slate-600">No actions being monitored yet.</p>
      <p class="mx-auto mt-1 max-w-sm text-xs text-slate-400">
        When you approve a recommendation, the Revenue Assistant starts tracking its impact here —
        baseline vs target, day by day, until it lands on a keep/stop decision.
      </p>
      <RouterLink :to="`/property/${property.id}/agent`">
        <AppButton variant="primary" size="sm" class="mt-4">
          <Sparkles class="h-3.5 w-3.5" /> Go to recommendations
        </AppButton>
      </RouterLink>
    </div>

    <template v-else>
      <!-- Needs decision -->
      <section v-if="needsDecision.length">
        <div class="mb-2 flex items-center gap-2">
          <h2 class="text-sm font-semibold text-amber-700">Needs a decision</h2>
          <span class="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">{{ needsDecision.length }}</span>
        </div>
        <div class="grid gap-3 lg:grid-cols-2">
          <MonitorCard v-for="a in needsDecision" :key="a.id" :action="a" />
        </div>
      </section>

      <!-- Active -->
      <section v-if="active.length">
        <div class="mb-2 flex items-center gap-2">
          <h2 class="text-sm font-semibold text-slate-900">Monitoring now</h2>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{{ active.length }}</span>
        </div>
        <div class="grid gap-3 lg:grid-cols-2">
          <MonitorCard v-for="a in active" :key="a.id" :action="a" />
        </div>
      </section>

      <!-- Decided -->
      <section v-if="decided.length">
        <div class="mb-2 flex items-center gap-2">
          <h2 class="text-sm font-semibold text-slate-500">Closed</h2>
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{{ decided.length }}</span>
        </div>
        <div class="grid gap-3 lg:grid-cols-2">
          <MonitorCard v-for="a in decided" :key="a.id" :action="a" />
        </div>
      </section>
    </template>
  </div>
</template>
