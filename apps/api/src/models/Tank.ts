import mongoose, { Schema, Document } from 'mongoose';

export type TankStatus = 'normal' | 'low' | 'critical' | 'offline';

export interface ITankAnalytics {
  rollingRateLph: number;
  hoursToEmpty: number | null;
  leakageFlag: boolean;
  leakageFlagReason: string | null;
  totalHarvestedLiters: number;
  estimatedSavingsUsd: number;
  co2SavedKg: number;
}

export interface ITankThresholds {
  lowPercent: number;
  criticalPercent: number;
}

export interface ITank extends Document {
  tankId: string;
  name: string;
  capacityLiters: number;
  location: string;
  currentWaterLevel: number;
  currentFlowRate: number;
  status: TankStatus;
  isOnline: boolean;
  lastSeenAt: Date;
  thresholds: ITankThresholds;
  analytics: ITankAnalytics;
  forecast: {
    hourly: Array<{
      time: string;
      precipitation: number;
    }>;
    lastPolledAt: string;
    hasIncomingRain: boolean;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const TankSchema = new Schema<ITank>(
  {
    tankId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    capacityLiters: { type: Number, required: true },
    location: { type: String, required: true },
    currentWaterLevel: { type: Number, default: 50 },
    currentFlowRate: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['normal', 'low', 'critical', 'offline'],
      default: 'normal',
    },
    isOnline: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
    thresholds: {
      lowPercent: { type: Number, default: 20 },
      criticalPercent: { type: Number, default: 10 },
    },
    analytics: {
      rollingRateLph: { type: Number, default: 0 },
      hoursToEmpty: { type: Number, default: null },
      leakageFlag: { type: Boolean, default: false },
      leakageFlagReason: { type: String, default: null },
      totalHarvestedLiters: { type: Number, default: 0 },
      estimatedSavingsUsd: { type: Number, default: 0 },
      co2SavedKg: { type: Number, default: 0 },
    },
    forecast: { type: Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  }
);

export const Tank = mongoose.model<ITank>('Tank', TankSchema);
