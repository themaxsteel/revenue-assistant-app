<script setup>
import { computed } from 'vue'
import { Bell, CheckCheck, ListPlus, Check } from 'lucide-vue-next'
import dayjs from 'dayjs'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTasksStore } from '@/stores/tasks'
import { useUiStore } from '@/stores/ui'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'

const portfolio = usePortfolioStore()
const tasks = useTasksStore()
const ui = useUiStore()

function resolve(id) {
  portfolio.resolveAlert(id)
  ui.toast('Alert resolved')
}
function pin(a) {
  tasks.addFromAlert(a)
}
const sevTone = { urgent: 'red', watch: 'amber', fyi: 'slate' }
const sorted = computed(() =>
  [...portfolio.alerts].sort((a, b) => (a.time < b.time ? 1 : -1)),
)
const propName = (id) => portfolio.byId(id)?.name
</script>

<template>
  <div>
    <div class="flex items-center justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-xl font-bold text-slate-900"><Bell class="h-5 w-5 text-brand-600" /> Alerts</h1>
        <p class="text-sm text-slate-500">{{ portfolio.unreadAlerts }} unread · parity, demand, pickup & OTA events</p>
      </div>
      <AppButton variant="secondary" size="sm" @click="portfolio.markAlertsRead()"><CheckCheck class="h-4 w-4" /> Mark all read</AppButton>
    </div>

    <div class="mt-4 stagger space-y-2">
      <div
        v-for="(a, i) in sorted"
        :key="a.id"
        class="flex items-start gap-3 rounded-xl border bg-white p-3.5 shadow-card"
        :class="a.read ? 'border-slate-100 opacity-70' : 'border-slate-200'"
        :style="{ '--i': i % 8 }"
      >
        <RouterLink :to="`/property/${a.propertyId}/overview`" class="pressable flex min-w-0 flex-1 items-start gap-3">
          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="a.resolved ? 'bg-slate-300' : a.severity === 'urgent' ? 'bg-rose-500' : a.severity === 'watch' ? 'bg-amber-500' : 'bg-slate-300'" />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <Badge :tone="a.resolved ? 'green' : sevTone[a.severity]" size="sm">{{ a.resolved ? 'Resolved' : a.label }}</Badge>
              <span class="text-xs font-medium text-slate-400">{{ propName(a.propertyId) }}</span>
              <span v-if="!a.read && !a.resolved" class="h-1.5 w-1.5 rounded-full bg-brand-500" />
            </div>
            <p class="mt-1 text-sm" :class="a.resolved ? 'text-slate-400 line-through' : 'text-slate-700'">{{ a.message }}</p>
          </div>
        </RouterLink>
        <div class="flex shrink-0 items-center gap-2">
          <span class="text-xs text-slate-400">{{ dayjs(a.time).fromNow?.() || dayjs(a.time).format('HH:mm') }}</span>
          <button v-if="!a.resolved" class="pressable rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50" title="Resolve" @click="resolve(a.id)">
            <Check class="h-4 w-4" />
          </button>
          <button v-if="!a.resolved" class="pressable rounded-lg p-1.5 text-slate-400 hover:bg-brand-50 hover:text-brand-600" title="Add as task" @click="pin(a)">
            <ListPlus class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
    <p v-if="!sorted.length" class="py-16 text-center text-sm text-slate-400">No alerts. All clear.</p>
  </div>
</template>
