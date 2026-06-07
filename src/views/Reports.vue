<script setup>
import { ref, computed } from 'vue'
import { FileText, Send, Download, History, Users } from 'lucide-vue-next'
import { usePortfolioStore } from '@/stores/portfolio'
import { useUiStore } from '@/stores/ui'
import { buildReport, sentReports } from '@/mock/reports'
import OwnerReportPreview from '@/components/OwnerReportPreview.vue'
import WhatsAppSendModal from '@/components/WhatsAppSendModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import Card from '@/components/ui/Card.vue'
import Badge from '@/components/ui/Badge.vue'

const portfolio = usePortfolioStore()
const ui = useUiStore()
const selectedId = ref(portfolio.properties[0].id)
const period = ref('Last 7 days')
const sendOpen = ref(false)
const sendingAll = ref(false)
const history = ref([...sentReports])

const report = computed(() => buildReport(selectedId.value, period.value))
const propName = (id) => portfolio.byId(id)?.name

// Reporting status: who has / hasn't received a report.
const sentPropertyIds = computed(() => new Set(history.value.map((h) => h.propertyId)))
const dueProperties = computed(() => portfolio.properties.filter((p) => !sentPropertyIds.value.has(p.id)))

function onSent() {
  history.value.unshift({
    id: `rep-${Date.now()}`,
    propertyId: selectedId.value,
    period: period.value,
    sentVia: 'WhatsApp',
    sentAt: 'Just now',
  })
}

// Batch: generate + send a report to every owner at once.
function sendAll() {
  sendingAll.value = true
  setTimeout(() => {
    portfolio.properties.forEach((p, i) => {
      history.value.unshift({
        id: `rep-all-${Date.now()}-${i}`,
        propertyId: p.id,
        period: period.value,
        sentVia: 'WhatsApp',
        sentAt: 'Just now',
      })
    })
    sendingAll.value = false
    ui.toast(`${portfolio.count} reports sent to all owners via WhatsApp`)
  }, 1200)
}
</script>

<template>
  <div>
    <h1 class="flex items-center gap-2 text-xl font-bold text-slate-900"><FileText class="h-5 w-5 text-brand-600" /> Owner Reports</h1>
    <p class="text-sm text-slate-500">Generate a branded report and deliver it via WhatsApp.</p>

    <div class="mt-4 grid gap-5 lg:grid-cols-[320px_1fr]">
      <div class="space-y-4">
        <Card title="Generate report">
          <label class="text-xs font-medium text-slate-500">Property</label>
          <select v-model="selectedId" class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100">
            <option v-for="p in portfolio.properties" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>

          <label class="mt-3 block text-xs font-medium text-slate-500">Period</label>
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

          <div class="mt-3 border-t border-slate-100 pt-3">
            <AppButton variant="primary" block :disabled="sendingAll" @click="sendAll">
              <Users class="h-4 w-4" /> {{ sendingAll ? 'Sending…' : `Send to all ${portfolio.count} owners` }}
            </AppButton>
            <p class="mt-1.5 text-xs text-slate-400">One {{ period.toLowerCase() }} report per property, delivered to each owner.</p>
          </div>
        </Card>

        <Card title="Reporting status">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-2xl font-bold" :class="dueProperties.length ? 'text-amber-600' : 'text-emerald-600'">{{ portfolio.count - dueProperties.length }}/{{ portfolio.count }}</p>
              <p class="text-xs text-slate-400">owners updated this cycle</p>
            </div>
            <Badge :tone="dueProperties.length ? 'amber' : 'green'">{{ dueProperties.length }} due</Badge>
          </div>
          <div v-if="dueProperties.length" class="mt-3 space-y-1">
            <button
              v-for="p in dueProperties.slice(0, 4)"
              :key="p.id"
              class="pressable flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50"
              @click="selectedId = p.id"
            >
              <span class="truncate text-slate-600">{{ p.name }}</span>
              <span class="text-xs text-amber-600">not sent</span>
            </button>
            <p v-if="dueProperties.length > 4" class="px-2 text-xs text-slate-400">+{{ dueProperties.length - 4 }} more — use “Send to all”.</p>
          </div>
        </Card>

        <Card title="Recently sent" subtitle="">
          <ul class="space-y-2.5">
            <li v-for="h in history" :key="h.id" class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><History class="h-4 w-4" /></div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-medium text-slate-700">{{ propName(h.propertyId) }}</p>
                <p class="text-xs text-slate-400">{{ h.period }} · {{ h.sentAt }}</p>
              </div>
              <Badge tone="green" size="sm">{{ h.sentVia }}</Badge>
            </li>
          </ul>
        </Card>
      </div>

      <Card title="Preview" subtitle="This is what the owner receives">
        <OwnerReportPreview :report="report" />
      </Card>
    </div>

    <WhatsAppSendModal :open="sendOpen" :report="report" @close="sendOpen = false" @sent="onSent" />
  </div>
</template>
