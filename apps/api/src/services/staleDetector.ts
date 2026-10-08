import { Server } from 'socket.io';
import { Device, Tank, Alert } from '../models';
import { config } from '../config';
import { logger } from '../server';

export async function checkStaleDevices(io?: Server): Promise<number> {
  const staleThresholdDate = new Date(Date.now() - config.STALE_THRESHOLD_MINUTES * 60 * 1000);

  try {
    const staleDevices = await Device.find({
      isOnline: true,
      lastSeenAt: { $lt: staleThresholdDate },
    });

    if (staleDevices.length === 0) {
      return 0;
    }

    logger.info(`Detected ${staleDevices.length} stale devices. Updating online status...`);

    for (const device of staleDevices) {
      device.isOnline = false;
      await device.save();

      const tank = await Tank.findOne({ tankId: device.tankId });
      if (tank) {
        tank.isOnline = false;
        tank.status = 'offline';
        await tank.save();

        // Check if a recent DEVICE_OFFLINE alert was already generated
        const existingAlert = await Alert.findOne({
          tankId: tank.tankId,
          type: 'DEVICE_OFFLINE',
          acknowledged: false,
          timestamp: { $gt: new Date(Date.now() - 15 * 60 * 1000) },
        });

        if (!existingAlert) {
          const alert = await Alert.create({
            tankId: tank.tankId,
            deviceId: device.deviceId,
            type: 'DEVICE_OFFLINE',
            message: `Telemetry heartbeat lost for device ${device.deviceId} (${tank.name})`,
            level: tank.currentWaterLevel,
            timestamp: new Date(),
            acknowledged: false,
          });

          if (io) {
            io.to('tank:all').emit('alert:new', alert);
          }
        }
      }

      if (io) {
        const offlinePayload = {
          deviceId: device.deviceId,
          tankId: device.tankId,
          isOnline: false,
          status: 'offline',
          lastSeenAt: device.lastSeenAt.toISOString(),
        };
        io.to('tank:all').emit('device:offline', offlinePayload);
        io.to(`tank:${device.deviceId}`).emit('device:offline', offlinePayload);
      }
    }

    return staleDevices.length;
  } catch (err) {
    logger.error({ err }, 'Error checking stale devices');
    return 0;
  }
}

export function startStaleDetector(
  getIO: () => Server | undefined,
  intervalMs = 60000
): NodeJS.Timeout {
  const timer = setInterval(() => {
    checkStaleDevices(getIO());
  }, intervalMs);

  return timer;
}
