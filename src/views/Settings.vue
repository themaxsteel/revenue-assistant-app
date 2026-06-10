<script setup>
import { ref } from 'vue'
import { Settings as SettingsIcon, Plug } from 'lucide-vue-next'
import { useAgentStore } from '@/stores/agent'
import { usePortfolioStore } from '@/stores/portfolio'
import { integrations } from '@/mock/guardrails'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'

const agent = useAgentStore()
const portfolio = usePortfolioStore()
const g = agent.guardrails

const statusTone = { connected: 'green', degraded: 'amber', down: 'red' }
const roleTone = { ra: 'brand', admin: 'violet' }
</script>

<template>
  <div>
    <h1 class="flex items-center gap-2 text-xl font-bold text-slate-900"><SettingsIcon class="h-5 w-5 text-brand-600" /> Settings</h1>
    <p class="text-sm text-slate-500">Recommendation limits, integrations and team — the controls behind the Revenue Assistant.</p>

    <div class="mt-4 grid gap-5 lg:grid-cols-2">
      <!-- Recommendation limits -->
      <Card title="Recommendation limits" subtitle="Bounds the AI respects when proposing changes — nothing is applied automatically">
        <dl class="space-y-3 text-sm">
          <div class="flex items-center justify-between">
            <dt class="text-slate-500">Max suggested daily rate change</dt>
            <dd class="font-semibold text-slate-800">±{{ g.maxDailyDeltaPct }}%</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-slate-500">Price floor / ceiling</dt>
            <dd class="font-semibold text-slate-800">{{ g.floorPct }}% – {{ g.ceilingPct }}% of BAR</dd>
          </div>
          <div class="flex items-center justify-between">
            <dt class="text-slate-500">Last-minute lock</dt>
            <dd class="font-semibold text-slate-800">{{ g.lastMinuteLockHrs }}h before arrival</dd>
          </div>
        </dl>
        <p class="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          The Revenue Assistant only prepares suggestions within these limits. You review and apply every change yourself.
        </p>
      </Card>

      <!-- Integrations -->
      <Card title="Integrations" subtitle="The 12 systems the agent reads & writes">
        <template #actions><Plug class="h-4 w-4 text-slate-300" /></template>
        <div class="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          <div v-for="i in integrations" :key="i.key" class="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
            <span class="truncate text-sm text-slate-700">{{ i.name }}</span>
            <Badge :tone="statusTone[i.status]" size="sm">{{ i.status }}</Badge>
          </div>
        </div>
        <p class="mt-3 text-xs text-slate-400">Prototype note: statuses are mocked. Production reads live health from each API.</p>
      </Card>
    </div>

    <!-- Team -->
    <Card class="mt-5" title="Team & roles" subtitle="Revenue Assistants and the Lead/Admin who oversees them">
      <div class="divide-y divide-slate-100">
        <div v-for="m in portfolio.team" :key="m.id" class="flex items-center gap-3 py-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">{{ m.avatar }}</div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-slate-800">{{ m.name }}</p>
            <p class="text-xs text-slate-400">{{ m.title }}</p>
          </div>
          <span class="text-xs text-slate-400">{{ m.assignedPropertyIds.length }} properties</span>
          <Badge :tone="roleTone[m.role]" size="sm">{{ m.role === 'ra' ? 'Revenue Assistant' : 'Lead / Admin' }}</Badge>
        </div>
      </div>
    </Card>
  </div>
</template>
