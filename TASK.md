# AquaSave: Task Breakdown (Condensed)

> **49 original micro-tasks → 28 merged tasks.** No deliverable or acceptance criterion was dropped; related tasks were combined into single work units (≤ 90 min each).
> Execution order is strictly **P0 → P1 → P2**. Work one task at a time, run the quality gate (lint → format → test → build) before every push, and use the commit message(s) listed. Where a task merges several originals, commit **per original sub-deliverable** (multiple small commits) using the listed messages.

## Execution Notes

- **Release Gate tasks (T-025 to T-027)** are labeled `P0 (Release Gate)`. They run after P1 because they validate the complete product, not because they add features.
- **Deployment moved to P0** (was P1 in the original plan) because the P0 production hardware checkpoint depends on it.
- If any P2 task is completed, re-run the T-027 smoke test before the final push.

## Merge Map (nothing deleted)

| New   | Merges Original | New   | Merges Original |
| ----- | --------------- | ----- | --------------- |
| T-001 | 001, 002        | T-015 | 035, 036        |
| T-002 | 003, 004        | T-016 | 042             |
| T-003 | 005, 006, 007   | T-017 | 026, 027        |
| T-004 | 008, 009        | T-018 | 028, 029        |
| T-005 | 010, 011        | T-019 | 030, 031        |
| T-006 | 012, 013        | T-020 | 032, 033        |
| T-007 | 014, 015        | T-021 | 040             |
| T-008 | 016, 017        | T-022 | 038, 039        |
| T-009 | 018, 019        | T-023 | 041             |
| T-010 | 020, 021        | T-024 | 034             |
| T-011 | 022, 023        | T-025 | 043, 044        |
| T-012 | 024             | T-026 | 045, 046        |
| T-013 | 037             | T-027 | 047             |
| T-014 | 025             | T-028 | 048, 049        |

---

# P0: MUST HAVE

## Step 1: Development Environment Setup

---

- [x] **T-001 Initialize Monorepo, Git, and Express Backend**

  - Priority: P0
  - Estimated Time: 50 min
  - Dependencies: None
  - Deliverables:
    - GitHub repo with `aquasave/` monorepo; root `package.json` with npm workspaces for `apps/web`, `apps/api`, `tools/simulator`; `.gitignore`; initial commit.
    - `apps/api/src/server.ts` with Express + CORS + Helmet + pino-http; `GET /api/v1/health` returns `{ status: "ok" }`; `ts-node-dev` dev script; `tsconfig.json` with strict mode.
  - Acceptance Criteria:
    - `npm install` from root succeeds; `git log` shows the initial commit; repo is accessible on GitHub; all workspace folders exist with placeholder `package.json`.
    - `npm run dev` in `apps/api` starts the server on port 3001; `curl localhost:3001/api/v1/health` returns `{ "status": "ok" }` with HTTP 200; no TypeScript errors.
  - Commit Messages:
    - `chore: initialize monorepo with npm workspaces`
    - `feat(api): bootstrap Express server with health endpoint`

---

- [x] **T-002 Bootstrap Vite + React Frontend and Code-Quality Tooling**

  - Priority: P0
  - Estimated Time: 50 min
  - Dependencies: T-001
  - Deliverables:
    - `apps/web` with Vite + React + TypeScript; Tailwind configured; `tokens.css` with all design tokens from the Frontend Architecture section; `AppShell.tsx` skeleton renders without errors.
    - ESLint + Prettier in both `apps/api` and `apps/web`; `lint-staged` + `husky` pre-commit hook runs lint + format on staged `.ts/.tsx` files; `.env.example` committed for both apps.
  - Acceptance Criteria:
    - `npm run dev` in `apps/web` opens `localhost:5173`; background color is `#0D1117`; no console errors; `npm run build` succeeds.
    - Committing a file with a lint error is blocked by the pre-commit hook; `npm run lint` passes on clean code; `npm run format` applies Prettier without errors.
  - Commit Messages:
    - `feat(web): bootstrap Vite React app with design tokens`
    - `chore: configure ESLint, Prettier, and Husky pre-commit hooks`

---

