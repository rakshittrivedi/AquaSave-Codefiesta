import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import { Alert } from '../models/Alert';

const router = Router();

// GET /api/v1/alerts?limit=20
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = Math.min(100, parseInt((req.query.limit as string) || '20', 10));
    const tankId = req.query.tankId as string | undefined;

    const query: Record<string, unknown> = {};
    if (tankId) {
      query.tankId = tankId;
    }

    const alerts = await Alert.find(query).sort({ timestamp: -1 }).limit(limit).lean();

    res.status(200).json(alerts);
  } catch (err) {
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve alerts',
    });
  }
});

// POST /api/v1/alerts/:id/acknowledge
router.post('/:id/acknowledge', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const alert = await Alert.findById(id);

    if (!alert) {
      res.status(404).json({
        error: 'NotFound',
        message: `Alert with id '${id}' not found`,
      });
      return;
    }

    alert.acknowledged = true;
    alert.acknowledgedAt = new Date();
    await alert.save();

    // Broadcast update over Socket.IO if available
    const io: Server | undefined = req.app.get('io');
    if (io) {
      io.to('tank:all').emit('alert:acknowledged', {
        alertId: alert._id,
        acknowledged: true,
        acknowledgedAt: alert.acknowledgedAt,
      });
    }

    res.status(200).json({
      status: 'ok',
      message: 'Alert acknowledged successfully',
      alert,
    });
  } catch (err) {
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to acknowledge alert',
    });
  }
});

export default router;
