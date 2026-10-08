import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z
    .string()
    .default('3001')
    .transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  CORS_ORIGIN: z.string().default('*'),
  LOG_LEVEL: z.string().default('info'),
  STALE_THRESHOLD_MINUTES: z
    .string()
    .default('5')
    .transform((val) => parseInt(val, 10)),
  JWT_SECRET: z.string().default('aquasave_jwt_secret_dev_key_2026'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // In test environment, provide a fallback MONGODB_URI if not supplied
  if (process.env.NODE_ENV === 'test') {
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aquasave_test';
  } else {
    console.error('Invalid environment configuration:', parsedEnv.error.format());
    process.exit(1);
  }
}

export const config = parsedEnv.success
  ? parsedEnv.data
  : envSchema.parse({
      ...process.env,
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/aquasave_test',
    });