- [x] **T-003 MongoDB Atlas Connection, Models, and Device Seed**

  - Priority: P0
  - Estimated Time: 90 min
  - Dependencies: T-001
  - Deliverables:
    - Mongoose connected to Atlas in `server.ts`; startup connection log; graceful shutdown closes the connection; `MONGODB_URI` read via dotenv; `config/index.ts` validates all required env vars with Zod.
    - `Reading.ts`, `Tank.ts`, `Device.ts`, `DailySummary.ts`, `Alert.ts` models matching the Database Schema section exactly, including all indexes and TTL settings.
    - `src/scripts/seedDevices.ts` creating 4 devices (`tank-01` to `tank-04`) and matching `Tank` documents (name, capacity, location, thresholds); prints generated API keys once on first run; idempotent.
  - Acceptance Criteria:
    - Server logs "MongoDB connected"; a wrong URI logs an error and exits with code 1; no URI hardcoded in source.
    - `npm run build` passes; model indexes match the schema spec; TTL indexes present on `readings` and `dailySummaries`.
    - Running the seed script twice creates no duplicates; 4 devices in `devices` and 4 tanks in `tanks`; API keys logged once and stored as SHA-256 hashes.
  - Commit Messages:
    - `feat(api): connect Mongoose to MongoDB Atlas`
    - `feat(api): define Mongoose models with indexes and TTL`
    - `chore(api): add device registry seed script`

---

## Step 2: Integration Layer

---

- [x] **T-004 Device Auth Middleware and Ingest Endpoint**

  - Priority: P0
  - Estimated Time: 75 min
  - Dependencies: T-003
  - Deliverables:
    - `middleware/deviceAuth.ts`: reads `X-Device-Key`, hashes (SHA-256), looks up `devices`, returns 401 if missing/not found, injects `device` into `req` locals.
    - `routes/ingest.ts` + `schemas/ingestSchema.ts` (Zod); pipeline: auth → Zod validation → dedup check → order check → unit normalization → insert reading → update device `lastSeen`; returns 201 / 202 / 401 / 404 / 422 per spec.
  - Acceptance Criteria:
    - POST without header → 401; wrong key → 401; correct key passes; the key never appears in logs.
    - Exact hardware payload contract returns 201; same payload again returns 202; missing `flowRate` returns 422 with an error message; unknown `deviceId` returns 404; inserted reading is visible in Atlas.
  - Commit Messages:
    - `feat(api): implement per-device API key auth middleware`
    - `feat(api): implement POST /ingest with validation, dedup, and order check`

---

- [x] **T-005 Dev-Only ESP32 Simulator and Stale Device Detector**

  - Priority: P0
  - Estimated Time: 60 min
  - Dependencies: T-004
  - Deliverables:
    - `tools/simulator/simulator.ts`: simulates 4 tanks with realistic random-walk behavior (level trends down while flow is positive; occasional zero-flow periods; level clamped 0–100); POSTs to the backend every `SEND_INTERVAL_MS` using the exact payload contract; supports `DEVICE_IDS`, `SEND_INTERVAL_MS`, `SIMULATE_LOW`, `SIMULATE_LEAK` env overrides.
    - `services/staleDetector.ts`: 60s `setInterval` job; finds devices with `lastSeenAt` older than `STALE_THRESHOLD_MINUTES`; sets `tanks.isOnline = false`; emits `device:offline` via the injected Socket.IO instance.
  - Acceptance Criteria:
    - Simulator produces 4 new readings in Atlas within 30 seconds; zero imports from `apps/api` or `apps/web`; `SIMULATE_LOW=true` drives a tank below 20% within 3 minutes.
    - Stopping the simulator for 5 minutes shows an offline badge on the tank card (integration or manual test); restarting and sending a reading sets `isOnline = true`.
  - Commit Messages:
    - `chore(simulator): add ESP32 simulator for dev testing`
    - `feat(api): add stale device detector with offline Socket.IO emit`

---

## Step 3: Realtime Layer

---

