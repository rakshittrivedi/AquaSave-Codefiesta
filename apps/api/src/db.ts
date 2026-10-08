import mongoose from 'mongoose';
import { config } from './config';
import { logger } from './server';

export async function connectDB(): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI);
    logger.info('MongoDB connected');
    return conn;
  } catch (err) {
    logger.error({ err }, 'MongoDB connection error');
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected cleanly');
  } catch (err) {
    logger.error({ err }, 'Error during MongoDB disconnection');
  }
}
