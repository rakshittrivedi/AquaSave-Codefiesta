import { z } from 'zod';

export const ingestSchema = z.object({
  deviceId: z
    .string({
      required_error: 'deviceId is required',
      invalid_type_error: 'deviceId must be a string',
    })
    .min(1, 'deviceId cannot be empty'),
  waterLevel: z
    .number({
      required_error: 'waterLevel is required',
      invalid_type_error: 'waterLevel must be a number',
    })
    .min(0, 'waterLevel cannot be negative')
    .max(100, 'waterLevel cannot exceed 100'),
  flowRate: z
    .number({
      required_error: 'flowRate is required',
      invalid_type_error: 'flowRate must be a number',
    })
    .min(0, 'flowRate cannot be negative'),
  timestamp: z
    .string({
      required_error: 'timestamp is required',
      invalid_type_error: 'timestamp must be an ISO-8601 date string',
    })
    .datetime({ message: 'timestamp must be a valid ISO-8601 date string' }),
});

export type IngestPayload = z.infer<typeof ingestSchema>;
