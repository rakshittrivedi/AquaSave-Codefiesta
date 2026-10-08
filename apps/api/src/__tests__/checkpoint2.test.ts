import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import app from '../server';
import { Device, Tank, Reading, Alert } from '../models';
import { config } from '../config';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

describe('Hardware Integration Checkpoint 2 - P0 + P1 Full System End-to-End', () => {
  let mongoServer: MongoMemoryServer;
  const devApiKey = 'aq_key_tank-01_local_dev';
  const hashedDevKey = hashKey(devApiKey);
  const authToken = jwt.sign({ username: 'admin', role: 'admin' }, config.JWT_SECRET);

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Reading.deleteMany({});
    await Device.deleteMany({});
    await Tank.deleteMany({});
    await Alert.deleteMany({});

    await Tank.create({
      tankId: 'tank-01',
      name: 'Main Cistern',
      capacityLiters: 10000,
      location: 'Building A - North Roof',
      currentWaterLevel: 80,
      currentFlowRate: 2.0,
      thresholds: { lowPercent: 20, criticalPercent: 10 },
      status: 'normal',
      isOnline: true,
      lastSeenAt: new Date(),
      analytics: {
        rollingRateLph: 0,
        hoursToEmpty: null,
        leakageFlag: false,
        leakageFlagReason: null,
        totalHarvestedLiters: 1000,
        estimatedSavingsUsd: 3.0,
        co2SavedKg: 0.298,
      },
    });

    await Device.create({
      deviceId: 'tank-01',
      tankId: 'tank-01',
      apiKeyHash: hashedDevKey,
      isOnline: true,
      lastSeenAt: new Date(),
      lastTimestamp: null,
    });
  });

  it('verifies continuous normal ESP32 telemetry updates depletion, savings, and does not false-positive leak', async () => {
    const baseTime = Date.now() - 12 * 60 * 1000;

    // Send 12 consecutive readings spaced by 1 minute with realistic intermittent usage (draw periods + idle intervals)
    for (let i = 0; i < 12; i++) {
      // Normal usage has resting intervals between consumption cycles
      const isIdle = i % 3 === 0;
      const flow = isIdle ? 0.0 : 2.5;
      const level = 80 - i * 0.4;

      const payload = {
        deviceId: 'tank-01',
        waterLevel: level,
        flowRate: flow,
        timestamp: new Date(baseTime + i * 60 * 1000).toISOString(),
      };

      const res = await request(app)
        .post('/api/v1/ingest')
        .set('X-Device-Key', devApiKey)
        .send(payload);

      expect(res.status).toBe(201);
    }

    // Verify GET /api/v1/tanks/tank-01
    const tankRes = await request(app)
      .get('/api/v1/tanks/tank-01')
      .set('Authorization', `Bearer ${authToken}`);
    expect(tankRes.status).toBe(200);

    const tank = tankRes.body;
    expect(tank.currentWaterLevel).toBe(75.6);
    expect(tank.currentFlowRate).toBe(2.5);
    expect(tank.status).toBe('normal');

    // P1 Analytics verification
    expect(tank.analytics).toBeDefined();
    // 2.0 L/min = ~120 L/hr rolling rate
    expect(tank.analytics.rollingRateLph).toBeGreaterThan(0);
    // Positive finite depletion hours (approx 7450 L / 120 L/hr ≈ 62 hrs)
    expect(tank.analytics.hoursToEmpty).toBeGreaterThan(0);
    // Cumulative savings increased
    expect(tank.analytics.totalHarvestedLiters).toBeGreaterThan(1000);
    expect(tank.analytics.co2SavedKg).toBeGreaterThan(0.298);
    expect(tank.analytics.estimatedSavingsUsd).toBeGreaterThan(3.0);
    // Normal consumption does NOT trigger false-positive leak
    expect(tank.analytics.leakageFlag).toBe(false);
  });

  it('triggers leakage detection and alerts when flow continues with static water level (Rule 1)', async () => {
    const baseTime = Date.now() - 7 * 60 * 1000;

    // Send 7 readings with flowRate 2.5 L/min but static level 75.0%
    for (let i = 0; i < 7; i++) {
      const payload = {
        deviceId: 'tank-01',
        waterLevel: 75.0, // Static water level despite flow
        flowRate: 2.5,
        timestamp: new Date(baseTime + i * 60 * 1000).toISOString(),
      };

      const res = await request(app)
        .post('/api/v1/ingest')
        .set('X-Device-Key', devApiKey)
        .send(payload);

      expect(res.status).toBe(201);
    }

    // Check tank analytics has flagged leak
    const tankRes = await request(app)
      .get('/api/v1/tanks/tank-01')
      .set('Authorization', `Bearer ${authToken}`);
    expect(tankRes.status).toBe(200);
    expect(tankRes.body.analytics.leakageFlag).toBe(true);

    // Verify alert is recorded in GET /api/v1/alerts
    const alertsRes = await request(app)
      .get('/api/v1/alerts')
      .set('Authorization', `Bearer ${authToken}`);
    expect(alertsRes.status).toBe(200);
    expect(Array.isArray(alertsRes.body)).toBe(true);

    const leakAlert = alertsRes.body.find((a: { type: string }) => a.type === 'LEAKAGE_SUSPECTED');
    expect(leakAlert).toBeDefined();
    expect(leakAlert.tankId).toBe('tank-01');
    expect(leakAlert.acknowledged).toBe(false);

    // Acknowledge the alert
    const ackRes = await request(app)
      .post(`/api/v1/alerts/${leakAlert._id}/acknowledge`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(ackRes.status).toBe(200);
    expect(ackRes.body.alert.acknowledged).toBe(true);

    // Re-verify alert state after acknowledge
    const updatedAlerts = await request(app)
      .get('/api/v1/alerts')
      .set('Authorization', `Bearer ${authToken}`);
    const updatedLeakAlert = updatedAlerts.body.find(
      (a: { _id: string }) => a._id === leakAlert._id
    );
    expect(updatedLeakAlert.acknowledged).toBe(true);
  });

  it('triggers critical water level alert and updates tank status to critical when level < 10%', async () => {
    const payload = {
      deviceId: 'tank-01',
      waterLevel: 7.5,
      flowRate: 1.0,
      timestamp: new Date().toISOString(),
    };

    const res = await request(app)
      .post('/api/v1/ingest')
      .set('X-Device-Key', devApiKey)
      .send(payload);

    expect(res.status).toBe(201);

    const tankRes = await request(app)
      .get('/api/v1/tanks/tank-01')
      .set('Authorization', `Bearer ${authToken}`);
    expect(tankRes.status).toBe(200);
    expect(tankRes.body.status).toBe('critical');

    const alertsRes = await request(app)
      .get('/api/v1/alerts')
      .set('Authorization', `Bearer ${authToken}`);
    expect(alertsRes.status).toBe(200);
    const criticalAlert = alertsRes.body.find((a: { type: string }) => a.type === 'CRITICAL_WATER');
    expect(criticalAlert).toBeDefined();
    expect(criticalAlert.level).toBe(7.5);
  });
});
