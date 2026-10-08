import http from 'http';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from './config';
import { connectDB, disconnectDB } from './db';
import ingestRouter from './routes/ingest';
import { startStaleDetector } from './services/staleDetector';
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

app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN || '*',
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

app.use('/api/v1/ingest', ingestRouter);

const httpServer = http.createServer(app);
const io = initSocketServer(httpServer);
app.set('io', io);

let staleTimer: NodeJS.Timeout | null = null;

if (config.NODE_ENV !== 'test') {
  connectDB().then(() => {
    httpServer.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT} with Socket.IO enabled`);
    });

    staleTimer = startStaleDetector(() => app.get('io'), 60000);
  });

  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, initiating graceful shutdown...`);
    if (staleTimer) {
      clearInterval(staleTimer);
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