- [x] **T-006 Socket.IO Server, Client Singleton, and TankContext**

  - Priority: P0
  - Estimated Time: 65 min
  - Dependencies: T-004, T-002
  - Deliverables:
    - Socket.IO server on the Express HTTP server; CORS allows `CORS_ORIGIN`; clients auto-join `tank:all`; `subscribe` with `{ deviceId }` joins `tank:{deviceId}`; ingest route emits `reading:new` and `alert:new`.
    - `lib/socket.ts` client singleton with reconnect config; `contexts/SocketProvider.tsx`; `contexts/TankContext.tsx` with `useReducer`; `UPDATE_TANK` on `reading:new`; `SET_OFFLINE` on `device:offline`.
  - Acceptance Criteria:
    - `wscat -c ws://localhost:3001` connects; POSTing to `/ingest` shows `reading:new` in wscat within 1 second.
    - Dashboard updates tank level without a refresh while the simulator runs; stopping the simulator for 5 minutes and restarting restores online status; no unhandled WebSocket errors in the console.
  - Commit Messages:
    - `feat(api): configure Socket.IO server with per-tank rooms`
    - `feat(web): connect Socket.IO client and wire TankContext`

---

## Step 4: Dashboard (P0 Core)

---

- [x] **T-007 TankFill, TankCard, and TankGrid**

  - Priority: P0
  - Estimated Time: 75 min
  - Dependencies: T-006
  - Deliverables:
    - `components/tanks/TankFill.tsx`: SVG cylinder cross-section; fill height from `waterLevel`; fill color from status (normal/low/critical/offline) via CSS custom properties; subtle sine-wave surface animation; `prefers-reduced-motion` aware; `aria-hidden="true"`.
    - `components/tanks/TankCard.tsx`: tank name, `TankFill`, level % (large monospace), StatusPill, flow rate, last-seen timestamp.
    - `components/tanks/TankGrid.tsx`: responsive 2×2 grid; both wired to `TankContext`.
  - Acceptance Criteria:
    - `<TankFill level={75} status="normal" />` shows a ~75% filled green cylinder; `status="critical"` shows red; animation stops under OS reduced-motion; no visual jump on `level` updates.
    - All 4 cards visible in a 2×2 grid on desktop; single column below 640px; StatusPill shows correct color and text label per status; offline tank shows a grey pill and "Offline" label.
  - Commit Messages:
    - `feat(web): implement SVG TankFill visualization component`
    - `feat(web): implement TankCard and TankGrid dashboard components`

---

- [x] **T-008 AppShell, StatusBar, and Alert Banner System**

  - Priority: P0
  - Estimated Time: 55 min
  - Dependencies: T-007
  - Deliverables:
    - `components/layout/StatusBar.tsx`: online device count, active alert count, "Last data received: Xs ago" counter; `components/layout/AppShell.tsx`: nav bar with logo + app name + StatusBar; routes `/` (dashboard) and `/tank/:id` (detail).
    - `contexts/AlertContext.tsx`; `components/alerts/AlertBanner.tsx` at top of page, `aria-live="assertive"`, shows alert type, tank name, level, timestamp; dismiss button; max 3 banners visible (queue overflow).
  - Acceptance Criteria:
    - "Last data received" updates every second; alert count increments on new alerts; nav links route without page reload.
    - `SIMULATE_LOW=true` shows an amber banner within 2 seconds; screen reader announces it (verify in browser accessibility tools); dismiss clears it; two simultaneous alerts both show.
  - Commit Messages:
    - `feat(web): implement AppShell with StatusBar`
    - `feat(web): implement AlertBanner with aria-live and AlertContext`

---

- [x] **T-009 Tanks REST Endpoints and Dashboard Data Fetch**

  - Priority: P0
  - Estimated Time: 45 min
  - Dependencies: T-003, T-007
  - Deliverables:
    - `routes/tanks.ts`: `GET /tanks` (all tanks with current state) and `GET /tanks/:id` (404 on missing).
    - `hooks/useTanks.ts` using React Query to fetch `GET /tanks` on mount and seed `TankContext`; `SkeletonCard.tsx` while loading; `ErrorBoundary.tsx` around the Dashboard route.
  - Acceptance Criteria:
    - `curl localhost:3001/api/v1/tanks` returns 4 tank objects each with `waterLevel`, `status`, `lastSeenAt`, `analytics`; `GET /tanks/not-a-real-id` returns 404.
    - Reload shows skeleton cards for ~1s then real data; stopping the backend shows the error boundary message, not a crash; data is present on first load without waiting for a Socket.IO event.
  - Commit Messages:
    - `feat(api): implement GET /tanks and GET /tanks/:id endpoints`
    - `feat(web): wire dashboard data fetch with React Query and loading states`

---

## Step 5: Historical Charts and Analytics (P0 Completion)

