<script setup>
import { computed, ref } from 'vue'
import { Hand, Lightbulb, Zap, ShieldAlert } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAgentStore } from '@/stores/agent'
import { useUiStore } from '@/stores/ui'
import Modal from './ui/Modal.vue'
import AppButton from './ui/AppButton.vue'

const props = defineProps({
  propertyId: { type: String, required: true },
  size: { type: String, default: 'md' },
})
const portfolio = usePortfolioStore()
const agent = useAgentStore()
const ui = useUiStore()

const modes = [
  { key: 'manual', label: 'Manual', icon: Hand },
  { key: 'suggest', label: 'Suggest', icon: Lightbulb },
  { key: 'auto', label: 'Auto', icon: Zap },
]
const current = computed(() => portfolio.byId(props.propertyId)?.autonomyMode)
const confirmOpen = ref(false)
const autoEligibleCount = computed(
  () => agent.forProperty(props.propertyId).filter((r) => r.status === 'pending' && r.risk === 'auto').length,
)

function applyMode(mode) {
  portfolio.setAutonomy(props.propertyId, mode)
  if (mode === 'auto') {
    if (agent.guardrails.killSwitch) {
      ui.toast('Set to Auto, but global kill-switch is ON', 'danger')
    } else {
      agent.runAutoForProperty(props.propertyId)
      ui.toast('Autonomy set to Auto — eligible actions executed')
    }
  } else {
    ui.toast(`Autonomy set to ${mode}`, 'neutral')
  }
}

function set(mode) {
  if (mode === current.value) return
  // Switching to Auto lets the agent execute on its own — confirm first.
  if (mode === 'auto') {
    confirmOpen.value = true
    return
  }
  applyMode(mode)
}
function confirmAuto() {
  confirmOpen.value = false
  applyMode('auto')
}
</script>

<template>
  <div
    class="inline-flex items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-0.5"
    :class="size === 'sm' ? 'text-[11px]' : 'text-xs'"
  >
    <button
      v-for="m in modes"
      :key="m.key"
      class="pressable inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors duration-150 ease-out"
      :class="
        current === m.key
          ? m.key === 'auto'
            ? 'bg-white text-brand-700 shadow-sm'
            : 'bg-white text-slate-800 shadow-sm'
          : 'text-slate-500 hover:text-slate-700'
      "
      @click="set(m.key)"
    >
      <component :is="m.icon" class="h-3.5 w-3.5" />
      {{ m.label }}
    </button>
  </div>

  <Modal :open="confirmOpen" title="Switch to Auto-pilot?" @close="confirmOpen = false">
    <div class="flex items-start gap-3">
      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600"><ShieldAlert class="h-5 w-5" /></div>
      <div class="text-sm text-slate-600">
        <p>In <strong>Auto</strong>, the AI Agent will execute low-risk, reversible actions on this property
        by itself (within your guardrails) without waiting for approval.</p>
        <p class="mt-2">{{ autoEligibleCount }} auto-eligible action(s) will run immediately. You can switch back anytime,
        and the global kill-switch always overrides.</p>
      </div>
    </div>
    <template #footer>
      <AppButton variant="ghost" size="sm" @click="confirmOpen = false">Cancel</AppButton>
      <AppButton variant="primary" size="sm" @click="confirmAuto"><Zap class="h-3.5 w-3.5" /> Enable Auto</AppButton>
    </template>
  </Modal>
</template>
