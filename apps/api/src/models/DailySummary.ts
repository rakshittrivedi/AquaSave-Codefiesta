import mongoose, { Schema, Document } from 'mongoose';

export interface IDailySummary extends Document {
  tankId: string;
  deviceId: string;
  date: string; // YYYY-MM-DD
  consumedLiters: number;
  harvestedLiters: number;
  avgWaterLevel: number;
  minWaterLevel: number;
  maxWaterLevel: number;
  timestamp: Date;
  createdAt: Date;
}

const DailySummarySchema = new Schema<IDailySummary>(
  {
    tankId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    date: { type: String, required: true },
    consumedLiters: { type: Number, default: 0 },
    harvestedLiters: { type: Number, default: 0 },
    avgWaterLevel: { type: Number, default: 0 },
    minWaterLevel: { type: Number, default: 0 },
    maxWaterLevel: { type: Number, default: 0 },
    timestamp: { type: Date, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound unique index for tankId and date
DailySummarySchema.index({ tankId: 1, date: 1 }, { unique: true });

// TTL index to automatically purge daily summaries after 365 days (31,536,000 seconds)
DailySummarySchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

export const DailySummary = mongoose.model<IDailySummary>('DailySummary', DailySummarySchema);