---

- [x] **T-010 Readings Endpoint with Level and Flow Charts**

  - Priority: P0
  - Estimated Time: 65 min
  - Dependencies: T-003, T-009
  - Deliverables:
    - `routes/readings.ts`: `GET /tanks/:id/readings?range=24h&limit=500`; uses the compound index; returns a sorted array.
    - `components/charts/LevelChart.tsx` and `FlowChart.tsx` (Recharts `LineChart`); range selector (1h/6h/24h/7d); custom theme from design tokens; accessible `<figure>` + `<figcaption>` wrapper.
  - Acceptance Criteria:
    - Returns up to 500 readings for the last 24h; `range=1h` returns only the last hour; no data returns `{ readings: [] }` with 200, not 404.
    - Charts render real simulator data; switching range refetches and re-renders; tooltip shows exact value and unit; charts are not white or default Recharts grey.
  - Commit Messages:
    - `feat(api): implement GET /tanks/:id/readings with range filter`
    - `feat(web): implement LevelChart and FlowChart with custom theme`

---

- [x] **T-011 Daily Aggregation Endpoint and ConsumptionChart**

  - Priority: P0
  - Estimated Time: 60 min
  - Dependencies: T-003, T-010
  - Deliverables:
    - `routes/analytics.ts`: `GET /tanks/:id/analytics/daily?days=7`; reads complete days from `dailySummaries`, runs the aggregation pipeline for the current day, merges and returns.
    - `components/charts/ConsumptionChart.tsx`: Recharts `BarChart`, 7-day daily consumption, week-over-week comparison label above the chart.
  - Acceptance Criteria:
    - Returns 7 day objects; `consumedLiters` non-zero after the simulator has run; today's entry reflects current-day readings; responds in < 500ms for 7 days.
    - 7 bars render; the label shows percentage change; hovering a bar shows exact litres; bars use `--color-chart-1`.
  - Commit Messages:
    - `feat(api): implement daily consumption aggregation endpoint`
    - `feat(web): implement daily ConsumptionChart`

---

- [x] **T-012 Tank Detail Page**

  - Priority: P0
  - Estimated Time: 35 min
  - Dependencies: T-010, T-011
  - Deliverables: `pages/TankDetailPage.tsx` with level, flow, and consumption charts plus tank metadata; reachable by clicking a TankCard; back button returns to the dashboard.
  - Acceptance Criteria: Clicking a card navigates to `/tank/tank-01`; all 3 charts render; page title shows the tank name; back button works; no horizontal scroll on mobile.
  - Commit Message: `feat(web): implement TankDetailPage with all charts`

---

## Step 6: P0 Quality, Hardware Checkpoint 1, and Production (Hour 10 onward)

---

- [x] **T-013 Hardware Payload Contract Integration Tests**

  - Priority: P0
  - Estimated Time: 40 min
  - Dependencies: T-004
  - Deliverables: `apps/api/src/__tests__/ingest.test.ts` (Vitest + Supertest) covering: valid payload → 201 + DB insert; duplicate → 202; missing field → 422; wrong key → 401; unknown `deviceId` → 404.
  - Acceptance Criteria: All 5 cases pass; `npm test` in `apps/api` exits 0; runs against a test DB (not production Atlas); runtime < 30 seconds.
  - Commit Message: `test(api): add hardware payload contract integration tests`

---

- [x] **T-014 Hardware Integration Checkpoint 1 (Local)**

  - Priority: P0
  - Estimated Time: 30 min
  - Dependencies: T-004, T-012, T-013
  - Deliverables: Real ESP32 posts to `localhost:3001/api/v1/ingest` with the API key from T-003; dashboard reflects real readings; hardware team confirms firmware matches the contract.
  - Acceptance Criteria: At least 3 consecutive real readings in Atlas `readings`; dashboard shows the correct level for the real tank with no code change; no validation errors in backend logs from real hardware data.
  - Commit Message: `chore: hardware integration checkpoint 1 - ESP32 verified`

---

