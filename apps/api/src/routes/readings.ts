import { Router, Request, Response } from 'express';
import { Reading } from '../models/Reading';

const router = Router({ mergeParams: true });

// GET /api/v1/tanks/:id/readings?range=24h&limit=500
router.get('/:id/readings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const range = (req.query.range as string) || '24h';
    const limit = Math.min(500, parseInt((req.query.limit as string) || '500', 10));

    const now = Date.now();
    let durationMs = 24 * 60 * 60 * 1000; // default 24h

    switch (range.toLowerCase()) {
      case '1h':
        durationMs = 1 * 60 * 60 * 1000;
        break;
      case '6h':
        durationMs = 6 * 60 * 60 * 1000;
        break;
      case '24h':
        durationMs = 24 * 60 * 60 * 1000;
        break;
      case '7d':
        durationMs = 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        durationMs = 24 * 60 * 60 * 1000;
    }

    const cutoffDate = new Date(now - durationMs);

    // Query readings by tankId or deviceId using compound index
    const readings = await Reading.find({
      $or: [{ tankId: id }, { deviceId: id }],
      timestamp: { $gte: cutoffDate },
    })
      .sort({ timestamp: 1 })
      .limit(limit)
      .lean();

    const formattedReadings = readings.map((r) => ({
      _id: r._id,
      deviceId: r.deviceId,
      tankId: r.tankId,
      waterLevel: r.waterLevel,
      flowRate: r.flowRate,
      timestamp: new Date(r.timestamp).toISOString(),
    }));

    res.status(200).json({
      tankId: id,
      range,
      count: formattedReadings.length,
      readings: formattedReadings,
    });
  } catch (err) {
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve historical readings',
    });
  }
});

export default router;
