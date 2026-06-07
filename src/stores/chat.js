import { defineStore } from 'pinia'
import { respondToChat } from '@/mock/chatAgent'
import { useTasksStore } from './tasks'

let mid = 0

const WELCOME = {
  id: ++mid,
  role: 'assistant',
  text: "Hi! I'm your Revenue Assistant AI. Ask me about your portfolio, or tell me to create a follow-up task.",
  suggestions: [
    'Which properties need attention?',
    'How many recommendations are pending?',
    'Any overdue tasks?',
    'Give me a portfolio summary',
  ],
}

export const useChatStore = defineStore('chat', {
  state: () => ({
    open: false,
    typing: false,
    unread: 0,
    messages: [WELCOME],
  }),
  actions: {
    toggle() {
      this.open = !this.open
      if (this.open) this.unread = 0
    },
    close() {
      this.open = false
    },
    send(text, ctx = {}) {
      const t = (text || '').trim()
      if (!t || this.typing) return
      this.messages.push({ id: ++mid, role: 'user', text: t })
      this.typing = true

      // Small delay so the reply feels considered, not instant.
      setTimeout(() => {
        const res = respondToChat(t, ctx)
        if (res.taskToCreate) {
          useTasksStore().addTask(res.taskToCreate)
        }
        this.messages.push({
          id: ++mid,
          role: 'assistant',
          text: res.text,
          suggestions: res.suggestions || null,
        })
        this.typing = false
        if (!this.open) this.unread += 1
      }, 650)
    },
    reset() {
      this.messages = [WELCOME]
    },
  },
})
