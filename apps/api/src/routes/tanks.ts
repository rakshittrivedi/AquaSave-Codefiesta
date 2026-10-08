import { Router, Request, Response } from 'express';
import { Tank } from '../models';
import { getCachedForecast } from '../services/weatherService';

const router = Router();

// GET /api/v1/tanks - Get all tanks with current telemetry, status, and analytics
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const tanks = await Tank.find().sort({ tankId: 1 }).lean();

    const formattedTanks = tanks.map((tank) => ({
      tankId: tank.tankId,
      name: tank.name,
      capacityLiters: tank.capacityLiters,
      location: tank.location,
      currentWaterLevel: tank.currentWaterLevel,
      waterLevel: tank.currentWaterLevel,
      currentFlowRate: tank.currentFlowRate,
      flowRate: tank.currentFlowRate,
      status: tank.status,
      isOnline: tank.isOnline,
      lastSeenAt: tank.lastSeenAt
        ? new Date(tank.lastSeenAt).toISOString()
        : new Date().toISOString(),
      thresholds: tank.thresholds,
      analytics: tank.analytics,
      forecast: tank.forecast || getCachedForecast(),
      createdAt: tank.createdAt,
      updatedAt: tank.updatedAt,
    }));

    res.status(200).json(formattedTanks);
  } catch (err) {
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve tanks',
    });
  }
});

// GET /api/v1/tanks/:id - Get single tank detail by tankId
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const tank = await Tank.findOne({ tankId: id }).lean();

    if (!tank) {
      res.status(404).json({
        error: 'NotFound',
        message: `Tank with id '${id}' not found`,
      });
      return;
    }

    res.status(200).json({
      tankId: tank.tankId,
      name: tank.name,
      capacityLiters: tank.capacityLiters,
      location: tank.location,
      currentWaterLevel: tank.currentWaterLevel,
      waterLevel: tank.currentWaterLevel,
      currentFlowRate: tank.currentFlowRate,
      flowRate: tank.currentFlowRate,
      status: tank.status,
      isOnline: tank.isOnline,
      lastSeenAt: tank.lastSeenAt
        ? new Date(tank.lastSeenAt).toISOString()
        : new Date().toISOString(),
      thresholds: tank.thresholds,
      analytics: tank.analytics,
      forecast: tank.forecast || getCachedForecast(),
      createdAt: tank.createdAt,
      updatedAt: tank.updatedAt,
    });
  } catch (err) {
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to retrieve tank details',
    });
  }
});

export default router;
