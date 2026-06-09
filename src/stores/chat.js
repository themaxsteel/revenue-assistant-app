import { defineStore } from 'pinia'
import { respondToChat, explainRecommendation, draftReviewReply } from '@/mock/chatAgent'
import { useTasksStore } from './tasks'
import { idr } from '@/mock/util'

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
    // Open the drawer and post a tailored explanation of a recommendation
    // (what / why / how) — triggered by the "Ask AI" button on a rec card.
    explainRecommendation(rec, propName = null) {
      this.open = true
      this.unread = 0
      // Compact reference card carried into the chat alongside the question.
      const recRef = {
        title: rec.title,
        propertyName: propName,
        riskLabel: rec.risk === 'auto' ? 'Low risk' : 'Needs review',
        rateText:
          rec.type?.includes('rate') && rec.recommendedRate
            ? `${idr(rec.currentRate, { compact: true })} → ${idr(rec.recommendedRate, { compact: true })} (${rec.deltaPct >= 0 ? '+' : ''}${rec.deltaPct}%)`
            : null,
      }
      this.messages.push({ id: ++mid, role: 'user', text: 'Explain this recommendation', rec: recRef })
      this.typing = true
      setTimeout(() => {
        this.messages.push({
          id: ++mid,
          role: 'assistant',
          explain: explainRecommendation(rec, propName),
          recObj: rec, // carried so the "Add to task" button can act
          suggestions: ['Which properties need attention?', 'Give me a portfolio summary'],
        })
        this.typing = false
        if (!this.open) this.unread += 1
      }, 700)
    },
    // Open the drawer and draft a reply to a guest review — triggered by the
    // "Ask AI to draft a reply" button on a review card.
    askReviewReply(review, propName = null) {
      this.open = true
      this.unread = 0
      const reviewRef = {
        source: review.source,
        sourceName: review.sourceName,
        author: review.author,
        rating: review.rating,
        scale: review.scale,
        sentiment: review.sentiment,
        text: review.text,
        propertyName: propName,
      }
      this.messages.push({ id: ++mid, role: 'user', text: 'Help me reply to this review', reviewRef })
      this.typing = true
      setTimeout(() => {
        this.messages.push({
          id: ++mid,
          role: 'assistant',
          reply: draftReviewReply(review, propName),
          suggestions: ['Which properties need attention?', 'Give me a portfolio summary'],
        })
        this.typing = false
        if (!this.open) this.unread += 1
      }, 700)
    },
    reset() {
      this.messages = [WELCOME]
    },
  },
})
