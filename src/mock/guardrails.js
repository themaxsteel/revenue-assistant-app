// Global guardrails the AI Agent must respect in 'auto' mode. Per-property
// overrides can be layered on top. killSwitch globally disables auto-execution.
export const globalGuardrails = {
  killSwitch: false,
  maxDailyDeltaPct: 15, // max auto rate change per day
  floorPct: 70, // floor as % of BAR baseline
  ceilingPct: 180, // ceiling as % of BAR baseline
  lastMinuteLockHrs: 48, // no auto changes inside this window before arrival
  agentHours: '06:00–22:00 WIB',
  autoActionsToday: 14,
  blockedByGuardrailToday: 3,
}

// Integration status board — the 12 systems the company already operates.
// All "connected" in this mock; production reads real health from each API.
export const integrations = [
  { name: 'Property Management System', key: 'pms', status: 'connected', latency: 120 },
  { name: 'Point of Sale (POS)', key: 'pos', status: 'connected', latency: 95 },
  { name: 'Booking Engine', key: 'booking', status: 'connected', latency: 140 },
  { name: 'Upselling', key: 'upsell', status: 'connected', latency: 88 },
  { name: 'CRM & Marketing', key: 'crm', status: 'connected', latency: 160 },
  { name: 'Website', key: 'web', status: 'connected', latency: 75 },
  { name: 'Social Media Automation', key: 'social', status: 'connected', latency: 210 },
  { name: 'Multi-OTA Channel Chat', key: 'chat', status: 'connected', latency: 180 },
  { name: 'Business Intelligence', key: 'bi', status: 'connected', latency: 240 },
  { name: 'Deep Analysis', key: 'deep', status: 'degraded', latency: 620 },
  { name: 'Dynamic Pricing', key: 'pricing', status: 'connected', latency: 130 },
  { name: 'Compset', key: 'compset', status: 'connected', latency: 150 },
  { name: 'Demand & Forecasting', key: 'forecast', status: 'connected', latency: 175 },
]
