<script setup>
import { ref } from 'vue'
import { Sparkles, Plus } from 'lucide-vue-next'
import { upsellFor } from '@/mock/upsell'
import { useUiStore } from '@/stores/ui'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import ProgressBar from '@/components/ui/ProgressBar.vue'
import { idr } from '@/mock/util'

const props = defineProps({ property: Object })
const ui = useUiStore()
const items = ref(upsellFor(props.property.id))

function enable(it) {
  it.suggested = false
  it.attachRate = 5
  ui.toast(`“${it.name}” upsell enabled`)
}
</script>

<template>
  <Card title="Upselling" subtitle="Attach rates and AI-suggested add-ons">
    <template #actions><AppButton variant="secondary" size="sm"><Plus class="h-3.5 w-3.5" /> New offer</AppButton></template>
    <div class="space-y-3">
      <div v-for="it in items" :key="it.id" class="flex flex-wrap items-center gap-3">
        <div class="w-44 shrink-0">
          <div class="flex items-center gap-1.5">
            <p class="text-sm font-medium text-slate-700">{{ it.name }}</p>
            <Badge v-if="it.suggested" tone="brand" size="sm"><Sparkles class="h-3 w-3" /> Suggested</Badge>
          </div>
          <p class="text-xs text-slate-400">{{ idr(it.price, { compact: true }) }}</p>
        </div>
        <template v-if="!it.suggested">
          <div class="flex-1 min-w-[120px]">
            <div class="mb-0.5 flex justify-between text-[11px] text-slate-400"><span>Attach rate</span><span>{{ it.attachRate }}%</span></div>
            <ProgressBar :value="it.attachRate" tone="green" />
          </div>
          <span class="w-24 text-right text-sm font-semibold text-slate-700">{{ idr(it.revenue, { compact: true }) }}</span>
        </template>
        <template v-else>
          <p class="flex-1 text-xs text-slate-400">AI predicts strong uptake for this property type.</p>
          <AppButton variant="primary" size="sm" @click="enable(it)">Enable</AppButton>
        </template>
      </div>
    </div>
  </Card>
</template>
