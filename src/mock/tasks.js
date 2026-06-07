import dayjs from 'dayjs'
import { properties, propertyById } from './properties'

// Manual tasks the RA records, plus a few converted from recommendations/alerts.
// A task can link to a property, an owner, and/or a source (recommendation|alert),
// or be a free-floating task. Completing a task emits an Activity (see store).

export const TASK_TEMPLATES = [
  { label: 'Review pace vs LY', priority: 'medium', recurring: 'daily' },
  { label: 'Call owner', priority: 'high', recurring: null },
  { label: 'Check compset', priority: 'medium', recurring: 'weekly' },
  { label: 'Update OTA content', priority: 'low', recurring: null },
  { label: 'Negotiate OTA contract', priority: 'high', recurring: null },
  { label: 'Refresh listing photos', priority: 'low', recurring: null },
]

function p(idx) {
  return properties[idx]
}

export const seedTasks = [
  {
    id: 'task-01',
    title: 'Call owner about July rate strategy',
    note: 'Owner wants to discuss school-holiday pricing before we push higher rates.',
    propertyId: p(0).id,
    ownerName: p(0).ownerName,
    link: null,
    priority: 'high',
    status: 'todo',
    dueAt: dayjs().subtract(1, 'day').toISOString(), // overdue
    recurring: null,
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    completedAt: null,
    outcome: null,
  },
  {
    id: 'task-02',
    title: 'Review pace vs LY across portfolio',
    note: '',
    propertyId: null,
    ownerName: null,
    link: null,
    priority: 'medium',
    status: 'todo',
    dueAt: dayjs().toISOString(), // today
    recurring: 'daily',
    createdAt: dayjs().subtract(1, 'hour').toISOString(),
    completedAt: null,
    outcome: null,
  },
  {
    id: 'task-03',
    title: 'Negotiate lower Booking.com commission',
    note: 'Volume has grown — push for 13%.',
    propertyId: p(3).id,
    ownerName: p(3).ownerName,
    link: null,
    priority: 'high',
    status: 'todo',
    dueAt: dayjs().add(2, 'day').toISOString(),
    recurring: null,
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    completedAt: null,
    outcome: null,
  },
  {
    id: 'task-04',
    title: 'Fix rate parity breach (from alert)',
    note: 'Booking.com 7% under direct.',
    propertyId: p(1).id,
    ownerName: p(1).ownerName,
    link: { type: 'alert', id: 'alert-xxx', label: 'Rate Parity alert' },
    priority: 'high',
    status: 'todo',
    dueAt: dayjs().toISOString(),
    recurring: null,
    createdAt: dayjs().subtract(4, 'hour').toISOString(),
    completedAt: null,
    outcome: null,
  },
  {
    id: 'task-05',
    title: 'Check compset for long-weekend dates',
    note: '',
    propertyId: p(6).id,
    ownerName: p(6).ownerName,
    link: null,
    priority: 'medium',
    status: 'todo',
    dueAt: dayjs().add(1, 'day').toISOString(),
    recurring: 'weekly',
    createdAt: dayjs().subtract(1, 'day').toISOString(),
    completedAt: null,
    outcome: null,
  },
  {
    id: 'task-06',
    title: 'Refresh listing photos for hero shot',
    note: 'Current cover photo underperforms.',
    propertyId: p(10).id,
    ownerName: p(10).ownerName,
    link: null,
    priority: 'low',
    status: 'todo',
    dueAt: dayjs().add(5, 'day').toISOString(),
    recurring: null,
    createdAt: dayjs().subtract(2, 'day').toISOString(),
    completedAt: null,
    outcome: null,
  },
  // Completed (already have outcomes — show in Activity timeline)
  {
    id: 'task-07',
    title: 'Launch early-bird promo for shoulder season',
    note: '',
    propertyId: p(4).id,
    ownerName: p(4).ownerName,
    link: { type: 'recommendation', id: 'rec-xxx', label: 'Early-bird promo' },
    priority: 'medium',
    status: 'done',
    dueAt: dayjs().subtract(1, 'day').toISOString(),
    recurring: null,
    createdAt: dayjs().subtract(3, 'day').toISOString(),
    completedAt: dayjs().subtract(20, 'hour').toISOString(),
    outcome: { note: 'Promo live on Direct + Booking.com', impact: 3_200_000 },
  },
  {
    id: 'task-08',
    title: 'Call owner — monthly performance recap',
    note: '',
    propertyId: p(8).id,
    ownerName: p(8).ownerName,
    link: null,
    priority: 'medium',
    status: 'done',
    dueAt: dayjs().subtract(2, 'day').toISOString(),
    recurring: null,
    createdAt: dayjs().subtract(4, 'day').toISOString(),
    completedAt: dayjs().subtract(2, 'day').toISOString(),
    outcome: { note: 'Owner approved dynamic pricing for Q3', impact: 0 },
  },
]

// A couple of pre-seeded manual activities not tied to a current task,
// so the Activity timeline reads like a real working history.
export const seedActivities = [
  {
    id: 'mact-01',
    kind: 'manual',
    propertyId: p(2).id,
    summary: 'Adjusted weekend min-stay to 2 nights manually',
    timestamp: dayjs().subtract(6, 'hour').toISOString(),
    impact: 1_100_000,
  },
  {
    id: 'mact-02',
    kind: 'manual',
    propertyId: p(5).id,
    summary: 'Replied to 3 OTA guest inquiries to protect conversion',
    timestamp: dayjs().subtract(28, 'hour').toISOString(),
    impact: 0,
  },
]

export function taskPropertyName(id) {
  return id ? propertyById(id)?.name : null
}
