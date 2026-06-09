// Lightweight intent-matching "AI agent" for the chat widget. No real LLM —
// it reads live mock-store state and returns deterministic, data-grounded
// replies. Supports EN + ID keywords since the demo audience is Indonesia.
//
// Returns: { text, suggestions?: string[], taskToCreate?: {...} }
// The chat store executes taskToCreate (so this module stays side-effect free).

import dayjs from 'dayjs'
import { usePortfolioStore } from '@/stores/portfolio'
import { useAgentStore } from '@/stores/agent'
import { useTasksStore } from '@/stores/tasks'
import { idr } from './util'
import { howToSteps } from './recoSteps'

const has = (msg, words) => words.some((w) => msg.includes(w))

const DEFAULT_SUGGESTIONS = [
  'Which properties need attention?',
  'How many recommendations are pending?',
  'Any overdue tasks?',
  'Give me a portfolio summary',
]

// Strip the imperative prefix from a create-task command to get the title.
function extractTaskTitle(raw) {
  return raw
    .replace(
      /^(tolong\s+|please\s+)?(buatkan|buat|tambah(kan)?|create|add|catat|ingatkan(\s+aku)?|remind\s+me(\s+to)?|note|tugas|task)[:\s]+(a\s+)?(task|tugas)?[:\s]*/i,
      '',
    )
    .trim()
}

function fmtProp(p) {
  return `• ${p.name} — occ ${p.occupancy}%, ADR ${idr(p.adr, { compact: true })}, pace ${p.paceDelta > 0 ? '+' : ''}${p.paceDelta}%`
}

export function respondToChat(rawMessage, ctx = {}) {
  const portfolio = usePortfolioStore()
  const agent = useAgentStore()
  const tasks = useTasksStore()
  const msg = rawMessage.toLowerCase().trim()
  const ctxProp = ctx.propertyId ? portfolio.byId(ctx.propertyId) : null

  // 1) CREATE TASK (action) — explicit imperative only
  if (
    has(msg, ['buatkan task', 'buat task', 'tambah task', 'tambahkan task', 'create task', 'add task', 'add a task']) ||
    /^(ingatkan|remind me|catat|note)\b/i.test(rawMessage.trim())
  ) {
    const title = extractTaskTitle(rawMessage.trim())
    if (!title) {
      return {
        text: 'Sure — what should the task say? For example: "Create task: call owner about July rates".',
      }
    }
    const taskToCreate = {
      title,
      propertyId: ctxProp?.id || null,
      ownerName: ctxProp?.ownerName || null,
      priority: 'medium',
      dueAt: dayjs().add(1, 'day').toISOString(),
    }
    const where = ctxProp ? ` for ${ctxProp.name}` : ''
    return {
      text: `Done — I've added the task${where}:\n"${title}"\nDue tomorrow, priority medium. You'll find it in Tasks & Activities.`,
      taskToCreate,
      suggestions: ['Any overdue tasks?', 'Which properties need attention?'],
    }
  }

  // 2) GREETING / HELP
  if (has(msg, ['halo', 'hai', 'hello', 'hi ', 'help', 'bantu', 'apa yang bisa', 'what can you']) || msg === 'hi' || msg === 'hey') {
    return {
      text:
        "Hi! I'm your Revenue Assistant AI. I can answer questions about your portfolio and create follow-up tasks for you. Try one of these:",
      suggestions: DEFAULT_SUGGESTIONS,
    }
  }

  // 3) PORTFOLIO SUMMARY / HEALTH
  if (has(msg, ['summary', 'ringkasan', 'overview', 'portfolio', 'portofolio', 'overall', 'health', 'kesehatan', 'keseluruhan'])) {
    return {
      text:
        `Across your ${portfolio.count} properties:\n` +
        `• Avg health ${portfolio.avgHealth} · avg occupancy ${portfolio.avgOccupancy}%\n` +
        `• ${portfolio.reviewedCount}/${portfolio.count} reviewed today\n` +
        `• ${agent.pending.length} AI recommendations pending (est. ${idr(agent.estPipeline, { compact: true })}/wk impact)\n` +
        `• ${tasks.overdue.length} overdue tasks, ${tasks.open.length} open`,
      suggestions: ['Which properties need attention?', 'How many recommendations are pending?'],
    }
  }

  // 4) NEEDS ATTENTION / UNDERPERFORMERS
  if (has(msg, ['attention', 'perhatian', 'underperform', 'masalah', 'turun', 'behind', 'pace', 'lemah', 'worst', 'terburuk'])) {
    const laggards = [...portfolio.properties]
      .filter((p) => p.paceDelta < 0 || p.alertCount > 0 || p.healthScore < 65)
      .sort((a, b) => a.paceDelta - b.paceDelta)
      .slice(0, 5)
    if (!laggards.length) {
      return { text: 'Good news — no properties are flagged right now. Pace and health look solid across the board.' }
    }
    return {
      text:
        `${laggards.length} ${laggards.length === 1 ? 'property needs' : 'properties need'} attention:\n` +
        laggards.map(fmtProp).join('\n'),
      suggestions: [`How is ${laggards[0].name} doing?`, 'How many recommendations are pending?'],
    }
  }

  // 5) PENDING RECOMMENDATIONS
  if (has(msg, ['recommendation', 'rekomendasi', 'pending', 'saran', 'approve', 'auto-eligible', 'auto eligible'])) {
    return {
      text:
        `You have ${agent.pending.length} recommendations pending` +
        ` — est. ${idr(agent.estPipeline, { compact: true })}/wk in impact.\n` +
        `Nothing is applied automatically — you approve each one.\n` +
        `Open Smart Suggestions to review them.`,
      suggestions: ['Which properties need attention?', 'Give me a portfolio summary'],
    }
  }

  // 6) TASKS STATUS
  if (has(msg, ['task', 'tugas', 'overdue', 'todo', 'to-do', 'pekerjaan', 'due'])) {
    if (!tasks.open.length) {
      return { text: "You're all caught up — no open tasks right now. 🎉" }
    }
    const top = tasks.overdue.slice(0, 4)
    return {
      text:
        `You have ${tasks.open.length} open tasks` +
        ` (${tasks.overdue.length} overdue, ${tasks.dueToday.length} due today).` +
        (top.length ? `\nOverdue:\n` + top.map((t) => `• ${t.title}`).join('\n') : ''),
      suggestions: ['Create task: follow up with owner', 'Give me a portfolio summary'],
    }
  }

  // 7) TOP PERFORMER
  if (has(msg, ['best', 'terbaik', 'top', 'paling bagus', 'highest', 'tertinggi'])) {
    const best = [...portfolio.properties].sort((a, b) => b.revpar - a.revpar)[0]
    return {
      text: `Your top performer by RevPAR is ${best.name} — RevPAR ${idr(best.revpar, { compact: true })}, occupancy ${best.occupancy}%, health ${best.healthScore}.`,
      suggestions: ['Which properties need attention?'],
    }
  }

  // 8) NAMED PROPERTY or CONTEXT PROPERTY stats
  const named = portfolio.properties.find((p) => msg.includes(p.name.toLowerCase()))
  const target = named || (has(msg, ['ini', 'this', 'performa', 'occupancy', 'adr', 'revpar', 'bagaimana', 'gimana', 'how is', "how's"]) ? ctxProp : null)
  if (target) {
    const recCount = agent.forProperty(target.id).filter((r) => r.status === 'pending').length
    const taskCount = tasks.forProperty(target.id).filter((t) => t.status === 'todo').length
    return {
      text:
        `${target.name} (${target.city}):\n` +
        `• Occupancy ${target.occupancy}% · ADR ${idr(target.adr, { compact: true })} · RevPAR ${idr(target.revpar, { compact: true })}\n` +
        `• Pace ${target.paceDelta > 0 ? '+' : ''}${target.paceDelta}% vs LY · health ${target.healthScore}\n` +
        `• ${recCount} pending recommendation${recCount === 1 ? '' : 's'} · ${taskCount} open task${taskCount === 1 ? '' : 's'}`,
      suggestions: [`Create task: review pricing for ${target.name}`, 'Which properties need attention?'],
    }
  }

  // FALLBACK
  return {
    text:
      "I'm not sure about that one yet. I can help with portfolio health, underperforming properties, pending recommendations, tasks, or creating a follow-up task. Try:",
    suggestions: DEFAULT_SUGGESTIONS,
  }
}

