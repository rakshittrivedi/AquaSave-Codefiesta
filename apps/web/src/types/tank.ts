export type TankStatus = 'normal' | 'low' | 'critical' | 'offline';

export interface TankThresholds {
  lowPercent: number;
  criticalPercent: number;
}

export interface TankAnalytics {
  rollingRateLph: number;
  hoursToEmpty: number | null;
  leakageFlag: boolean;
  leakageFlagReason: string | null;
  totalHarvestedLiters: number;
  estimatedSavingsUsd: number;
  co2SavedKg: number;
}

export interface Tank {
  tankId: string;
  name: string;
  capacityLiters: number;
  location: string;
  currentWaterLevel: number;
  currentFlowRate: number;
  status: TankStatus;
  isOnline: boolean;
  lastSeenAt: string;
  thresholds: TankThresholds;
  analytics: TankAnalytics;
  forecast?: {
    hourly: Array<{
      time: string;
      precipitation: number;
    }>;
    lastPolledAt: string;
    hasIncomingRain: boolean;
  } | null;
}

export interface ReadingEvent {
  deviceId: string;
  tankId: string;
  waterLevel: number;
  flowRate: number;
  timestamp: string;
  status: TankStatus;
  isOnline: boolean;
}

export interface OfflineEvent {
  deviceId: string;
  tankId: string;
  isOnline: boolean;
  status: 'offline';
  lastSeenAt: string;
}

export interface AlertEvent {
  _id: string;
  tankId: string;
  deviceId: string;
  type: 'LOW_WATER' | 'CRITICAL_WATER' | 'LEAKAGE_SUSPECTED' | 'DEVICE_OFFLINE';
  message: string;
  level: number;
  timestamp: string;
  acknowledged: boolean;
}
