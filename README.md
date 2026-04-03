# Brightcall Analytics Dashboard

A real-time telesales analytics dashboard for Deja Vu Real Estate, built on Brightcall call data. Displays KPIs, agent performance, call quality, conversion funnels, and heatmaps — updating automatically as calls happen.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS |
| Charts | Recharts |
| Database | Supabase (PostgreSQL) |
| Backend | Supabase Edge Functions (Deno) |
| Realtime | Supabase Realtime (postgres_changes) |
| Call Data | Brightcall Power Dialer API |

---

## Architecture & Data Flow

```
Brightcall Call Ends
        │
        ▼
webhook-receiver (Edge Function)
  - Receives callEnded / webphoneSummary events
  - Fires sync-calls asynchronously
        │
        ▼
sync-calls (Edge Function)
  - Fetches calls from Brightcall API (500/page)
  - Upserts into PostgreSQL calls table
        │
        ▼
Supabase Realtime
  - Notifies frontend of new rows (debounced 3s)
        │
        ▼
Dashboard (React)
  - Fetches all calls for selected date range
  - Runs computeMetrics() to aggregate KPIs
  - Renders 10+ visualizations
```

**Fallbacks:**
- If webhook misses a call → 5-min cron catches it
- If Supabase is down → direct Brightcall API via Vite proxy
- On first load → cached metrics from localStorage shown instantly

---

## Features

- **12 KPI Cards** — Total calls, answered, connection rate, avg talk time, qualified leads, follow-ups, appointments, efficiency, and more
- **Conversion Funnel** — Total → Answered → Meaningful → Follow Up → Qualified
- **Daily Bar Chart** — Total vs answered calls per day
- **Call Quality Donut** — Short / Medium / Meaningful duration breakdown
- **Outcome Distribution** — All call outcome tags ranked by frequency
- **Hourly Area Chart** — Call volume by hour with answered/unanswered overlay
- **Agent Leaderboard** — Sortable table with per-agent stats and rank badges
- **Activity Heatmap** — 7-day × 24-hour call intensity grid
- **Efficiency Gauge** — Overall lead qualification score (0–100)
- **Dark / Light Mode** — Toggle with persistence
- **Mobile Responsive** — Optimized for all screen sizes (360px–1600px)
- **Alert Banner** — Contextual warnings (low connection rate, short calls, etc.)

---

## Database Schema

**Table: `calls`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT (PK) | Unique call ID from Brightcall |
| `timestamp` | TIMESTAMP | Call start time (UTC) |
| `state` | INT | 1 = answered, 0 = unanswered |
| `clientNumber` | TEXT | Phone number dialed |
| `talkTime` | INT | Talk duration in seconds |
| `totalTime` | INT | Total duration including ringing |
| `outcomeTag` | TEXT | e.g. "Appointment Scheduled", "Qualified" |
| `involvedAgent1Id` | TEXT | Agent ID (827909–827912) |
| `tags` | TEXT[] | Array tags e.g. ["Busy"] |

---

## Edge Functions

### `sync-calls`
Fetches call data from Brightcall API and upserts into Supabase.

**Query parameters:**
- `?from=YYYY-MM-DD&to=YYYY-MM-DD` — Sync specific date range
- `?backfill=true` — Sync last 180 days

**Triggered by:**
- Brightcall webhook (on every call end)
- Supabase pg_cron (every 5 minutes, 9AM–7PM GST)
- Manual SQL call

### `webhook-receiver`
Receives real-time events from Brightcall and triggers `sync-calls`.

**Handled events:** `callEnded`, `webphoneSummary`
**Ignored events:** `callStarted` and all others

---

## Agents

| ID | Name |
|----|------|
| 827909 | Telesales 1 |
| 827910 | Telesales 2 |
| 827911 | Telesales 3 |
| 827912 | Telesales 4 |

---

## Environment Variables

```env
VITE_BRIGHTCALL_API_KEY=        # Brightcall API key
VITE_SUPABASE_URL=              # Supabase project URL
VITE_SUPABASE_ANON_KEY=         # Supabase anon key (public, read-only)
```

Supabase Edge Functions also use (set via Supabase dashboard secrets):
- `SUPABASE_SERVICE_ROLE_KEY` — For write access from Edge Functions
- `BRIGHTCALL_API_KEY` — Brightcall API key

---

## Local Development

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # Production build → dist/
npm run preview   # Preview production build
```

---

## Key Implementation Notes

- **Realtime debounce:** 3-second debounce on Realtime events prevents dashboard thrashing during bulk syncs
- **Upsert deduplication:** All syncs use `onConflict: 'id'` — safe to run multiple times
- **Outcome matching:** Case-insensitive with whitespace trimming for consistency
- **LocalStorage cache:** Key `bc_metrics_v1` — shows stale data instantly while fetching fresh
- **Theme:** CSS variables + Tailwind `dark:` prefix, toggled via `.dark` class on root
- **RLS:** Row Level Security enabled on `calls` table — public read, service-role write only

---

## Hosting

| Service | Usage |
|---------|-------|
| Vercel | Frontend (static React app) |
| Supabase | Database + Edge Functions + Realtime |

---

*Copyright Deja Vu Real Estate. All Rights Reserved.*