- [x] **T-015 Deploy Backend (Render) and Frontend (Vercel)**

  - Priority: P0
  - Estimated Time: 50 min
  - Dependencies: T-014
  - Deliverables:
    - Backend deployed to Render from `apps/api`; all production env vars set; `GET https://aquasave-api.onrender.com/api/v1/health` returns 200.
    - Frontend deployed to Vercel from `apps/web`; `VITE_API_URL` and `VITE_SOCKET_URL` point to the Render URL; `https://aquasave.vercel.app` loads the dashboard.
  - Acceptance Criteria:
    - Health check passes on the production URL; Atlas reachable from Render; no 502/503 on the first request after a 5-minute idle wake-up; device registry seeded in the production DB.
    - Dashboard loads in < 3 seconds; Socket.IO connects to Render (not localhost); tank data visible; no mixed-content warnings in the console.
  - Commit Messages:
    - `chore: deploy backend to Render production`
    - `chore: deploy frontend to Vercel production`

---

- [x] **T-016 Hardware Integration Checkpoint (Production)**

  - Priority: P0
  - Estimated Time: 30 min
  - Dependencies: T-015
  - Deliverables: ESP32 firmware updated with production `BACKEND_URL` and production API key; real device posts to production; production dashboard reflects real readings.
  - Acceptance Criteria: Tank-01 readings appear in the production Atlas cluster; the Vercel dashboard shows real level updates within 2 seconds; alerts fire on production when level drops below threshold; hardware team signs off.
  - Commit Message: `chore: hardware integration checkpoint - production verified`

---

# P1: COMPETITIVE FEATURES

> Start only after every P0 task above is complete.

## Step 7: P1 Analytics

---

- [x] **T-017 Rolling Rate, Depletion Prediction, and PredictionPanel**

  - Priority: P1
  - Estimated Time: 65 min
  - Dependencies: T-016
  - Deliverables:
    - `services/analyticsService.ts`: `computeRollingRate(readings: Reading[]): number` (trapezoidal flow integration over the last 12 readings, L/hr); `computeDepletionHours(currentVolume: number, rate: number): number | null`; invoked on every ingest; result stored in `tanks.analytics`.
    - `components/analytics/PredictionPanel.tsx`: shows "~6 hrs to empty", "Filling", or "Calculating…" (< 12 readings); on Tank Detail and as a label on TankCard.
  - Acceptance Criteria:
    - Steady consumption yields a positive finite `hoursToEmpty`; zero flow yields `null` (not Infinity/NaN); `rollingRateLph` updates within one ingest cycle; division-by-zero guarded.
    - Human-readable time (hours or days, not a raw number); "Filling" on net-negative flow; "Calculating…" with fewer than 12 readings; updates without refresh.
  - Commit Messages:
    - `feat(api): implement rolling consumption rate and depletion prediction`
    - `feat(web): implement PredictionPanel with depletion countdown`

---

- [x] **T-018 Leakage Detection Service and LeakagePanel**

  - Priority: P1
  - Estimated Time: 55 min
  - Dependencies: T-017
  - Deliverables:
    - `analyticsService.ts`: `detectLeakage(deviceId, latestReading, recentReadings): LeakageResult` with Rule 1 (flow while level static) and Rule 2 (continuous night flow); stores `tanks.analytics.leakageFlag` + `leakageFlagReason`; emits `alert:new` type `LEAKAGE_SUSPECTED` on false → true transition.
    - `components/analytics/LeakagePanel.tsx`: "No leak detected" (green) or "Potential leak: [reason]" (amber/red) on Tank Detail.
  - Acceptance Criteria:
    - `SIMULATE_LEAK=true` triggers `LEAKAGE_SUSPECTED` within 2 minutes; alert present in Atlas `alerts`; 5 minutes of normal operation clears the flag; flag is debounced (does not toggle every reading).
    - Panel shows the correct state; reason text is human-readable (no enum values); keyboard focusable; icon never conveys state without text.
  - Commit Messages:
    - `feat(api): implement rule-based leakage detection service`
    - `feat(web): implement LeakagePanel component`

---

