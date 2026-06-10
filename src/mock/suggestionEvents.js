import dayjs from 'dayjs'
import { recommendations } from './recommendations'

// ── Suggestion lifecycle events ──────────────────────────────────────────────
// The data contract behind the **adoption / acceptance** success metric. Each
// time the RA interacts with a suggestion we append an event; the backend can
// replay these to compute acceptance rate, time-to-decision, and rejection
// reasons that feed back into the model.
//
// Shape (one row per event):
//   {
//     id:         string,           // unique event id
//     recId:      string,           // the suggestion it refers to
//     propertyId: string,
//     type:       EventType,        // see below
//     reason:     string | null,    // free-text/preset reason (for snooze/reject)
//     at:         ISO timestamp,
//   }
//
// EventType:
//   'viewed'   — surfaced/opened by the RA (dedup per rec; the denominator)
//   'tasked'   — accepted → added to tasks to apply (positive signal)
//   'applied'  — RA recorded the change as applied (strongest positive signal)
//   'snoozed'  — deferred (neutral)
//   'rejected' — dismissed (negative signal; carries a reason)
export const SUGGESTION_EVENT_TYPES = ['viewed', 'tasked', 'applied', 'snoozed', 'rejected']

// Preset reasons offered when an RA rejects/snoozes — kept as a small enum so the
// backend can aggregate them.
export const SUGGESTION_REJECT_REASONS = [
  'Too aggressive',
  'Already done',
  'Not relevant',
  'Wrong dates',
  'Owner preference',
]

// A little seeded history so the acceptance metric isn't empty on first load.
// Deterministic: first N recommendations get a viewed + a decision event.
function seed() {
  const out = []
  let n = 0
  recommendations.slice(0, 12).forEach((r, i) => {
    const base = dayjs().subtract((i % 6) + 1, 'day')
    out.push({ id: `evt-${++n}`, recId: r.id, propertyId: r.propertyId, type: 'viewed', reason: null, at: base.toISOString() })
    const decision = i % 4 === 0 ? 'rejected' : i % 4 === 3 ? 'snoozed' : 'tasked'
    out.push({
      id: `evt-${++n}`,
      recId: r.id,
      propertyId: r.propertyId,
      type: decision,
      reason: decision === 'rejected' ? SUGGESTION_REJECT_REASONS[i % SUGGESTION_REJECT_REASONS.length] : null,
      at: base.add(20, 'minute').toISOString(),
    })
  })
  return out
}

export const suggestionEventsSeed = seed()
