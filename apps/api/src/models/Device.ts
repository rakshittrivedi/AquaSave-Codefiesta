import mongoose, { Schema, Document } from 'mongoose';

export interface IDevice extends Document {
  deviceId: string;
  tankId: string;
  apiKeyHash: string;
  isOnline: boolean;
  lastSeenAt: Date;
  lastTimestamp: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    tankId: { type: String, required: true, index: true },
    apiKeyHash: { type: String, required: true, index: true },
    isOnline: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: Date.now },
    lastTimestamp: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

export const Device = mongoose.model<IDevice>('Device', DeviceSchema);
