import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import crypto from 'crypto';
import app from '../server';
import { User, Tank, Device } from '../models';
import { ensureAdminUser } from '../routes/auth';

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

describe('Authentication: JWT Login & Protected REST Endpoints', () => {
  let mongoServer: MongoMemoryServer;
  const devApiKey = 'aq_key_tank-01_local_dev';
  const hashedDevKey = hashKey(devApiKey);

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
    await User.deleteMany({});
    await Tank.deleteMany({});
    await Device.deleteMany({});

    // Seed default admin user
    await ensureAdminUser();

    // Seed tank & device
    await Tank.create({
      tankId: 'tank-01',
      name: 'Main Cistern',
      capacityLiters: 10000,
      location: 'Building A Roof',
      currentWaterLevel: 80,
      currentFlowRate: 1.5,
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

  it('rejects unauthenticated requests to GET /api/v1/tanks with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/tanks');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('rejects requests with invalid token with 401 Unauthorized', async () => {
    const res = await request(app)
      .get('/api/v1/tanks')
      .set('Authorization', 'Bearer invalid_bogus_jwt_token_123');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      username: 'admin',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('authenticates valid credentials and issues 8-hour JWT token', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({
      username: 'admin',
      password: 'aquasave2026!',
    });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('admin');
    expect(res.body.user.role).toBe('admin');

    // Use returned token to access protected endpoint
    const protectedRes = await request(app)
      .get('/api/v1/tanks')
      .set('Authorization', `Bearer ${res.body.token}`);

    expect(protectedRes.status).toBe(200);
    expect(Array.isArray(protectedRes.body)).toBe(true);
    expect(protectedRes.body.length).toBe(1);
    expect(protectedRes.body[0].tankId).toBe('tank-01');
  });

  it('ensures POST /api/v1/ingest remains device-key-only without needing JWT', async () => {
    const payload = {
      deviceId: 'tank-01',
      waterLevel: 81.0,
      flowRate: 2.0,
      timestamp: new Date().toISOString(),
    };

    const res = await request(app)
      .post('/api/v1/ingest')
      .set('X-Device-Key', devApiKey)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('created');
  });
});
