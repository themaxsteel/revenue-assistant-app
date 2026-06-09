<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ListPlus, Check, Lightbulb, ListChecks, Copy, Star } from 'lucide-vue-next'
import { useChatStore } from '@/stores/chat'
import { usePortfolioStore } from '@/stores/portfolio'
import { useTasksStore } from '@/stores/tasks'
import { reviewSourceLogos } from '@/mock/reviewLogos'
import AppIcon from '@/components/ui/AppIcon.vue'

const chat = useChatStore()
const portfolio = usePortfolioStore()
const tasks = useTasksStore()
const route = useRoute()

// Track which explanation messages have already been turned into a task.
const taskedIds = ref(new Set())
function addToTask(m) {
  if (!m.recObj || taskedIds.value.has(m.id)) return
  tasks.addFromRecommendation(m.recObj)
  taskedIds.value = new Set(taskedIds.value).add(m.id)
}

// Copy an AI-drafted review reply to the clipboard.
const copiedIds = ref(new Set())
function copyReply(m) {
  navigator.clipboard?.writeText(m.reply.draft)
  copiedIds.value = new Set(copiedIds.value).add(m.id)
  setTimeout(() => {
    const next = new Set(copiedIds.value)
    next.delete(m.id)
    copiedIds.value = next
  }, 1800)
}

// Property-aware context: when on a property page, the agent scopes to it.
const ctxPropertyId = computed(() =>
  route.path.startsWith('/property/') ? route.params.id : null,
)
const ctxProperty = computed(() => (ctxPropertyId.value ? portfolio.byId(ctxPropertyId.value) : null))

const input = ref('')
const scrollEl = ref(null)

