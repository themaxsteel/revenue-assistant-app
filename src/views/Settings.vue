<script setup>
import { ref } from 'vue'
import { Settings as SettingsIcon, Power, Plug, Users, ShieldAlert } from 'lucide-vue-next'
import { useAgentStore } from '@/stores/agent'
import { usePortfolioStore } from '@/stores/portfolio'
import { integrations } from '@/mock/guardrails'
import Card from '@/components/ui/Card.vue'
import Toggle from '@/components/ui/Toggle.vue'
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
    <p class="text-sm text-slate-500">Guardrails, integrations and team — the admin controls behind the AI Agent.</p>

    <div class="mt-4 grid gap-5 lg:grid-cols-2">
      <!-- Guardrails -->
      <Card title="AI Agent guardrails" subtitle="Limits the agent must respect in Auto mode">
        <div class="flex items-center justify-between rounded-xl p-3" :class="g.killSwitch ? 'bg-rose-50' : 'bg-slate-50'">
          <div class="flex items-center gap-2.5">
            <Power class="h-5 w-5" :class="g.killSwitch ? 'text-rose-500' : 'text-emerald-500'" />
            <div>
              <p class="text-sm font-semibold text-slate-800">Global kill-switch</p>
              <p class="text-xs text-slate-400">{{ g.killSwitch ? 'Auto-execution is PAUSED' : 'Agent is active' }}</p>
            </div>
          </div>
          <Toggle :model-value="g.killSwitch" tone="red" @update:model-value="agent.toggleKillSwitch()" />
        </div>

        <dl class="mt-4 space-y-3 text-sm">
          <div class="flex items-center justify-between">
            <dt class="text-slate-500">Max daily rate change</dt>
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
          <div class="flex items-center justify-between">
            <dt class="text-slate-500">Agent operating hours</dt>
            <dd class="font-semibold text-slate-800">{{ g.agentHours }}</dd>
          </div>
        </dl>

        <div class="mt-4 flex gap-2">
          <div class="flex-1 rounded-xl bg-brand-50 p-3 text-center">
            <p class="text-lg font-bold text-brand-700">{{ g.autoActionsToday }}</p>
            <p class="text-xs text-slate-500">auto-actions today</p>
          </div>
          <div class="flex-1 rounded-xl bg-amber-50 p-3 text-center">
            <p class="text-lg font-bold text-amber-700">{{ g.blockedByGuardrailToday }}</p>
            <p class="text-xs text-slate-500">blocked by guardrails</p>
          </div>
        </div>
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
