import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Device, IDevice } from '../models/Device';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Locals {
      device?: IDevice;
    }
  }
}

export async function deviceAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const rawKey = req.header('X-Device-Key');

  if (!rawKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing X-Device-Key header',
    });
    return;
  }

  try {
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
    const device = await Device.findOne({ apiKeyHash: hashedKey });

    if (!device) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid device credentials',
      });
      return;
    }

    res.locals.device = device;
    next();
  } catch (err) {
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to authenticate device',
    });
  }
}
