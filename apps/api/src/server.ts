import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { config } from './config';
import { connectDB, disconnectDB } from './db';

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

let serverInstance: ReturnType<typeof app.listen> | null = null;

if (config.NODE_ENV !== 'test') {
  connectDB().then(() => {
    serverInstance = app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
    });
  });

  const handleShutdown = async (signal: string) => {
    logger.info(`Received ${signal}, initiating graceful shutdown...`);
    if (serverInstance) {
      serverInstance.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDB();
        process.exit(0);
      });
    } else {
      await disconnectDB();
      process.exit(0);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

export default app;
