import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import crypto from 'crypto';
import app from '../server';
import { Device, Tank, Reading } from '../models';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

describe('Hardware Payload Contract Integration Tests (POST /api/v1/ingest)', () => {
  let mongoServer: MongoMemoryServer;
  const validApiKey = 'test-device-key-tank-01';
  const validHashedKey = hashKey(validApiKey);

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
      name: 'Test Tank 01',
      capacityLiters: 10000,
      location: 'Test Location',
      currentWaterLevel: 50,
      currentFlowRate: 0,
      thresholds: { lowPercent: 20, criticalPercent: 10 },
      status: 'normal',
      isOnline: true,
      lastSeenAt: new Date(),
    });

    await Device.create({
      deviceId: 'tank-01',
      tankId: 'tank-01',
      apiKeyHash: validHashedKey,
      isOnline: true,
      lastSeenAt: new Date(),
      lastTimestamp: null,
    });
  });

  // 1. Valid payload -> 201 + DB insert
  it('should accept valid hardware payload and insert reading into database (201)', async () => {
    const timestamp = new Date().toISOString();
    const payload = {
      deviceId: 'tank-01',
      waterLevel: 76,
      flowRate: 2.3,
      timestamp,
    };

    const res = await request(app)
      .post('/api/v1/ingest')
      .set('X-Device-Key', validApiKey)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('created');
    expect(res.body.reading).toBeDefined();
    expect(res.body.reading.deviceId).toBe('tank-01');
    expect(res.body.reading.waterLevel).toBe(76);
    expect(res.body.reading.flowRate).toBe(2.3);

    // Verify DB insert
    const savedReading = await Reading.findOne({ deviceId: 'tank-01' });
    expect(savedReading).not.toBeNull();
    expect(savedReading?.waterLevel).toBe(76);
    expect(savedReading?.flowRate).toBe(2.3);
  });

  // 2. Duplicate payload -> 202
  it('should return 202 Accepted when duplicate reading is received', async () => {
    const timestamp = '2026-03-31T12:00:00.000Z';
    const payload = {
      deviceId: 'tank-01',
      waterLevel: 76,
      flowRate: 2.3,
      timestamp,
    };

    // First ingestion
    const firstRes = await request(app)
      .post('/api/v1/ingest')
      .set('X-Device-Key', validApiKey)
      .send(payload);

    expect(firstRes.status).toBe(201);

    // Second ingestion with identical deviceId and timestamp
    const duplicateRes = await request(app)
      .post('/api/v1/ingest')
      .set('X-Device-Key', validApiKey)
      .send(payload);

    expect(duplicateRes.status).toBe(202);
    expect(duplicateRes.body.status).toBe('accepted');
    expect(duplicateRes.body.message).toMatch(/duplicate/i);

    // Ensure only one reading exists in database
    const count = await Reading.countDocuments({ deviceId: 'tank-01' });
    expect(count).toBe(1);
  });

  // 3. Missing field (flowRate) -> 422
  it('should reject payload missing required field flowRate with 422', async () => {
    const payload = {
      deviceId: 'tank-01',
      waterLevel: 76,
      timestamp: new Date().toISOString(),
    };

    const res = await request(app)
      .post('/api/v1/ingest')
      .set('X-Device-Key', validApiKey)
      .send(payload);

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('UnprocessableEntity');
    expect(res.body.details).toBeDefined();
  });

  // 4. Wrong/missing key -> 401
  it('should reject request missing X-Device-Key header with 401', async () => {
    const payload = {
      deviceId: 'tank-01',
      waterLevel: 76,
      flowRate: 2.3,
      timestamp: new Date().toISOString(),
    };

    const res = await request(app).post('/api/v1/ingest').send(payload);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('should reject request with wrong X-Device-Key with 401', async () => {
    const payload = {
      deviceId: 'tank-01',
      waterLevel: 76,
      flowRate: 2.3,
      timestamp: new Date().toISOString(),
    };

    const res = await request(app)
      .post('/api/v1/ingest')
      .set('X-Device-Key', 'invalid-bogus-key')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  // 5. Unknown deviceId -> 404
  it('should return 404 when target device does not exist', async () => {
    const payload = {
      deviceId: 'non-existent-device',
      waterLevel: 76,
      flowRate: 2.3,
      timestamp: new Date().toISOString(),
    };

    const res = await request(app)
      .post('/api/v1/ingest')
      .set('X-Device-Key', validApiKey)
      .send(payload);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NotFound');
  });
});
