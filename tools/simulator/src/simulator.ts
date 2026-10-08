import dotenv from 'dotenv';

dotenv.config();

interface TankState {
  deviceId: string;
  waterLevel: number;
  flowRate: number;
}

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const SEND_INTERVAL_MS = parseInt(process.env.SEND_INTERVAL_MS || '5000', 10);
const SIMULATE_LOW = process.env.SIMULATE_LOW === 'true';
const SIMULATE_LEAK = process.env.SIMULATE_LEAK === 'true';

const deviceIds = (process.env.DEVICE_IDS || 'tank-01,tank-02,tank-03,tank-04')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Key resolution: check specific env var DEVICE_KEY_<ID>, or fallback to default local dev key
function getDeviceKey(deviceId: string): string {
  const envKey = process.env[`DEVICE_KEY_${deviceId.toUpperCase().replace('-', '_')}`];
  if (envKey) return envKey;
  if (process.env.DEVICE_KEY) return process.env.DEVICE_KEY;
  return `aq_key_${deviceId}_local_dev`;
}

// Initial state for simulated tanks
const tanks: Record<string, TankState> = {
  'tank-01': { deviceId: 'tank-01', waterLevel: 76.0, flowRate: 2.3 },
  'tank-02': { deviceId: 'tank-02', waterLevel: 62.0, flowRate: 1.1 },
  'tank-03': { deviceId: 'tank-03', waterLevel: 45.0, flowRate: 0.0 },
  'tank-04': { deviceId: 'tank-04', waterLevel: 88.0, flowRate: 3.5 },
};

// Ensure all specified deviceIds are initialized
for (const id of deviceIds) {
  if (!tanks[id]) {
    tanks[id] = { deviceId: id, waterLevel: 65.0, flowRate: 1.5 };
  }
}

console.log('========================================================');
console.log('AquaSave ESP32 Hardware Telemetry Simulator');
console.log(`Backend Target:    ${BACKEND_URL}/api/v1/ingest`);
console.log(`Send Interval:     ${SEND_INTERVAL_MS} ms`);
console.log(`Device IDs:        ${deviceIds.join(', ')}`);
console.log(`Simulate Low:      ${SIMULATE_LOW}`);
console.log(`Simulate Leak:     ${SIMULATE_LEAK}`);
console.log('========================================================\n');

async function sendReading(state: TankState): Promise<void> {
  const payload = {
    deviceId: state.deviceId,
    waterLevel: parseFloat(state.waterLevel.toFixed(1)),
    flowRate: parseFloat(state.flowRate.toFixed(2)),
    timestamp: new Date().toISOString(),
  };

  const key = getDeviceKey(state.deviceId);

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-Key': key,
      },
      body: JSON.stringify(payload),
    });

    const bodyText = await res.text();
    if (res.status === 201) {
      console.log(
        `[✓ 201 CREATED] ${state.deviceId} | Level: ${payload.waterLevel}% | Flow: ${payload.flowRate} L/min`
      );
    } else if (res.status === 202) {
      console.log(`[~ 202 ACCEPTED (DEDUP)] ${state.deviceId}`);
    } else {
      console.warn(`[! HTTP ${res.status}] ${state.deviceId}: ${bodyText}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[X FAILED] ${state.deviceId}: Connection failed (${message})`);
  }
}

function updateState(state: TankState): void {
  if (SIMULATE_LOW && state.deviceId === 'tank-01') {
    // Aggressively drop level to test LOW (<20%) and CRITICAL (<10%) states within 3 minutes
    state.flowRate = 5.5 + Math.random() * 2.0;
    state.waterLevel = Math.max(0, state.waterLevel - 1.5);
    return;
  }

  if (SIMULATE_LEAK && state.deviceId === 'tank-01') {
    // Constant continuous flow while water level doesn't change normally, simulating pipe leak
    state.flowRate = 1.2;
    state.waterLevel = Math.max(0, state.waterLevel - 0.05);
    return;
  }

  // Realistic random-walk:
  // 15% chance of zero-flow (idle tap/pump)
  const isIdle = Math.random() < 0.15;
  if (isIdle) {
    state.flowRate = 0;
  } else {
    // Small random walk on flow rate between 0.5 and 4.0 L/min
    const deltaFlow = (Math.random() - 0.5) * 0.6;
    state.flowRate = Math.max(0.2, Math.min(6.0, state.flowRate + deltaFlow));
  }

  // Water level decreases with flow consumption
  if (state.flowRate > 0) {
    const consumptionDrop = (state.flowRate / 60) * 0.15;
    state.waterLevel = Math.max(0, state.waterLevel - consumptionDrop);
  } else {
    // Small natural condensation or holding steady
    state.waterLevel = Math.min(100, Math.max(0, state.waterLevel + (Math.random() - 0.5) * 0.05));
  }

  // If level gets too low in normal mode, simulate rain harvesting refill
  if (state.waterLevel < 12 && !SIMULATE_LOW) {
    state.waterLevel = 70.0;
    console.log(`[EVENT] ${state.deviceId} refilled via simulated rainfall harvest!`);
  }
}

async function tick(): Promise<void> {
  for (const id of deviceIds) {
    const state = tanks[id];
    if (state) {
      updateState(state);
      await sendReading(state);
    }
  }
}

// Initial cycle
tick();

// Scheduled recurring cycle
const interval = setInterval(tick, SEND_INTERVAL_MS);

process.on('SIGINT', () => {
  clearInterval(interval);
  console.log('\nSimulator stopped.');
  process.exit(0);
});