- [x] **T-019 Water Savings Metrics and SavingsPanel**

  - Priority: P1
  - Estimated Time: 45 min
  - Dependencies: T-017
  - Deliverables:
    - `analyticsService.ts`: increments `totalHarvestedLiters` per ingest via flow integration; computes `estimatedSavingsUsd` and `co2SavedKg`; stored in `tanks.analytics`.
    - `components/analytics/SavingsPanel.tsx`: total saved $ and CO₂ kg in the dashboard analytics row.
  - Acceptance Criteria:
    - After 10 minutes of simulation `estimatedSavingsUsd` is a small positive number; `co2SavedKg` uses the 0.000298 constant; values are cumulative and persist across server restarts.
    - Panel values match backend `tanks.analytics`; visible on the dashboard without opening Tank Detail; updates on the 30s React Query refetch.
  - Commit Messages:
    - `feat(api): implement water savings and CO2 metrics computation`
    - `feat(web): implement SavingsPanel with cost and CO2 metrics`

---

- [x] **T-020 Rain Forecast Poller, Cache, and RainForecast Component**

  - Priority: P1
  - Estimated Time: 65 min
  - Dependencies: T-003
  - Deliverables:
    - `services/weatherService.ts`: polls Open-Meteo `GET /v1/forecast?latitude={lat}&longitude={lon}&hourly=precipitation` every 30 minutes; stores in `tanks.forecast`; serves cache on poll failure; `GET /tanks/:id` includes the forecast.
    - `components/forecast/RainForecast.tsx`: 24-hour hourly precipitation strip; "Rain incoming" advisory banner when > 5mm forecast in the next 6 hours; collapsible dashboard section.
  - Acceptance Criteria:
    - First request fetches and stores forecast; later `GET /tanks/:id` calls use the cache with no new HTTP call; a deliberately wrong Open-Meteo URL falls back to the last cached forecast, not an error.
    - 24 hour columns render; advisory appears for > 5mm test data; "No rain forecast" at 0mm; missing data shows "Forecast unavailable".
  - Commit Messages:
    - `feat(api): implement Open-Meteo rain forecast poller with cache`
    - `feat(web): implement RainForecast strip with advisory`

---

## Step 8: P1 Alerts, Testing, CI, and Hardware Checkpoint 2 (Hour 16)

---

- [x] **T-021 AlertPanel with History and Acknowledge**

  - Priority: P1
  - Estimated Time: 35 min
  - Dependencies: T-008
  - Deliverables: `components/alerts/AlertPanel.tsx`: slide-in panel from the right (desktop) / bottom sheet (mobile); last 20 alerts with type, tank, level, time; "Acknowledge" calls `POST /alerts/:id/acknowledge`; acknowledged alerts show a checkmark and dimmed style. Backend: `GET /alerts?limit=20` and `POST /alerts/:id/acknowledge`.
  - Acceptance Criteria: Opens from a StatusBar button; 20 alerts load on open; acknowledgement persists after reload (stored in DB); keyboard focusable and closable with Escape.
  - Commit Message: `feat(web): implement AlertPanel with acknowledge functionality`

---

- [x] **T-022 Analytics Unit Tests and TankCard Component Test**

  - Priority: P1
  - Estimated Time: 60 min
  - Dependencies: T-017, T-018, T-007
  - Deliverables:
    - `apps/api/src/__tests__/analytics.test.ts`: `computeRollingRate` (normal, sparse data, zero flow), `computeDepletionHours` (normal, zero rate, negative rate), `detectLeakage` (Rule 1, Rule 2, no flag).
    - `apps/web/src/__tests__/TankCard.test.tsx`: renders normal/low/critical/offline fixtures; asserts status pill text, level % display, aria attributes.
  - Acceptance Criteria: All cases pass in both workspaces (`npm test` exits 0); analytics tests are pure (no DB calls) and document edge-case behavior; frontend tests use `@testing-library/react` queries, no implementation-detail selectors.
  - Commit Messages:
    - `test(api): add unit tests for analytics and leakage detection`
    - `test(web): add TankCard component tests`

---

- [x] **T-023 GitHub Actions CI Workflow**

  - Priority: P1
  - Estimated Time: 25 min
  - Dependencies: T-013, T-022
  - Deliverables: `.github/workflows/ci.yml` triggered on push to `main` and all PRs; runs `npm install`, `npm run lint`, `npm run build`, `npm test` for both workspaces.
  - Acceptance Criteria: A commit with a lint error fails the CI job; all checks passing shows a green checkmark; CI run time < 3 minutes.
  - Commit Message: `chore(ci): add GitHub Actions CI workflow`

---

