import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import { deviceAuth } from '../middleware/deviceAuth';
import { ingestSchema } from '../schemas/ingestSchema';
import { Reading, Device, Tank, Alert, TankStatus } from '../models';

const router = Router();

router.post('/', deviceAuth, async (req: Request, res: Response): Promise<void> => {
  // 1. Zod Validation
  const parseResult = ingestSchema.safeParse(req.body);
  if (!parseResult.success) {
    res.status(422).json({
      error: 'UnprocessableEntity',
      message: 'Validation failed',
      details: parseResult.error.issues,
    });
    return;
  }

  const { deviceId, waterLevel, flowRate, timestamp } = parseResult.data;
  const readingDate = new Date(timestamp);

  // 2. Device Existence Check
  const authenticatedDevice = res.locals.device;
  const targetDevice = await Device.findOne({ deviceId });

  if (!targetDevice) {
    res.status(404).json({
      error: 'NotFound',
      message: `Device with id '${deviceId}' not found`,
    });
    return;
  }

  // Ensure key belongs to this device
  if (authenticatedDevice && authenticatedDevice.deviceId !== deviceId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key does not match payload deviceId',
    });
    return;
  }

  // 3. Deduplication Check (Idempotency)
  const existingReading = await Reading.findOne({
    deviceId,
    timestamp: readingDate,
  });

  if (existingReading) {
    res.status(202).json({
      status: 'accepted',
      message: 'Duplicate reading already ingested',
      readingId: existingReading._id,
    });
    return;
  }

  // 4. Out-of-order check (historical or delayed packet)
  const isOutOfOrder =
    targetDevice.lastTimestamp !== null &&
    readingDate.getTime() < targetDevice.lastTimestamp.getTime();

  // 5. Insert Reading
  const reading = await Reading.create({
    deviceId,
    tankId: targetDevice.tankId,
    waterLevel,
    flowRate,
    timestamp: readingDate,
  });

  // 6. Update Device Tracking
  targetDevice.lastSeenAt = new Date();
  if (!isOutOfOrder) {
    targetDevice.lastTimestamp = readingDate;
  }
  targetDevice.isOnline = true;
  await targetDevice.save();

  // 7. Update Tank Telemetry & Status
  const tank = await Tank.findOne({ tankId: targetDevice.tankId });
  if (tank) {
    tank.currentWaterLevel = waterLevel;
    tank.currentFlowRate = flowRate;
    tank.isOnline = true;
    tank.lastSeenAt = new Date();

    let newStatus: TankStatus = 'normal';
    if (waterLevel <= tank.thresholds.criticalPercent) {
      newStatus = 'critical';
    } else if (waterLevel <= tank.thresholds.lowPercent) {
      newStatus = 'low';
    }
    tank.status = newStatus;
    await tank.save();

    // Check threshold alert triggers
    if (newStatus === 'critical' || newStatus === 'low') {
      const alertType = newStatus === 'critical' ? 'CRITICAL_WATER' : 'LOW_WATER';
      const recentAlert = await Alert.findOne({
        tankId: tank.tankId,
        type: alertType,
        acknowledged: false,
        timestamp: { $gt: new Date(Date.now() - 5 * 60 * 1000) },
      });

      if (!recentAlert) {
        const createdAlert = await Alert.create({
          tankId: tank.tankId,
          deviceId,
          type: alertType,
          message: `Water level for ${tank.name} reached ${newStatus.toUpperCase()} state at ${waterLevel}%`,
          level: waterLevel,
          timestamp: new Date(),
          acknowledged: false,
        });

        const io: Server | undefined = req.app.get('io');
        if (io) {
          io.to('tank:all').emit('alert:new', createdAlert);
        }
      }
    }
  }

  // 8. Broadcast Realtime Socket.IO Events
  const io: Server | undefined = req.app.get('io');
  if (io) {
    const eventPayload = {
      deviceId,
      tankId: targetDevice.tankId,
      waterLevel,
      flowRate,
      timestamp: readingDate.toISOString(),
      status: tank ? tank.status : 'normal',
      isOnline: true,
    };
    io.to('tank:all').emit('reading:new', eventPayload);
    io.to(`tank:${deviceId}`).emit('reading:new', eventPayload);
  }

  res.status(201).json({
    status: 'created',
    readingId: reading._id,
    reading: {
      deviceId: reading.deviceId,
      tankId: reading.tankId,
      waterLevel: reading.waterLevel,
      flowRate: reading.flowRate,
      timestamp: reading.timestamp.toISOString(),
    },
  });
});

export default router;
