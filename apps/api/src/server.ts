import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from './config';
import { connectDB, disconnectDB } from './db';
import ingestRouter from './routes/ingest';
import tanksRouter from './routes/tanks';
import readingsRouter from './routes/readings';
import analyticsRouter from './routes/analytics';
import alertsRouter from './routes/alerts';
import authRouter, { ensureAdminUser } from './routes/auth';
import { authMiddleware } from './middleware/auth';
import { startStaleDetector } from './services/staleDetector';
import { startForecastPoller } from './services/weatherService';
import { initSocketServer } from './socket';

export const logger = pino({
  level: config.LOG_LEVEL || 'info',
  transport:
    config.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        }
      : undefined,
});

const app = express();

const rawCorsOrigin = config.CORS_ORIGIN || '*';
const corsOrigin =
  rawCorsOrigin === '*'
    ? '*'
    : rawCorsOrigin.includes(',')
      ? rawCorsOrigin.split(',').map((s) => s.trim())
      : rawCorsOrigin;

app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json());
app.use(
  pinoHttp({
    autoLogging: {
      ignore: (req) => req.url === '/api/v1/health',
    },
  })
);

app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/ingest', ingestRouter);
app.use('/api/v1/tanks', authMiddleware, tanksRouter);
app.use('/api/v1/tanks', authMiddleware, readingsRouter);
app.use('/api/v1/tanks', authMiddleware, analyticsRouter);
app.use('/api/v1/alerts', authMiddleware, alertsRouter);

const httpServer = http.createServer(app);
const io = initSocketServer(httpServer);
app.set('io', io);

let staleTimer: NodeJS.Timeout | null = null;
let forecastTimer: NodeJS.Timeout | null = null;

if (config.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    await ensureAdminUser();
    httpServer.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT} with Socket.IO enabled`);
    });

    staleTimer = startStaleDetector(() => app.get('io'), 60000);
    forecastTimer = startForecastPoller();
  });

  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, initiating graceful shutdown...`);
    if (staleTimer) {
      clearInterval(staleTimer);
    }
    if (forecastTimer) {
      clearInterval(forecastTimer);
    }
    io.close(() => {
      logger.info('Socket.IO connections closed');
    });
    httpServer.close(async () => {
      logger.info('HTTP server closed');
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

export { httpServer, io };
export default app;
