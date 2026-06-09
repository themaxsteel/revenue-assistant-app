import { idr } from './util'

// Step-by-step "how to do it yourself" for a recommendation, by action type.
// Pure (no store imports) so both the chat agent and the tasks store can use it
// without creating circular dependencies. Nothing is applied automatically —
// these are instructions for the RA to perform manually.
export function howToSteps(rec, where = 'this property') {
  if (rec.type?.includes('rate')) {
    return [
      `Open the “Pricing & Calendar” tab for ${where}.`,
      `Set the nightly rate to ${idr(rec.recommendedRate)} (${rec.deltaPct >= 0 ? '+' : ''}${rec.deltaPct}% vs the current ${idr(rec.currentRate)}).`,
      `Save the change, then mark this task as done.`,
    ]
  }
  if (rec.type === 'parity_sync') {
    return [
      `Open the “Channels” tab for ${where}.`,
      `Find the OTA flagged out of parity and re-sync its rate.`,
      `Confirm it shows “in parity”, then mark this task as done.`,
    ]
  }
  if (rec.type === 'ota_open') {
    return [
      `Open the “Channels” tab for ${where}.`,
      `Reopen the closed OTA inventory for the affected dates.`,
      `Mark this task as done.`,
    ]
  }
  if (rec.type === 'min_stay') {
    return [
      `Open the “Pricing & Calendar” tab for ${where}.`,
      `Apply the minimum-stay on the peak dates noted.`,
      `Mark this task as done.`,
    ]
  }
  return [
    `Open the relevant tab for ${where}.`,
    rec.applyLabel || 'Apply the change described above.',
    `Mark this task as done.`,
  ]
}
