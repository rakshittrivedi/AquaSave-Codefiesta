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
