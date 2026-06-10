# Revenue Assistant — Clickable Prototype

A clickable UX prototype for an internal **Revenue Assistant (RA)** tool. Goal: let one RA
manage up to **20 small properties** (villas, guesthouses, boutique hotels — Indonesia) with an
**AI Assistant** that prepares revenue suggestions for the RA to review and apply.
**Nothing runs automatically** — the assistant only recommends; the RA decides what to apply.

This is a **front-end prototype with dummy data** — no backend, no real integrations. It exists to
lock the UX and hand the backend team concrete screen flows + data shapes.

## Product overview (PRD)

**Problem.** A Revenue Assistant can only personally analyse and act on a handful of properties per
day. Headcount scales linearly with portfolio size, so revenue quality slips as more properties are
added.

**Thesis.** Let **one RA comfortably run ~20 small properties** by having the AI do the analysis and
*prepare ready-to-apply suggestions*. The RA reviews and applies — never the machine.

**Primary user.** A **Revenue Assistant**, often a *novice* (not necessarily a revenue-management
expert). The UI must guide the next action and always explain the "why". A secondary **Lead / Admin**
persona oversees multiple RAs and sets portfolio-wide recommendation limits.

**Goals & success metrics.**
- **Capacity** — properties handled per RA (target ~20) without quality loss.
- **Adoption** — share of AI suggestions the RA reviews and applies (acceptance rate).
- **Revenue uplift** — RevPAR / occupancy gains from applied suggestions.

**Scope.** Day-to-day **operations**: morning triage, suggestion review/apply, task & follow-up
tracking, pricing & channel upkeep, reputation replies, owner reporting, and monitoring the outcome
of applied actions.

**Non-goals (out of scope).**
- ❌ **No automatic execution** of revenue actions — the AI only prepares; the RA applies every change.
- ❌ **Not an analytics / BI tool** — this is an *operational* app, not a data-exploration / dashboard product.
- ❌ Not a PMS / channel manager / booking engine — it sits on top of those systems (see Integrations).

> "Social Media Automation" (scheduling posts) is a separate, legitimate integration — **not** part of
> the no-automation rule above.

**Status.** A **clickable front-end prototype with seeded dummy data**. Its job is to lock the UX and
give the backend team concrete screen flows + data shapes to model the database against.

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
  Click any item → the relevant property tab. Nothing is applied automatically.
- **Portfolio** — "Today's focus" briefing + a **List** view and a **Calendar (matrix)** view
  (properties × time, occupancy heatmap, drill into a month for daily detail, with
  Smart Suggestion badges on cells). Group, sort, filter, and pin properties.
- **Smart Suggest** — Suggestions inbox (Add to task / Ask AI, with explainable "why" and a
  "Quick win" / "Needs review" tag), plus an Activity log (audit trail). Everything is
  reviewed and applied by the RA — there is no auto-execution.
- **Tasks & Activities** — manual task tracker (quick-add, templates, recurring, due dates,
  property/owner/source links, outcome logging) + a combined Activity timeline of manual + AI
  actions. Recommendations and alerts can be pinned in as follow-up tasks (the "Task" / pin buttons).
- **Owner Reports** — pick a property + period → PDF-style preview → simulate WhatsApp send.
- **Social Media** — monitor the automation engine (platform performance, per-property reach &
  engagement, automation queue with approvals, top posts).
- **Alerts**, **Settings** (recommendation limits, integrations, team).
- **Property workspace** — Overview, Smart Suggestions, Monitoring, Pricing & Calendar,
  Channels, Social Media, Reputation, Reports.

### Try the key flows

1. Approve a recommendation → it moves to *Approved*, appears in the **Activity log**, and the
   property's ADR/RevPAR updates.
2. Open the Portfolio **Calendar** view → click a month to drill into daily occupancy → click a
   cell with a Smart Suggestion badge → review it and open it in the property's Smart Suggestions tab.
3. Generate an owner report → **Send via WhatsApp** → it lands in *Recently sent*.

State is held in Pinia and **resets on reload** (no persistence).

## For the backend team — data contract

The shapes the UI expects live in [`src/mock/`](src/mock). Each file is documented and stable
(seeded RNG). Key entities: `Property`, `RateRecommendation`, `AgentAction` (audit), `Alert`,
`WorklistItem`, `ForecastPoint`, `Channel`, `Promotion`, `UpsellItem`,
`OwnerReport`, `Guardrail`, `User`. In production these are served by the existing systems
(PMS, Dynamic Pricing, Compset, Forecasting, BI, Channel Manager, CRM, Upselling, etc.) — see
the Integrations board in **Settings**.

## Design

UI polish follows the project `SKILL.md` (emil-design-eng): custom easing curves, sub-300ms UI
animations, `scale(0.97)` press feedback, staggered list entrances, `transform`/`opacity`-only
animation, and `prefers-reduced-motion` support.
