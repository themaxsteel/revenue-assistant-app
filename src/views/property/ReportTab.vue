<script setup>
import { ref, computed } from 'vue'
import { Send, Download } from 'lucide-vue-next'
import { buildReport } from '@/mock/reports'
import OwnerReportPreview from '@/components/OwnerReportPreview.vue'
import WhatsAppSendModal from '@/components/WhatsAppSendModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Card from '@/components/ui/Card.vue'

const props = defineProps({ property: Object })
const period = ref('Last 7 days')
const sendOpen = ref(false)
const report = computed(() => buildReport(props.property.id, period.value))
</script>

<template>
  <div class="grid gap-5 lg:grid-cols-[280px_1fr]">
    <Card title="Report options">
      <label class="block text-xs font-medium text-slate-500">Period</label>
      <div class="mt-1 flex gap-1 rounded-xl border border-slate-200 bg-white p-0.5 text-xs">
        <button
          v-for="opt in ['Last 7 days','Last 30 days']"
          :key="opt"
          class="pressable flex-1 rounded-lg px-2 py-1.5 font-medium transition-colors duration-150 ease-out"
          :class="period === opt ? 'bg-brand-50 text-brand-700' : 'text-slate-500'"
          @click="period = opt"
        >{{ opt }}</button>
      </div>
      <div class="mt-4 flex flex-col gap-2">
        <AppButton variant="success" block @click="sendOpen = true"><Send class="h-4 w-4" /> Send via WhatsApp</AppButton>
        <AppButton variant="secondary" block><Download class="h-4 w-4" /> Download PDF</AppButton>
      </div>
      <p class="mt-3 text-xs text-slate-400">Sends to {{ property.ownerName }} ({{ property.ownerPhone }}).</p>
    </Card>

    <Card title="Preview">
      <OwnerReportPreview :report="report" />
    </Card>

    <WhatsAppSendModal :open="sendOpen" :report="report" @close="sendOpen = false" />
  </div>
</template>
