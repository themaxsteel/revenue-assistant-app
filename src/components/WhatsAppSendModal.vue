<script setup>
import { ref, watch } from 'vue'
import { Send, FileText, Check } from 'lucide-vue-next'
import Modal from './ui/Modal.vue'
import AppButton from './ui/AppButton.vue'
import { useUiStore } from '@/stores/ui'

const props = defineProps({
  open: Boolean,
  report: Object,
})
const emit = defineEmits(['close', 'sent'])
const ui = useUiStore()
const sending = ref(false)
const sent = ref(false)

watch(
  () => props.open,
  (v) => {
    if (v) {
      sending.value = false
      sent.value = false
    }
  },
)

function send() {
  sending.value = true
  setTimeout(() => {
    sending.value = false
    sent.value = true
    ui.toast(`Report sent to ${props.report.ownerName} via WhatsApp`)
    emit('sent')
    setTimeout(() => emit('close'), 900)
  }, 1100)
}
</script>

<template>
  <Modal :open="open" title="Send report via WhatsApp" @close="emit('close')">
    <template v-if="report">
      <div class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Send class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-semibold text-slate-800">{{ report.ownerName }}</p>
          <p class="text-xs text-slate-500">{{ report.ownerPhone }}</p>
        </div>
      </div>

      <div class="mt-3 rounded-xl border border-slate-200 p-3">
        <div class="flex items-center gap-2 text-sm text-slate-700">
          <FileText class="h-4 w-4 text-rose-500" />
          {{ report.propertyName }} — {{ report.period }}.pdf
        </div>
        <p class="mt-2 whitespace-pre-line rounded-lg bg-emerald-50 p-2.5 text-xs text-slate-600">
Halo {{ report.ownerName }}, berikut laporan performa {{ report.propertyName }} untuk {{ report.period.toLowerCase() }}. Occupancy & RevPAR terlampir di PDF. Terima kasih 🙏
        </p>
      </div>

      <p class="mt-3 text-xs text-slate-400">
        Prototype note: delivery is simulated. In production this calls the WhatsApp Business API
        with a generated PDF attachment.
      </p>
    </template>

    <template #footer>
      <AppButton variant="ghost" size="sm" @click="emit('close')">Cancel</AppButton>
      <AppButton variant="success" size="sm" :disabled="sending || sent" @click="send">
        <Check v-if="sent" class="h-3.5 w-3.5" />
        <Send v-else class="h-3.5 w-3.5" />
        {{ sent ? 'Sent' : sending ? 'Sending…' : 'Send now' }}
      </AppButton>
    </template>
  </Modal>
</template>
