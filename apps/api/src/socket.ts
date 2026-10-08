import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from './config';
import { logger } from './server';

export function initSocketServer(httpServer: HttpServer): Server {
  const rawCorsOrigin = config.CORS_ORIGIN || '*';
  const corsOrigin =
    rawCorsOrigin === '*'
      ? '*'
      : rawCorsOrigin.includes(',')
        ? rawCorsOrigin.split(',').map((s) => s.trim())
        : rawCorsOrigin;

  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id }, 'Socket.IO client connected');

    // Automatically join default broadcast room for all tanks
    socket.join('tank:all');

    // Subscribe to a specific device/tank room
    socket.on('subscribe', (data: { deviceId?: string }) => {
      if (data?.deviceId) {
        socket.join(`tank:${data.deviceId}`);
        logger.debug({ socketId: socket.id, deviceId: data.deviceId }, 'Joined tank room');
      }
    });

    // Unsubscribe from a specific device/tank room
    socket.on('unsubscribe', (data: { deviceId?: string }) => {
      if (data?.deviceId) {
        socket.leave(`tank:${data.deviceId}`);
        logger.debug({ socketId: socket.id, deviceId: data.deviceId }, 'Left tank room');
      }
    });

    socket.on('disconnect', (reason) => {
      logger.info({ socketId: socket.id, reason }, 'Socket.IO client disconnected');
    });
  });

  return io;
}