// Draft a professional reply to a guest review for the RA to post manually.
// Returns { draft, tips: string[], note }.
export function draftReviewReply(review, propName) {
  const place = propName || 'our property'
  const theme = (review.themes && review.themes[0]) || null
  let draft
  if (review.sentiment === 'negative') {
    draft =
      `Dear ${review.author}, thank you for your feedback and we're sorry your stay fell short` +
      `${theme ? ` — especially around ${theme.toLowerCase()}` : ''}. ` +
      `We've shared this with the team at ${place} and are already addressing it. ` +
      `We'd love the chance to host you again and make it right.`
  } else if (review.sentiment === 'neutral') {
    draft =
      `Hi ${review.author}, thank you for taking the time to review ${place}. ` +
      `We're glad you enjoyed your stay and we're always working to improve` +
      `${theme ? `, including ${theme.toLowerCase()}` : ''}. We hope to welcome you back soon.`
  } else {
    draft =
      `Hi ${review.author}, thank you so much for the kind words about ${place}! ` +
      `${theme ? `We're thrilled the ${theme.toLowerCase()} stood out. ` : ''}` +
      `It would be a pleasure to host you again on your next trip.`
  }
  return {
    draft,
    tips: [
      'Keep it warm, specific, and under ~4 sentences.',
      review.sentiment === 'negative'
        ? 'Acknowledge the issue and state the fix — never argue publicly.'
        : 'Mention a detail from their review so it feels personal.',
      'Reply promptly — OTAs reward fast, consistent responses.',
    ],
    note: 'Copy this, tweak it in your own voice, and post it on the OTA — then mark the review as replied.',
  }
}

// Tailored, data-grounded explanation of a single recommendation, returned as a
// structured payload (what / why / how) the chat widget renders as a template.
// Side-effect free.
export function explainRecommendation(rec, propName) {
  const where = propName || 'this property'
  const what =
    rec.type?.includes('rate') && rec.recommendedRate
      ? `Change the nightly rate from ${idr(rec.currentRate)} to ${idr(rec.recommendedRate)} (${rec.deltaPct >= 0 ? '+' : ''}${rec.deltaPct}%).`
      : rec.applyLabel || rec.title
  return {
    what,
    why: (rec.drivers || []).slice(),
    meta: rec.confidence
      ? `Confidence ${rec.confidence}% · est. ${idr(rec.estImpact, { compact: true })}/wk impact`
      : null,
    how: howToSteps(rec, where),
    note: "I don't apply anything automatically — add this to your tasks and make the change yourself.",
  }
}
