import mongoose, { Schema, Document } from 'mongoose';

export interface IReading extends Document {
  deviceId: string;
  tankId: string;
  waterLevel: number;
  flowRate: number;
  timestamp: Date;
  createdAt: Date;
}

const ReadingSchema = new Schema<IReading>(
  {
    deviceId: { type: String, required: true, index: true },
    tankId: { type: String, required: true, index: true },
    waterLevel: { type: Number, required: true, min: 0, max: 100 },
    flowRate: { type: Number, required: true, min: 0 },
    timestamp: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for querying latest device readings
ReadingSchema.index({ deviceId: 1, timestamp: -1 });

// Compound index for querying latest tank readings
ReadingSchema.index({ tankId: 1, timestamp: -1 });

// Unique compound index for deduplication and order check
ReadingSchema.index({ deviceId: 1, timestamp: 1 }, { unique: true });

// TTL index to automatically purge historical readings after 30 days (2,592,000 seconds)
ReadingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

export const Reading = mongoose.model<IReading>('Reading', ReadingSchema);
