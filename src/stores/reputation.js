import { defineStore } from 'pinia'
import { reviewsSeed, reputationFor, REVIEW_SOURCES } from '@/mock/reputation'
import { usePortfolioStore } from './portfolio'
import { useUiStore } from './ui'

export const useReputationStore = defineStore('reputation', {
  state: () => ({
    reviews: reviewsSeed.map((r) => ({ ...r })),
  }),
  getters: {
    forProperty: (s) => (id) => s.reviews.filter((r) => r.propertyId === id),
    // Reviews awaiting a reply — negatives first, then most recent.
    needsReply: (s) =>
      s.reviews
        .filter((r) => !r.responded)
        .sort((a, b) => (a.sentiment === 'negative' ? -1 : 0) - (b.sentiment === 'negative' ? -1 : 0) || a.daysAgo - b.daysAgo),
    needsReplyForProperty: (s) => (id) =>
      s.reviews.filter((r) => r.propertyId === id && !r.responded),
    responseRate: (s) => {
      if (!s.reviews.length) return 100
      return Math.round((s.reviews.filter((r) => r.responded).length / s.reviews.length) * 100)
    },
    // Portfolio average on a /10 scale, weighted by review volume.
    portfolioScore() {
      const portfolio = usePortfolioStore()
      const reps = portfolio.properties.map((p) => reputationFor(p.id))
      const total = reps.reduce((a, r) => a + r.totalReviews, 0)
      return +(reps.reduce((a, r) => a + r.avg10 * r.totalReviews, 0) / total).toFixed(1)
    },
    // Per-source portfolio average (native scale shown to the RA).
    sourceAverages() {
      const portfolio = usePortfolioStore()
      const reps = portfolio.properties.map((p) => reputationFor(p.id))
      return REVIEW_SOURCES.map((s) => {
        let wsum = 0
        let w = 0
        reps.forEach((r) => {
          const src = r.sources.find((x) => x.key === s.key)
          wsum += src.score * src.reviewCount
          w += src.reviewCount
        })
        return { ...s, score: +(wsum / w).toFixed(1) }
      })
    },
    // Properties needing reputation attention: low score or unanswered negatives.
    attention() {
      const portfolio = usePortfolioStore()
      return portfolio.properties
        .map((p) => {
          const rep = reputationFor(p.id)
          const open = this.needsReplyForProperty(p.id)
          const negOpen = open.filter((r) => r.sentiment === 'negative').length
          return { property: p, rep, openReplies: open.length, negOpen }
        })
        .filter((x) => x.rep.avg10 < 8.2 || x.negOpen > 0)
        .sort((a, b) => b.negOpen - a.negOpen || a.rep.avg10 - b.rep.avg10)
    },
    // Recurring negative themes across open/recent reviews.
    themeCounts: (s) => {
      const counts = {}
      s.reviews
        .filter((r) => r.sentiment === 'negative')
        .forEach((r) => r.themes.forEach((t) => (counts[t] = (counts[t] || 0) + 1)))
      return Object.entries(counts)
        .map(([theme, count]) => ({ theme, count }))
        .sort((a, b) => b.count - a.count)
    },
  },
  actions: {
    markReplied(id) {
      const r = this.reviews.find((x) => x.id === id)
      if (!r || r.responded) return
      r.responded = true
      useUiStore().toast('Marked as replied')
    },
  },
})
