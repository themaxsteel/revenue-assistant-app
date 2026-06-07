<script setup>
import { ref } from 'vue'
import { Tag, Plus, Sparkles } from 'lucide-vue-next'
import { promotionsFor } from '@/mock/promotions'
import { useUiStore } from '@/stores/ui'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { idr } from '@/mock/util'

const props = defineProps({ property: Object })
const ui = useUiStore()
const promos = ref(promotionsFor(props.property.id))
const statusTone = { active: 'green', suggested: 'brand', draft: 'slate' }

function activate(p) {
  p.status = 'active'
  ui.toast(`Promo “${p.name}” launched on ${p.channel}`)
}
</script>

<template>
  <Card title="Promotions & campaigns" subtitle="Active offers and AI-suggested campaigns">
    <template #actions><AppButton variant="secondary" size="sm"><Plus class="h-3.5 w-3.5" /> New promo</AppButton></template>
    <div class="space-y-2.5">
      <div v-for="p in promos" :key="p.id" class="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-3.5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg" :class="p.status === 'suggested' ? 'bg-brand-50 text-brand-600' : 'bg-slate-100 text-slate-500'">
          <Sparkles v-if="p.status === 'suggested'" class="h-4.5 w-4.5" />
          <Tag v-else class="h-4.5 w-4.5" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-sm font-semibold text-slate-800">{{ p.name }}</p>
            <Badge :tone="statusTone[p.status]" size="sm">{{ p.status }}</Badge>
          </div>
          <p class="text-xs text-slate-400">{{ p.type }} · {{ p.discount }}% off · {{ p.channel }}</p>
        </div>
        <div v-if="p.status === 'active'" class="text-right">
          <p class="text-sm font-semibold text-emerald-600">{{ idr(p.revenue, { compact: true }) }}</p>
          <p class="text-[11px] text-slate-400">{{ p.redemptions }} redemptions</p>
        </div>
        <AppButton v-else-if="p.status === 'suggested'" variant="primary" size="sm" @click="activate(p)">Launch</AppButton>
      </div>
    </div>
  </Card>
</template>
