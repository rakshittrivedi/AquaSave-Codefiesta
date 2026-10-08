# Changelog

All notable changes to the AquaSave Smart Rainwater Harvesting Management System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.1.0] - 2026-10-09

### Added

#### SCADA Frontend (`apps/web`)

- Industrial SCADA user interface with high-contrast `#0D1117` dark palette, responsive CSS Grid layout, and zero layout-shift fluid cards.
- Reactive SVG `TankFill` component rendering dynamic fluid cross-sections, wave surface animations, and color-coded status gradients.
- `StatusPill` indicator with distinct color tokens for `Normal`, `Low Level`, `Critical`, and `Offline` states.
- `StatusBar` utility header showing Socket.IO connection status, active live cistern count, seconds since last received packet, and interactive alert badge.
- `TankGrid` and `TankCard` components with keyboard accessibility (`Enter` / `Space` navigation), ARIA status announcements, and touch support.
- `TankDetailPage` featuring historical telemetry area charts (`Recharts`), daily consumption aggregations, and technical cistern specifications.
- `PredictionPanel` computing and displaying estimated hours to empty ($t_{\text{deplete}}$), net flow direction, and rolling consumption rate ($L/hr$).
- `LeakagePanel` displaying rule-based anomaly detection results, human-readable diagnoses, and real-time warnings.
- `SavingsPanel` visualising accumulated water harvest volume ($L$), municipal cost savings ($\$$), and carbon offset ($kg\ CO_2$).
- `RainForecast` component rendering 24-hour Open-Meteo precipitation histograms and incoming rain advisories ($>5mm$).
- `AlertPanel` slide-in drawer displaying up to 20 historical anomalies and thresholds with persistent acknowledgement action.
- Global `AlertBanner` broadcasting real-time unacknowledged critical and leakage alerts with dismiss capability.
- Unit and component testing suite (`Vitest` + `@testing-library/react` + `jsdom`) validating all `TankCard` fixtures.

#### Backend API & Services (`apps/api`)

- High-throughput Express ingestion pipeline (`POST /api/v1/ingest`) with Zod schema validation, ISO 8601 parsing, and duplicate packet deduplication.
- Pre-shared cryptographic device authentication middleware (`X-Device-Key` with SHA-256 hash lookup).
- Socket.IO real-time pub/sub server broadcasting `reading:new`, `alert:new`, and `device:offline` to room subscribers (`tank:all` and `tank:{id}`).
- Background stale device detector polling every 60s for devices exceeding a 5-minute heartbeat threshold.
- `analyticsService`:
  - Trapezoidal numerical integration over rolling 12-reading windows computing hourly discharge ($L/hr$).
  - Depletion countdown algorithm calculating hours remaining until empty.
  - Multi-rule leakage anomaly detector evaluating continuous discharge during static water level and uninterrupted flow intervals.
  - Financial savings ($\$0.003/L$) and carbon offset ($0.000298\ kg\ CO_2/L$) accumulators.
- `weatherService`:
  - Open-Meteo 24-hour hourly precipitation poller with 30-minute resilient in-memory and database caching.
- Alert management endpoints (`GET /api/v1/alerts` and `POST /api/v1/alerts/:id/acknowledge`).
- Automated test suites (29 tests across 5 test suites) verifying ingestion, authentication, analytics, weather poller, and end-to-end integration checkpoints.

#### IoT & Edge Layer (`tools/simulator` & `tools/simulator/firmware`)

- High-fidelity multi-tank ESP32 simulator (`tools/simulator/simulator.ts`) with configurable random-walk fluid physics, consumption schedules, and fault injection flags (`SIMULATE_LOW`, `SIMULATE_LEAK`).
- Production Arduino/C++ firmware (`esp32_aquasave.ino`) for ESP32 DevKit v1 with HC-SR04 ultrasonic sensor and YF-S201 flow turbine.

#### Infrastructure & CI/CD

- GitHub Actions CI workflow (`.github/workflows/ci.yml`) automating formatting checks, ESLint linting, multi-workspace tests, and production builds.
- Render deployment configuration (`render.yaml`) for backend API with CORS and environment variable bindings.
- Vercel deployment configuration (`apps/web/vercel.json`) with SPA rewrite routing.
- Husky pre-commit hooks running Prettier and ESLint via `lint-staged`.
