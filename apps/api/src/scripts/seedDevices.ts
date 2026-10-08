import crypto from 'crypto';
import mongoose from 'mongoose';
import { config } from '../config';
import { Device, Tank } from '../models';

export function hashKey(rawKey: string): string {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

export const INITIAL_TANKS = [
  {
    tankId: 'tank-01',
    name: 'Main Cistern',
    capacityLiters: 10000,
    location: 'Building A - North Roof',
    currentWaterLevel: 76,
    currentFlowRate: 2.3,
    thresholds: { lowPercent: 20, criticalPercent: 10 },
  },
  {
    tankId: 'tank-02',
    name: 'East Reserve',
    capacityLiters: 5000,
    location: 'Building B - East Courtyard',
    currentWaterLevel: 62,
    currentFlowRate: 1.1,
    thresholds: { lowPercent: 25, criticalPercent: 15 },
  },
  {
    tankId: 'tank-03',
    name: 'Garden Cistern',
    capacityLiters: 7500,
    location: 'Perimeter Grounds - Sector 3',
    currentWaterLevel: 45,
    currentFlowRate: 0.0,
    thresholds: { lowPercent: 20, criticalPercent: 10 },
  },
  {
    tankId: 'tank-04',
    name: 'Auxiliary Reservoir',
    capacityLiters: 12000,
    location: 'Service Facility - Basement',
    currentWaterLevel: 88,
    currentFlowRate: 3.5,
    thresholds: { lowPercent: 15, criticalPercent: 8 },
  },
];

export async function seedDevicesAndTanks(): Promise<{
  generatedKeys: Record<string, string>;
}> {
  const generatedKeys: Record<string, string> = {};

  for (const t of INITIAL_TANKS) {
    const existingTank = await Tank.findOne({ tankId: t.tankId });
    if (!existingTank) {
      await Tank.create({
        tankId: t.tankId,
        name: t.name,
        capacityLiters: t.capacityLiters,
        location: t.location,
        currentWaterLevel: t.currentWaterLevel,
        currentFlowRate: t.currentFlowRate,
        isOnline: true,
        lastSeenAt: new Date(),
        thresholds: t.thresholds,
        status: 'normal',
        analytics: {
          rollingRateLph: t.currentFlowRate * 60,
          hoursToEmpty: 36,
          leakageFlag: false,
          leakageFlagReason: null,
          totalHarvestedLiters: 1420,
          estimatedSavingsUsd: 4.26,
          co2SavedKg: 0.423,
        },
      });
      console.log(`[SEED] Created Tank: ${t.tankId} (${t.name})`);
    } else {
      console.log(`[SEED] Tank ${t.tankId} already exists, skipping.`);
    }

    const existingDevice = await Device.findOne({ deviceId: t.tankId });
    if (!existingDevice) {
      // Deterministic dev-friendly API key for testing and simulator
      const rawKey = `aq_key_${t.tankId}_${crypto.randomBytes(8).toString('hex')}`;
      const hashed = hashKey(rawKey);

      await Device.create({
        deviceId: t.tankId,
        tankId: t.tankId,
        apiKeyHash: hashed,
        isOnline: true,
        lastSeenAt: new Date(),
        lastTimestamp: null,
      });

      generatedKeys[t.tankId] = rawKey;
      console.log(`[SEED] Created Device: ${t.tankId} | API Key: ${rawKey}`);
    } else {
      console.log(`[SEED] Device ${t.tankId} already exists, skipping.`);
    }
  }

  return { generatedKeys };
}

async function run() {
  try {
    console.log(`[SEED] Connecting to MongoDB: ${config.MONGODB_URI}...`);
    await mongoose.connect(config.MONGODB_URI);
    console.log('[SEED] Connected.');

    const result = await seedDevicesAndTanks();

    if (Object.keys(result.generatedKeys).length > 0) {
      console.log('\n=============================================');
      console.log('DEVICE API KEYS (Store these securely!):');
      for (const [deviceId, key] of Object.entries(result.generatedKeys)) {
        console.log(`  ${deviceId}: ${key}`);
      }
      console.log('=============================================\n');
    } else {
      console.log('[SEED] All devices and tanks were already seeded.');
    }

    await mongoose.disconnect();
    console.log('[SEED] Completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('[SEED] Error during seeding:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}
