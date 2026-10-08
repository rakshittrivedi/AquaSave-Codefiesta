import mongoose, { Schema, Document } from 'mongoose';

export type AlertType = 'LOW_WATER' | 'CRITICAL_WATER' | 'LEAKAGE_SUSPECTED' | 'DEVICE_OFFLINE';

export interface IAlert extends Document {
  tankId: string;
  deviceId: string;
  type: AlertType;
  message: string;
  level: number;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedAt: Date | null;
  createdAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    tankId: { type: String, required: true, index: true },
    deviceId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ['LOW_WATER', 'CRITICAL_WATER', 'LEAKAGE_SUSPECTED', 'DEVICE_OFFLINE'],
      required: true,
    },
    message: { type: String, required: true },
    level: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    acknowledged: { type: Boolean, default: false, index: true },
    acknowledgedAt: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for querying alerts per tank in reverse chronological order
AlertSchema.index({ tankId: 1, timestamp: -1 });

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
