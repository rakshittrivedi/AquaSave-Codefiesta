export interface SimpleReading {
  flowRate: number;
  timestamp: Date | string;
}

/**
 * Computes the rolling consumption rate in Liters per hour (L/hr)
 * using trapezoidal flow integration over the provided readings.
 * Flow rates in readings are in L/min.
 */
export function computeRollingRate(readings: SimpleReading[]): number {
  if (!readings || readings.length === 0) {
    return 0;
  }

  if (readings.length === 1) {
    const singleRate = readings[0].flowRate;
    if (isNaN(singleRate) || singleRate <= 0) return 0;
    return Math.round(singleRate * 60 * 10) / 10;
  }

  // Sort chronologically ascending
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let totalVolumeLiters = 0;
  const startTime = new Date(sorted[0].timestamp).getTime();
  const endTime = new Date(sorted[sorted.length - 1].timestamp).getTime();
  const totalDurationHours = (endTime - startTime) / (1000 * 60 * 60);

  for (let i = 0; i < sorted.length - 1; i++) {
    const tCurrent = new Date(sorted[i].timestamp).getTime();
    const tNext = new Date(sorted[i + 1].timestamp).getTime();
    const dtMinutes = Math.max(0, (tNext - tCurrent) / (1000 * 60));

    const flowA = Math.max(0, sorted[i].flowRate || 0);
    const flowB = Math.max(0, sorted[i + 1].flowRate || 0);

    // Trapezoidal volume: average flow rate (L/min) * elapsed minutes
    const segmentVolume = ((flowA + flowB) / 2) * dtMinutes;
    totalVolumeLiters += segmentVolume;
  }

  // If time delta is too small or invalid, fallback to arithmetic average of instantaneous flow
  if (totalDurationHours <= 0 || !isFinite(totalDurationHours)) {
    const avgFlowLpm =
      sorted.reduce((acc, r) => acc + Math.max(0, r.flowRate || 0), 0) / sorted.length;
    return Math.round(avgFlowLpm * 60 * 10) / 10;
  }

  const rateLph = totalVolumeLiters / totalDurationHours;
  if (!isFinite(rateLph) || isNaN(rateLph) || rateLph <= 0) {
    return 0;
  }

  return Math.round(rateLph * 10) / 10;
}

/**
 * Computes estimated hours until the tank is empty based on current volume and consumption rate.
 * Returns null if rate <= 0 (zero flow, filling, or idle) to avoid Infinity/NaN.
 */
export function computeDepletionHours(
  currentVolumeLiters: number,
  consumptionRateLph: number
): number | null {
  if (consumptionRateLph <= 0 || !isFinite(consumptionRateLph) || isNaN(consumptionRateLph)) {
    return null;
  }

  if (currentVolumeLiters <= 0) {
    return 0;
  }

  const hours = currentVolumeLiters / consumptionRateLph;
  if (!isFinite(hours) || isNaN(hours) || hours < 0) {
    return null;
  }

  return Math.round(hours * 10) / 10;
}

export interface LeakageReading {
  flowRate: number;
  waterLevel: number;
  timestamp: Date | string;
}

export interface LeakageResult {
  isLeak: boolean;
  reason: string | null;
}

/**
 * Detects potential plumbing or cistern leaks using rule-based telemetry evaluation:
 * - Rule 1: Continuous discharge flow while tank water level remains static/negligible delta.
 * - Rule 2: Continuous uninterrupted flow without any idle resting interval over the sample window.
 */
export function detectLeakage(
  latestReading: LeakageReading,
  recentReadings: LeakageReading[],
  currentlyFlagged: boolean = false
): LeakageResult {
  if (!recentReadings || recentReadings.length < 6) {
    return {
      isLeak: currentlyFlagged,
      reason: currentlyFlagged ? 'Under sustained observation' : null,
    };
  }

  // Sort chronological ascending
  const sorted = [...recentReadings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const sampleCount = sorted.length;
  const initialLevel = sorted[0].waterLevel;
  const latestLevel = sorted[sampleCount - 1].waterLevel;
  const levelDrop = initialLevel - latestLevel;

  // Check if every reading has active positive flow
  const allFlowing = sorted.every((r) => (r.flowRate || 0) >= 0.4);
  const avgFlow = sorted.reduce((sum, r) => sum + Math.max(0, r.flowRate || 0), 0) / sampleCount;

  // Check for idle periods: any reading with zero or near-zero flow indicates normal usage
  const hasIdlePeriod = sorted.some((r) => (r.flowRate || 0) < 0.2);

  // If currently flagged, normal operation with resting periods clears the flag
  if (currentlyFlagged) {
    if (hasIdlePeriod || avgFlow < 0.3) {
      return { isLeak: false, reason: null };
    }
    return {
      isLeak: true,
      reason: 'Continuous uninterrupted flow without normal resting interval',
    };
  }

  // Rule 1: Continuous positive flow while water level delta is static or negligible
  if (allFlowing && avgFlow >= 0.8 && Math.abs(levelDrop) < 0.3) {
    return {
      isLeak: true,
      reason: 'Active discharge flow detected while reservoir water level remains unchanged',
    };
  }

  // Rule 2: Uninterrupted continuous flow across all samples without any idle resting interval
  if (sampleCount >= 8 && allFlowing && !hasIdlePeriod) {
    return {
      isLeak: true,
      reason: 'Continuous uninterrupted draw detected over consecutive telemetry cycles',
    };
  }

  return { isLeak: false, reason: null };
}
