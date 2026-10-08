# AquaSave Hardware Integration & ESP32 Telemetry

This directory provides the hardware telemetry contract tooling for AquaSave:

1. **Real ESP32 Firmware**: `firmware/esp32_aquasave.ino` (Arduino / PlatformIO sketch)
2. **Software Simulator**: `src/simulator.ts` (Zero internal imports, pure Node.js HTTP client)

## Hardware Contract Specification

- **Method**: `POST /api/v1/ingest`
- **Headers**:
  - `Content-Type: application/json`
  - `X-Device-Key: <SHA256_PROVISIONED_KEY>`
- **Payload Schema**:

```json
{
  "deviceId": "tank-01",
  "waterLevel": 76.5,
  "flowRate": 2.3,
  "timestamp": "2026-03-31T12:00:00.000Z"
}
```

## Production Verification (T-016)

To direct telemetry to the production Render backend:

```bash
cp .env.production.example .env
npm run start
```

Or flash `firmware/esp32_aquasave.ino` to an ESP-WROOM-32 / ESP32 NodeMCU board with your Wi-Fi credentials.