- [x] **T-024 Hardware Integration Checkpoint 2 (P0 + P1 Verified)**

  - Priority: P1
  - Estimated Time: 20 min
  - Dependencies: T-018, T-019, T-020, T-021
  - Deliverables: All P0 and implemented P1 features verified with real ESP32 hardware posting to the backend; hardware team has the production Render URL.
  - Acceptance Criteria: Real hardware triggers depletion prediction updates; leakage detection does not false-positive on normal ESP32 readings; all P0 features confirmed end-to-end with the physical sensor.
  - Commit Message: `chore: hardware integration checkpoint 2 - P0+P1 verified`

---

# RELEASE GATE: DOCS, DEMO, FINAL VALIDATION

## Step 9: Documentation and Demo Rehearsal (Hour 20 onward)

---

- [x] **T-025 Production Redeploy Check, README, CHANGELOG, and Architecture Notes**

  - Priority: P0 (Release Gate)
  - Estimated Time: 50 min
  - Dependencies: T-024
  - Deliverables:
    - Confirm Render and Vercel auto-deployed the P1 code; production smoke check passes.
    - `README.md`: overview, live demo link (Vercel URL), architecture diagram (link to the Mermaid diagram in the plan), quick-start instructions, hardware integration guide pointing to `docs/hardware-integration.md`, team credits.
    - `CHANGELOG.md` (Keep a Changelog format) with v0.1.0 covering all P0 and implemented P1 features; `docs/architecture.md` with the architecture diagram and key decisions (HTTP over MQTT, in-process analytics, no job queue), one-paragraph justification each.
  - Acceptance Criteria: Production runs the latest commit; a judge understands the project from the README in 60 seconds; demo URL is correct and loads; quick-start steps are copy-pasteable and work; architecture doc explains all three decisions; all files committed.
  - Commit Messages:
    - `docs: write README with live demo link and setup instructions`
    - `docs: add CHANGELOG and architecture decision notes`

---

- [ ] **T-026 Demo Dry Run 1 and Bug Fix Pass**

  - Priority: P0 (Release Gate)
  - Estimated Time: 75 min
  - Dependencies: T-016, T-025
  - Deliverables:
    - Full demo script run end-to-end against the production URL with real hardware; every minute-by-minute point verified; hardware-failure fallback tested (pull USB, simulator takes over).
    - All P0 bugs found are fixed and deployed; no new features introduced.
  - Acceptance Criteria: Demo completes in ≤ 6 minutes without stopping; fallback works within 10 seconds; every bug has a fix commit; production reflects the fixes; no regressions; `npm test` still passes; all Hackathon Success Criteria met or logged as fixed.
  - Commit Messages:
    - `chore: demo dry run 1 complete - issues logged`
    - `fix: resolve bugs identified in demo dry run 1`

---

- [ ] **T-027 Final Demo Dry Run and Validation**

  - Priority: P0 (Release Gate)
  - Estimated Time: 30 min
  - Dependencies: T-026
  - Deliverables: Final full rehearsal; presenter confidence check; production URL open in the browser and ready; simulator terminal pre-loaded as the fallback.
  - Acceptance Criteria: Demo runs perfectly end-to-end; presenter knows every click in advance; hardware-failure fallback rehearsed; production URL loads in < 3 seconds on the demo laptop; all Hackathon Success Criteria confirmed.
  - Commit Message: `chore: final demo validation complete - v0.1.0 ready`

---

# P2: ONLY IF TIME PERMITS (after Hour 22)

---

- [ ] **T-028 JWT Authentication: Backend and Login Page**

  - Priority: P2
  - Estimated Time: 80 min
  - Dependencies: T-027
  - Deliverables:
    - `POST /auth/login`; JWT issued on valid credentials; `authMiddleware.ts` on all non-ingest routes; one admin user seeded.
    - `pages/LoginPage.tsx`; JWT stored in `localStorage`; redirect to dashboard on success; redirect to login on 401.
  - Acceptance Criteria:
    - Unauthenticated `GET /tanks` returns 401; a valid JWT grants access; tokens expire after 8 hours; `/ingest` remains device-key-only.
    - Correct credentials redirect to the dashboard; wrong credentials show an error; reload keeps the user authenticated.
    - Re-run the T-027 smoke test before the final push.
  - Commit Messages:
    - `feat(api): add JWT authentication to REST endpoints`
    - `feat(web): add login page with JWT auth flow`

---

_End of TASK.md_
