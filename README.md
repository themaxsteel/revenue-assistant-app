# Revenue Assistant — Clickable Prototype

A clickable UX prototype for an internal **Revenue Assistant (RA)** tool. Goal: let one RA
manage up to **20 small properties** (villas, guesthouses, boutique hotels — Indonesia) with an
**AI Agent** that recommends and (within guardrails) auto-executes revenue actions.

This is a **front-end prototype with dummy data** — no backend, no real integrations. It exists to
lock the UX and hand the backend team concrete screen flows + data shapes.

## Run

```bash
npm install
npm run dev
```

Opens at http://localhost:5173.

## Stack

Vue 3 (`<script setup>`) · Vite · Tailwind CSS v3 · Vue Router · Pinia · Chart.js · dayjs · lucide.

## What to click

- **Today** — Morning Triage. Prioritized worklist (Urgent / Watch / FYI) across all properties.
  "Run all auto-eligible" executes low-risk actions. Click any item → the relevant property tab.
- **Portfolio** — 20 property cards + an **RA Capacity meter** showing the 1-RA→20 premise.
- **AI Agent** — Recommendations inbox (Approve / Reject / Snooze with explainable "why"),
  Activity log (audit trail), and per-property Autonomy (Manual / Suggest / Auto).
- **Tasks & Activities** — manual task tracker (quick-add, templates, recurring, due dates,
  property/owner/source links, outcome logging) + a combined Activity timeline of manual + AI
  actions. Recommendations and alerts can be pinned in as follow-up tasks (the "Task" / pin buttons).
- **Owner Reports** — pick a property + period → PDF-style preview → simulate WhatsApp send.
- **Social Media** — monitor the automation engine (platform performance, per-property reach &
  engagement, automation queue with approvals, top posts).
- **Analytics**, **Alerts**, **Settings** (guardrails, kill-switch, integrations, team).
- **Property workspace** — Overview, Pricing & Calendar, Demand & Forecast, Compset, Channels,
  Promotions, Upselling, AI Agent, Reports.

### Try the key flows

1. Approve a recommendation → it moves to *Approved*, appears in the Agent **Activity log**, and the
   property's ADR/RevPAR updates.
2. Set a property's autonomy to **Auto** → its auto-eligible recs become *Auto-executed*.
3. Toggle the **kill-switch** (sidebar or Settings) → auto-execution is blocked portfolio-wide.
4. Generate an owner report → **Send via WhatsApp** → it lands in *Recently sent*.

State is held in Pinia and **resets on reload** (no persistence).

## For the backend team — data contract

The shapes the UI expects live in [`src/mock/`](src/mock). Each file is documented and stable
(seeded RNG). Key entities: `Property`, `RateRecommendation`, `AgentAction` (audit), `Alert`,
`WorklistItem`, `ForecastPoint`, `CompsetRate`, `Channel`, `Promotion`, `UpsellItem`,
`OwnerReport`, `Guardrail`, `User`. In production these are served by the existing systems
(PMS, Dynamic Pricing, Compset, Forecasting, BI, Channel Manager, CRM, Upselling, etc.) — see
the Integrations board in **Settings**.

## Design

UI polish follows the project `SKILL.md` (emil-design-eng): custom easing curves, sub-300ms UI
animations, `scale(0.97)` press feedback, staggered list entrances, `transform`/`opacity`-only
animation, and `prefers-reduced-motion` support.
