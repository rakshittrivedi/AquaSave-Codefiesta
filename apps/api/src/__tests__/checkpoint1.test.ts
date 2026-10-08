import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import crypto from 'crypto';
import app from '../server';
import { Device, Tank, Reading } from '../models';

import jwt from 'jsonwebtoken';
import { config } from '../config';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

describe('Hardware Integration Checkpoint 1 - Local ESP32 Protocol Verification', () => {
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

    // Seed test tank and device
    await Tank.create({
      tankId: 'tank-01',
      name: 'Main Cistern',
      capacityLiters: 10000,
      location: 'Building A - North Roof',
      currentWaterLevel: 76,
      currentFlowRate: 2.3,
      thresholds: { lowPercent: 20, criticalPercent: 10 },
      status: 'normal',
      isOnline: true,
      lastSeenAt: new Date(),
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

  it('verifies 3 consecutive ESP32 telemetry readings are successfully ingested and reflected in tank status', async () => {
    const readings = [
      {
        deviceId: 'tank-01',
        waterLevel: 75.5,
        flowRate: 2.1,
        timestamp: new Date(Date.now() - 20000).toISOString(),
      },
      {
        deviceId: 'tank-01',
        waterLevel: 74.8,
        flowRate: 2.4,
        timestamp: new Date(Date.now() - 10000).toISOString(),
      },
      {
        deviceId: 'tank-01',
        waterLevel: 74.0,
        flowRate: 2.2,
        timestamp: new Date(Date.now()).toISOString(),
      },
    ];

    // Ingest 3 consecutive readings
    for (const r of readings) {
      const res = await request(app).post('/api/v1/ingest').set('X-Device-Key', devApiKey).send(r);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('created');
      expect(res.body.reading.waterLevel).toBe(r.waterLevel);
      expect(res.body.reading.flowRate).toBe(r.flowRate);
    }

    // Verify database contains all 3 consecutive readings
    const storedReadings = await Reading.find({ deviceId: 'tank-01' }).sort({ timestamp: 1 });
    expect(storedReadings.length).toBe(3);
    expect(storedReadings[0].waterLevel).toBe(75.5);
    expect(storedReadings[1].waterLevel).toBe(74.8);
    expect(storedReadings[2].waterLevel).toBe(74.0);

    // Verify GET /api/v1/tanks/tank-01 reflects the latest state from the 3rd reading
    const tankRes = await request(app)
      .get('/api/v1/tanks/tank-01')
      .set('Authorization', `Bearer ${authToken}`);
    expect(tankRes.status).toBe(200);
    expect(tankRes.body.currentWaterLevel).toBe(74.0);
    expect(tankRes.body.currentFlowRate).toBe(2.2);
    expect(tankRes.body.isOnline).toBe(true);
    expect(tankRes.body.status).toBe('normal');

    // Verify GET /api/v1/tanks/tank-01/readings returns historical readings
    const historyRes = await request(app)
      .get('/api/v1/tanks/tank-01/readings')
      .set('Authorization', `Bearer ${authToken}`);
    expect(historyRes.status).toBe(200);
    expect(historyRes.body.readings.length).toBe(3);
    expect(historyRes.body.count).toBe(3);
  });
});
