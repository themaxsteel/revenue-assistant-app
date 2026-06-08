<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { usePortfolioStore } from '@/stores/portfolio'
import AppIcon from '@/components/ui/AppIcon.vue'

const chat = useChatStore()
const portfolio = usePortfolioStore()
const route = useRoute()

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
              <div class="whitespace-pre-line rounded-2xl rounded-tl-md bg-slate-100 px-3.5 py-2.5 text-sm leading-relaxed text-slate-700">
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
          <div v-else class="flex justify-end">
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
