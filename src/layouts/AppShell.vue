<script setup>
import { computed, onMounted, watch } from 'vue'
import { RouterView, RouterLink, useRoute, useRouter } from 'vue-router'
import { Sparkles } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAgentStore } from '@/stores/agent'
import { useTasksStore } from '@/stores/tasks'
import { useMonitorStore } from '@/stores/monitor'
import { useReputationStore } from '@/stores/reputation'
import { useUiStore } from '@/stores/ui'
import { useChatStore } from '@/stores/chat'
import Badge from '@/components/ui/Badge.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import ToastHost from '@/components/ui/ToastHost.vue'
import ChatWidget from '@/components/ChatWidget.vue'
import logoUrl from '@/assets/ratepilot-logo.png'

const portfolio = usePortfolioStore()
const agent = useAgentStore()
const tasks = useTasksStore()
const monitor = useMonitorStore()
const reputation = useReputationStore()
const ui = useUiStore()
const chat = useChatStore()
const route = useRoute()
const router = useRouter()

// Opening the AI drawer auto-collapses the left rail to reclaim width;
// closing it restores whatever the RA had before.
let preChatCollapsed = false
watch(
  () => chat.open,
  (open) => {
    if (open) {
      preChatCollapsed = ui.sidebarCollapsed
      ui.sidebarCollapsed = true
    } else {
      ui.sidebarCollapsed = preChatCollapsed
    }
  },
)

const nav = computed(() => [
  { to: '/portfolio', label: 'Portfolio', icon: 'portfolio', badge: portfolio.count },
  {
    to: '/monitor',
    label: 'Monitoring',
    icon: 'monitor',
    badge: monitor.needsDecision.length || null,
    badgeTone: monitor.needsDecision.length ? 'amber' : null,
  },
  {
    to: '/agent',
    label: 'Smart Suggest',
    lucide: Sparkles,
    badge: agent.pending.length || null,
    badgeTone: agent.pending.length ? 'amber' : null,
  },
  // Surface overdue (red) over plain open count — overdue is what hurts.
  {
    to: '/tasks',
    label: 'Tasks & Activities',
    icon: 'tasks',
    badge: tasks.overdue.length || tasks.open.length || null,
    badgeTone: tasks.overdue.length ? 'red' : null,
  },
  { to: '/social', label: 'Social Media', icon: 'social', badge: null },
  {
    to: '/reputation',
    label: 'Reputation',
    icon: 'star',
    badge: reputation.needsReply.length || null,
    badgeTone: reputation.needsReply.length ? 'amber' : null,
  },
  { to: '/reports', label: 'Owner Reports', icon: 'reports', badge: null },
  // Hidden for now (routes still exist): Analytics, Alerts, Settings
  // { to: '/analytics', label: 'Analytics', icon: 'analytics', badge: null },
  // { to: '/alerts', label: 'Alerts', icon: 'bell', badge: portfolio.unreadAlerts || null, badgeTone: portfolio.unreadAlerts ? 'red' : null },
  // { to: '/settings', label: 'Settings', icon: 'settings', badge: null },
])

// Global search → quick-jump to a property (works from any page).
const searchResults = computed(() => {
  const q = ui.search.trim().toLowerCase()
  if (!q) return []
  return portfolio.properties
    .filter((p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q))
    .slice(0, 6)
})
function gotoProperty(id) {
  ui.search = ''
  router.push(`/property/${id}/overview`)
}

// On load, bring back any snoozed recommendations whose time has elapsed.
onMounted(() => agent.resurfaceSnoozed())
</script>

