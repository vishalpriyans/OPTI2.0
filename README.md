# OptiQueue — Operating Theatre Scheduling Assistant

Tagline: Smarter OT scheduling — optimize cases, reduce delays, and handle emergencies.

---

## Problem Statement

Operating rooms (OTs) are high-value, high-demand resources. Manual scheduling often leads to overlapping bookings, resource conflicts (surgeons, equipment), poor utilization, and slow responses to emergency cases. This prototype addresses the need for a fast, visible, and optimizable scheduling interface that helps hospitals reduce wait time, avoid conflicts, and make near-real-time adjustments.

## Solution Overview

OptiQueue is a single-page Next.js prototype that simulates an OT scheduling control tower. It provides:

- A visual Gantt-style timeline for daily and weekly views.
- An in-browser scheduler that optimizes cases per OT while respecting turnover times and priority.
- Conflict detection and an interactive Conflict Analysis panel to inspect and resolve issues.
- Emergency case insertion and a simple rescheduling flow.

The scheduling logic is implemented in TypeScript so it can run client-side for demo purposes or be easily moved to serverless functions for scale.

## Features (MVP)

- Gantt visualization for OTs (daily & weekly)
- In-browser optimization engine (heuristic scheduler)
- Conflict detection (surgeon/equipment/time/priority/OT)
- Conflict Analysis panel with per-conflict details and auto-resolve flags
- Emergency case inserter and dynamic re-scheduler
- Case management UI (add/remove cases) and sample data loader

## Installation & Setup (for judges / reviewers)

Requirements:
- Node.js 18+ (LTS recommended)
- npm (or pnpm if you prefer — project includes a pnpm lockfile but scripts use npm)

PowerShell (Windows) quick setup:

```powershell
# From project root (where README.md and package.json are)
# 1. Install dependencies
npm install

# 2. Run the dev server (hot reload)
npm run dev

# 3. Open the app in your browser
# Navigate to: http://localhost:3000

# Optional: production build
npm run build
npm start
```

Notes:
- If you prefer pnpm: `pnpm install` then `pnpm dev` (if configured). The repo includes `pnpm-lock.yaml` but uses npm scripts by default.

## Usage (how to evaluate in 1–5 minutes)

1. Open http://localhost:3000 in your browser.
2. Use the sidebar to:
   - "Load Sample Data" to populate surgeries, or add cases manually using the form.
   - Click "Generate Optimized Schedule" to run the in-browser optimizer.
   - Click "🚨 Load Sample Conflicts" to load a pre-built schedule with conflicts and see the Conflict Analysis panel.
3. Inspect the Gantt timeline: hover blocks to view details (case id, surgeon, times).
4. Insert an emergency via the "Emergency Case" widget and observe how the scheduler re-adjusts.
5. Expand the Conflict Analysis card to view conflict details and use "Resolve" or "Resolve All" to mark them handled.

## Tech Stack

- Framework: Next.js 15 (App Router) + React 19
- Language: TypeScript
- Styling: Tailwind CSS + custom global CSS
- UI Primitives: Radix UI components, Lucide icons
- Data / State: React hooks (local store), SWR (available in deps)
- Scheduling & Logic: Custom TypeScript scheduler and conflict detector (in `components/optiqueue/`)
- Charts & UI: Recharts, Sonner (toasts)
- Tooling: npm, TypeScript, PostCSS, Tailwind

## Project Structure (high-level)

- `app/` — Next.js app routes and global styles
- `components/optiqueue/` — core components: `gantt.tsx`, `scheduler.ts`, `conflict-detector.ts`, `conflict-display.tsx`, etc.
- `components/ui/` — reusable UI wrappers and primitives
- `public/` — static assets
- `styles/` — (legacy) styles

## Team & Credits

Team members:
- Your Name (replace with actual team member names)
- Vishal priyan s
- Ananya G
- Sukumar Kongara   

Thanks & credits:
- Built on Next.js, React and Tailwind CSS
- UI primitives from Radix UI and icons by Lucide
- Open-source libraries: zod, date-fns, recharts, sonner

## Next Steps / Roadmap

- Move heavy scheduling logic to a serverless API for large data sets and improved performance.
- Add unit and integration tests for the scheduler and conflict detection using Jest or Vitest.
- Persist schedules and audit trail (Postgres or managed DB).
- Add authentication and role-based access for scheduling operators.

## Troubleshooting

- If dev server fails to start: ensure Node.js is installed and on PATH. Run `node -v`.
- If ports are in use, change the default Next.js port: `PORT=3001 npm run dev`.
- If TypeScript errors block you on build, run `npm run dev` — Next.js dev mode is more forgiving and will show runtime diagnostics.


---

If you want, I can:
- Fill in the Team section with actual names (tell me the list),
- Generate a one-page PDF slide from this content, or
- Create a short README-based demo script for judges with exact timings.

Replace any placeholder names and tweak the setup steps if you use pnpm or yarn. Happy to update further.