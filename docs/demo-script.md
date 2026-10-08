# AquaSave: Hackathon 6-Minute Demo Script & Rehearsal Runbook

This runbook guides presenters through the end-to-end 6-minute live judging demonstration for AquaSave.

---

## ⏱️ Minute-by-Minute Presentation Script

### Minute 0:00 - 1:00 | Problem Statement & SCADA Overview

- **Opening**: Commercial and institutional facilities lose thousands of gallons of rainwater due to unmonitored cistern overflows, undetected plumbing leaks, and manual inspection bottlenecks.
- **Screen**: Open [https://aquasave.vercel.app](https://aquasave.vercel.app) (or local dev environment).
- **Points to Highlight**:
  - Industrial SCADA theme with high-contrast accessibility.
  - Live `StatusBar`: Socket.IO connected status, 4/4 cisterns live, real-time last-data counter.
  - `TankGrid`: Fluid level cross-sections, reactive SVG visualizers, color-coded status pills (`Normal`, `Low Level`, `Critical`, `Offline`).

---

### Minute 1:00 - 2:00 | Real-Time Telemetry & Hardware Integration

- **Action**: Power on physical ESP32 device or run simulator:
  ```bash
  npm run dev:simulator
  ```
- **Points to Highlight**:
  - Show sub-second telemetry ingestion: as water depth changes, the fluid level inside the SVG cylinder dynamically animates without any page refresh.
  - Show request pipeline: `POST /api/v1/ingest` validates payload via Zod and verifies cryptographic `X-Device-Key`.

---

### Minute 2:00 - 3:00 | Predictive Intelligence & Weather Forecasting

- **Action**: Click on **Tank 01** to open the `TankDetailPage`.
- **Points to Highlight**:
  - **Predictive Depletion**: Numerical trapezoidal integration over recent readings calculates rolling consumption rate ($L/hr$) and precise hours to empty ($t_{\text{deplete}}$).
  - **Weather Advisory**: Integrated Open-Meteo 24-hour hourly precipitation strip informs operators of upcoming rainfall events ($>5\text{mm}$) to prepare cistern capacity in advance.
  - **Telemetry Trends**: Real-time Area charts for water level % and flow rate $L/min$, plus daily consumption bar charts.

---

### Minute 3:00 - 4:00 | Anomaly & Leak Detection with Operator Acknowledgement

- **Action**: Trigger leak simulation mode:
  ```bash
  SIMULATE_LEAK=true npm run dev:simulator
  ```
- **Points to Highlight**:
  - Rule-based anomaly engine detects continuous discharge without normal resting intervals.
  - Real-time `LEAKAGE_SUSPECTED` alarm banner automatically slides onto the dashboard.
  - Click the **Alerts** badge in the header: slide-in drawer displays the anomaly event with time, reservoir, and level.
  - Click **Acknowledge**: alert state synchronizes across all connected clients via Socket.IO and persists in MongoDB.

---

### Minute 4:00 - 5:00 | ESG Sustainability & Cost Savings Impact

- **Action**: Return to the main dashboard or view the Sustainability Panel.
- **Points to Highlight**:
  - **Harvest Volume**: Cumulative liters diverted from municipal utility demand.
  - **Financial Savings**: Live cost offset calculated at municipal utility equivalent ($\$0.003/L$).
  - **Carbon Offset**: Carbon emissions avoided ($0.000298\text{ kg } CO_2/L$) from avoided water pumping and municipal filtration.

---

### Minute 5:00 - 6:00 | Hardware Resilience & Fail-Safe Fallback

- **Action**: Test hardware-failure resilience:
  - Disconnect the ESP32 USB cable or stop the simulator process.
  - Observe stale device detection daemon: after threshold, status changes smoothly to `Offline` without crashing or freezing the interface.
  - Relaunch simulator or reconnect hardware: device immediately resumes live status (`ONLINE`) within 2 seconds.
- **Closing**: AquaSave delivers enterprise-grade SCADA telemetry, predictive intelligence, and verifiable ESG impact in an open, deployable stack.

---

## 🛡️ Fallback Checklist for Presenters

1. **Production URL**: Keep `https://aquasave.vercel.app` open in primary tab.
2. **Local Backup**: Keep `http://localhost:5173` running locally in secondary tab.
3. **Simulator Terminal**: Keep terminal pre-loaded with `npm run dev:simulator` ready to take over instantly if venue WiFi drops.