<template>
  <div class="flex min-h-screen bg-slate-50">
    <!-- Sidebar -->
    <aside
      class="group/aside fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200 bg-white transition-[width] duration-300 ease-drawer"
      :class="ui.sidebarCollapsed ? 'w-[68px]' : 'w-60'"
    >
      <!-- Edge-pill collapse/expand toggle -->
      <button
        class="pressable absolute -right-3 top-7 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 opacity-0 shadow-card transition-all duration-200 ease-out hover:border-brand-200 hover:text-brand-600 focus-visible:opacity-100 group-hover/aside:opacity-100"
        :class="ui.sidebarCollapsed ? 'opacity-100' : ''"
        :title="ui.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="ui.toggleSidebar()"
      >
        <AppIcon :name="ui.sidebarCollapsed ? 'expand' : 'collapse'" :size="15" />
      </button>

      <!-- Brand — click to expand/collapse the sidebar -->
      <button
        class="pressable flex w-full items-center px-4 py-5 text-left"
        :title="ui.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="ui.toggleSidebar()"
      >
        <img :src="logoUrl" alt="RatePilot" class="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm" />
        <div
          class="min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 ease-drawer"
          :class="ui.sidebarCollapsed ? 'ml-0 max-w-0 opacity-0' : 'ml-2.5 max-w-[160px] flex-1 opacity-100'"
        >
          <p class="truncate text-sm font-bold leading-tight text-slate-900">RatePilot</p>
          <p class="text-[11px] text-slate-400">Revenue Assistant</p>
        </div>
      </button>

      <nav class="flex-1 space-y-1 px-3 py-2">
        <RouterLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="pressable group/nav relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ease-out"
          :class="route.path.startsWith(item.to) ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'"
        >
          <span class="relative flex shrink-0 items-center justify-center">
            <component
              :is="item.lucide"
              v-if="item.lucide"
              :size="22"
              :stroke-width="route.path.startsWith(item.to) ? 2 : 1.75"
            />
            <AppIcon v-else :name="item.icon" :size="22" :stroke-width="route.path.startsWith(item.to) ? 2 : 1.75" />
            <!-- collapsed badge dot -->
            <span
              v-if="ui.sidebarCollapsed && item.badge"
              class="absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full ring-2 ring-white"
              :class="item.badgeTone === 'red' ? 'bg-rose-500' : 'bg-brand-500'"
            />
          </span>
          <span
            class="flex min-w-0 items-center gap-2 overflow-hidden whitespace-nowrap transition-all duration-300 ease-drawer"
            :class="ui.sidebarCollapsed ? 'ml-0 max-w-0 opacity-0' : 'ml-3 max-w-[180px] flex-1 opacity-100'"
          >
            <span class="flex-1 truncate">{{ item.label }}</span>
            <Badge v-if="item.badge" :tone="item.badgeTone || (route.path.startsWith(item.to) ? 'brand' : 'slate')" size="sm">
              {{ item.badge }}
            </Badge>
          </span>

          <!-- Tooltip (collapsed only) -->
          <span
            v-if="ui.sidebarCollapsed"
            class="pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-pop transition-all duration-150 ease-out group-hover/nav:opacity-100"
          >
            {{ item.label }}<span v-if="item.badge" class="ml-1 text-slate-400">· {{ item.badge }}</span>
          </span>
        </RouterLink>
      </nav>

      <!-- RA selector -->
      <div class="border-t border-slate-100 p-3">
        <div class="flex items-center rounded-xl px-2.5 py-2">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white shadow-sm">
            {{ portfolio.currentUser.avatar }}
          </div>
          <div
            class="flex min-w-0 items-center overflow-hidden whitespace-nowrap transition-all duration-300 ease-drawer"
            :class="ui.sidebarCollapsed ? 'ml-0 max-w-0 opacity-0' : 'ml-2.5 max-w-[180px] flex-1 opacity-100'"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-slate-800">{{ portfolio.currentUser.name }}</p>
              <p class="text-[11px] text-slate-400">{{ portfolio.currentUser.title }}</p>
            </div>
            <AppIcon name="chevron-down" :size="16" class="shrink-0 text-slate-300" />
          </div>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div
      class="flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-300 ease-drawer"
      :class="[ui.sidebarCollapsed ? 'pl-[68px]' : 'pl-60', chat.open ? 'lg:pr-[440px]' : '']"
    >
      <header class="sticky top-0 z-20 flex items-center gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-3 backdrop-blur">
        <div class="relative flex-1 max-w-md">
          <AppIcon name="search" :size="17" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="ui.search"
            type="text"
            placeholder="Search properties…"
            class="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
          <!-- Quick-jump results (works from any page) -->
          <div v-if="searchResults.length" class="absolute left-0 right-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop">
            <button
              v-for="p in searchResults"
              :key="p.id"
              class="pressable flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50"
              @click="gotoProperty(p.id)"
            >
              <Building2 class="h-3.5 w-3.5 text-slate-400" />
              <span class="flex-1 truncate font-medium text-slate-700">{{ p.name }}</span>
              <span class="truncate text-xs text-slate-400">{{ p.city }}</span>
            </button>
          </div>
          <div v-else-if="ui.search.trim()" class="absolute left-0 right-0 top-full z-30 mt-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-400 shadow-pop">
            No properties match “{{ ui.search }}”.
          </div>
        </div>
        <div class="ml-auto flex items-center gap-2 text-sm">
          <!-- AI Assistant toggle -->
          <button
            class="pressable relative inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2 font-medium transition-colors duration-150 ease-out"
            :class="chat.open ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'"
            :title="chat.open ? 'Close AI assistant' : 'Ask the AI assistant'"
            @click="chat.toggle()"
          >
            <AppIcon name="agent" :size="17" />
            <span class="hidden sm:inline">Ask AI</span>
            <span v-if="!chat.open && chat.unread" class="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
              {{ chat.unread }}
            </span>
          </button>
        </div>
      </header>

      <main class="flex-1 px-6 py-6">
        <RouterView v-slot="{ Component, route: r }">
          <Transition name="page">
            <component :is="Component" :key="r.name || 'prop-' + r.params.id" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <ToastHost />
    <ChatWidget />
  </div>
</template>

<style scoped>
.page-enter-active {
  transition: opacity 200ms var(--ease-out), transform 200ms var(--ease-out);
}
.page-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
</style>