function scrollToBottom() {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

function send(text) {
  const t = (text ?? input.value).trim()
  if (!t) return
  chat.send(t, { propertyId: ctxPropertyId.value })
  input.value = ''
  scrollToBottom()
}

watch(() => [chat.messages.length, chat.typing, chat.open], scrollToBottom)
</script>

<template>
  <Transition name="drawer">
    <aside
      v-if="chat.open"
      class="fixed inset-y-0 right-0 z-40 flex w-full flex-col border-l border-slate-200 bg-white sm:w-[440px]"
    >
      <!-- Header — clean white, subtle indigo accent -->
      <div class="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
        <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
          <AppIcon name="agent" :size="19" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold leading-tight text-slate-900">Assistant</p>
          <p class="flex items-center gap-1 truncate text-[11px] text-slate-400">
            <span class="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <template v-if="ctxProperty">{{ ctxProperty.name }}</template>
            <template v-else>Across {{ portfolio.count }} properties</template>
          </p>
        </div>
        <button class="pressable rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" title="Close assistant" @click="chat.close()">
          <AppIcon name="close" :size="18" />
        </button>
      </div>

      <!-- Messages -->
      <div ref="scrollEl" class="flex-1 space-y-4 overflow-y-auto px-4 py-5">
        <template v-for="m in chat.messages" :key="m.id">
          <!-- Assistant -->
          <div v-if="m.role === 'assistant'" class="flex items-start gap-2.5">
            <div class="min-w-0 max-w-[86%]">
              <!-- Structured recommendation explanation template -->
              <div
                v-if="m.explain"
                class="overflow-hidden rounded-2xl rounded-tl-md border border-slate-200 bg-white shadow-sm"
              >
                <div class="space-y-3 p-3.5">
                  <!-- What -->
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-brand-600">What</p>
                    <p class="mt-1 text-sm leading-relaxed text-slate-700">{{ m.explain.what }}</p>
                  </div>
                  <!-- Why -->
                  <div>
                    <p class="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                      <Lightbulb class="h-3 w-3" /> Why
                    </p>
                    <ul class="mt-1 space-y-1">
                      <li v-for="(w, i) in m.explain.why" :key="i" class="flex items-start gap-1.5 text-sm leading-snug text-slate-600">
                        <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />{{ w }}
                      </li>
                    </ul>
                    <p v-if="m.explain.meta" class="mt-1.5 text-[11px] font-medium text-slate-400">{{ m.explain.meta }}</p>
                  </div>
                  <!-- How -->
                  <div>
                    <p class="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-600">
                      <ListChecks class="h-3 w-3" /> How to do it
                    </p>
                    <ol class="mt-1 space-y-1.5">
                      <li v-for="(s, i) in m.explain.how" :key="i" class="flex items-start gap-2 text-sm leading-snug text-slate-600">
                        <span class="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">{{ i + 1 }}</span>
                        {{ s }}
                      </li>
                    </ol>
                  </div>
                  <p class="text-[11px] italic leading-snug text-slate-400">{{ m.explain.note }}</p>
                </div>
                <!-- Add to task -->
                <div class="border-t border-slate-100 p-2.5">
                  <button
                    v-if="!taskedIds.has(m.id)"
                    class="pressable flex w-full items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white transition-colors duration-150 hover:bg-brand-700"
                    @click="addToTask(m)"
                  >
                    <ListPlus class="h-3.5 w-3.5" /> Add to task
                  </button>
                  <p v-else class="flex items-center justify-center gap-1.5 py-1 text-xs font-medium text-emerald-600">
                    <Check class="h-3.5 w-3.5" /> Added to your tasks
                  </p>
                </div>
              </div>
              <!-- Drafted review reply template -->
              <div
                v-else-if="m.reply"
                class="overflow-hidden rounded-2xl rounded-tl-md border border-slate-200 bg-white shadow-sm"
              >
                <div class="space-y-3 p-3.5">
                  <div>
                    <p class="text-[11px] font-semibold uppercase tracking-wide text-brand-600">Suggested reply</p>
                    <p class="mt-1 rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">{{ m.reply.draft }}</p>
                  </div>
                  <div>
                    <p class="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-amber-600">
                      <Lightbulb class="h-3 w-3" /> Tips
                    </p>
                    <ul class="mt-1 space-y-1">
                      <li v-for="(t, i) in m.reply.tips" :key="i" class="flex items-start gap-1.5 text-sm leading-snug text-slate-600">
                        <span class="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400" />{{ t }}
                      </li>
                    </ul>
                  </div>
                  <p class="text-[11px] italic leading-snug text-slate-400">{{ m.reply.note }}</p>
                </div>
                <div class="border-t border-slate-100 p-2.5">
                  <button
                    class="pressable flex w-full items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-150"
                    :class="copiedIds.has(m.id) ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-600 text-white hover:bg-brand-700'"
                    @click="copyReply(m)"
                  >
                    <component :is="copiedIds.has(m.id) ? Check : Copy" class="h-3.5 w-3.5" />
                    {{ copiedIds.has(m.id) ? 'Copied' : 'Copy reply' }}
                  </button>
                </div>
              </div>
              <!-- Plain text reply -->
              <div
                v-else
                class="whitespace-pre-line rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2.5 text-sm leading-relaxed text-slate-700"
              >
                {{ m.text }}
              </div>
              <div v-if="m.suggestions" class="mt-2.5 flex flex-wrap gap-1.5">
                <button
                  v-for="s in m.suggestions"
                  :key="s"
                  class="pressable rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors duration-150 hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700"
                  @click="send(s)"
                >
                  {{ s }}
                </button>
              </div>
            </div>
          </div>

          <!-- User -->
          <div v-else class="flex flex-col items-end gap-1.5">
            <!-- Recommendation reference card (carried in via "Ask AI") -->
            <div
              v-if="m.rec"
              class="max-w-[86%] rounded-2xl rounded-tr-md border border-slate-200 bg-white p-3 text-left shadow-sm"
            >
              <p class="flex items-center gap-1 text-[11px] font-semibold text-brand-600">
                <AppIcon name="sparkles" :size="12" /> AI recommendation
              </p>
              <p class="mt-1 text-sm font-semibold leading-snug text-slate-800">{{ m.rec.title }}</p>
              <p v-if="m.rec.propertyName" class="mt-0.5 truncate text-xs text-slate-400">{{ m.rec.propertyName }}</p>
              <div class="mt-2 flex flex-wrap items-center gap-1.5">
                <span class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{{ m.rec.riskLabel }}</span>
                <span v-if="m.rec.rateText" class="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold text-brand-700">{{ m.rec.rateText }}</span>
              </div>
            </div>
            <!-- Review reference card (carried in via "Ask AI to draft a reply") -->
            <div
              v-if="m.reviewRef"
              class="max-w-[86%] rounded-2xl rounded-tr-md border border-slate-200 bg-white p-3 text-left shadow-sm"
            >
              <div class="flex items-center gap-1.5">
                <img v-if="reviewSourceLogos[m.reviewRef.source]" :src="reviewSourceLogos[m.reviewRef.source]" :alt="m.reviewRef.sourceName" class="h-4 w-4 shrink-0 rounded bg-white object-contain" />
                <span class="text-[10px] font-semibold text-slate-600">{{ m.reviewRef.sourceName }}</span>
                <Star class="h-3 w-3 text-amber-400" />
                <span class="text-xs font-bold text-slate-700">{{ m.reviewRef.rating }}<span class="font-medium text-slate-400">/{{ m.reviewRef.scale }}</span></span>
              </div>
              <p class="mt-1.5 line-clamp-3 text-xs leading-snug text-slate-500">“{{ m.reviewRef.text }}”</p>
              <p class="mt-1 text-[11px] text-slate-400">{{ m.reviewRef.author }}<template v-if="m.reviewRef.propertyName"> · {{ m.reviewRef.propertyName }}</template></p>
            </div>
            <div class="max-w-[86%] whitespace-pre-line rounded-2xl rounded-tr-md bg-brand-600 px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-sm">
              {{ m.text }}
            </div>
          </div>
        </template>

        <!-- Typing -->
        <div v-if="chat.typing" class="flex items-start gap-2.5">
          <div class="flex items-center gap-1 rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-3">
            <span class="dot" /><span class="dot" style="animation-delay: 150ms" /><span class="dot" style="animation-delay: 300ms" />
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="border-t border-slate-100 p-3">
        <div class="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 transition-colors focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100">
          <input
            v-model="input"
            type="text"
            placeholder="Ask about your portfolio…"
            class="min-w-0 flex-1 bg-transparent px-2 py-1 text-sm placeholder:text-slate-400 focus:outline-none"
            @keyup.enter="send()"
          />
          <button
            class="pressable flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors duration-150 hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400"
            :disabled="!input.trim() || chat.typing"
            title="Send"
            @click="send()"
          >
            <AppIcon name="send" :size="16" :stroke-width="2" />
          </button>
        </div>
        <p class="mt-2 flex items-center justify-center gap-1 text-[10px] text-slate-400">
          <AppIcon name="sparkles" :size="11" /> Grounded in your live portfolio data
        </p>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.dot {
  height: 6px;
  width: 6px;
  border-radius: 9999px;
  background: #94a3b8;
  animation: blink 1.2s infinite both;
}
@keyframes blink {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-2px); }
}
.drawer-enter-active,
.drawer-leave-active {
  transition: transform 300ms var(--ease-drawer);
}
.drawer-enter-from,
.drawer-leave-to {
  transform: translateX(100%);
}
@media (prefers-reduced-motion: reduce) {
  .dot { animation: none; }
  .drawer-enter-active,
  .drawer-leave-active { transition: none; }
}
</style>
