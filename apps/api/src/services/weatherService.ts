import mongoose from 'mongoose';
import { Tank } from '../models/Tank';
import { logger } from '../server';

export interface ForecastHourlyPoint {
  time: string;
  precipitation: number;
}

export interface ForecastData {
  hourly: ForecastHourlyPoint[];
  lastPolledAt: string;
  hasIncomingRain: boolean;
}

let memoryCachedForecast: ForecastData | null = null;

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function getCachedForecast(): ForecastData | null {
  return memoryCachedForecast;
}

export function setMemoryCachedForecast(data: ForecastData | null): void {
  memoryCachedForecast = data;
}

/**
 * Fetches 24-hour hourly precipitation forecast from Open-Meteo.
 * On poll failure, falls back to the last cached forecast without throwing.
 */
export async function fetchOpenMeteoForecast(apiUrlOverride?: string): Promise<ForecastData> {
  const defaultLat = process.env.FACILITY_LAT || '28.6139';
  const defaultLon = process.env.FACILITY_LON || '77.2090';
  const url =
    apiUrlOverride ||
    process.env.OPEN_METEO_URL ||
    `https://api.open-meteo.com/v1/forecast?latitude=${defaultLat}&longitude=${defaultLon}&hourly=precipitation`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo returned HTTP ${res.status}`);
    }

    const data = (await res.json()) as {
      hourly?: {
        time?: string[];
        precipitation?: number[];
      };
    };

    if (!data?.hourly?.time || !data?.hourly?.precipitation) {
      throw new Error('Malformed Open-Meteo forecast response');
    }

    const now = new Date();
    const currentHourIsoPrefix = now.toISOString().slice(0, 13); // e.g. "2026-03-31T12"

    // Find the starting index matching current hour or first future hour
    let startIndex = data.hourly.time.findIndex((t) => t.startsWith(currentHourIsoPrefix));
    if (startIndex === -1) {
      startIndex = data.hourly.time.findIndex((t) => new Date(t).getTime() >= now.getTime());
    }
    if (startIndex === -1) {
      startIndex = 0;
    }

    // Slice 24 consecutive hours
    const slicedTimes = data.hourly.time.slice(startIndex, startIndex + 24);
    const slicedPrecip = data.hourly.precipitation.slice(startIndex, startIndex + 24);

    const hourlyPoints: ForecastHourlyPoint[] = slicedTimes.map((time, idx) => ({
      time,
      precipitation: Math.max(0, Math.round((slicedPrecip[idx] ?? 0) * 10) / 10),
    }));

    // Check if next 6 hours precipitation exceeds 5mm
    const next6HoursRain = hourlyPoints.slice(0, 6).reduce((sum, p) => sum + p.precipitation, 0);

    const forecastResult: ForecastData = {
      hourly: hourlyPoints,
      lastPolledAt: new Date().toISOString(),
      hasIncomingRain: next6HoursRain > 5.0,
    };

    // Update memory cache
    memoryCachedForecast = forecastResult;

    // Persist to all tanks in the database if connected
    if (mongoose.connection.readyState === 1) {
      try {
        await Tank.updateMany({}, { forecast: forecastResult });
      } catch (dbErr) {
        logger.warn({ err: dbErr }, 'Failed to persist forecast to MongoDB tanks collection');
      }
    }

    logger.info(
      { next6HoursRain, hasIncomingRain: forecastResult.hasIncomingRain },
      'Open-Meteo rain forecast successfully updated'
    );

    return forecastResult;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.warn(
      { err: errorMessage },
      'Open-Meteo poll failed, serving cached or fallback forecast'
    );

    if (memoryCachedForecast) {
      return memoryCachedForecast;
    }

    // Check if any tank has a previously stored forecast in DB
    const tankWithForecast = await Tank.findOne({ forecast: { $ne: null } }).lean();
    if (tankWithForecast?.forecast) {
      memoryCachedForecast = tankWithForecast.forecast as ForecastData;
      return memoryCachedForecast;
    }

    // Default safe synthetic forecast fallback
    const fallbackHourly: ForecastHourlyPoint[] = Array.from({ length: 24 }).map((_, i) => {
      const d = new Date(Date.now() + i * 3600 * 1000);
      return {
        time: d.toISOString(),
        precipitation: 0.0,
      };
    });

    const fallbackForecast: ForecastData = {
      hourly: fallbackHourly,
      lastPolledAt: new Date().toISOString(),
      hasIncomingRain: false,
    };

    memoryCachedForecast = fallbackForecast;
    return fallbackForecast;
  }
}

/**
 * Returns cached forecast if within 30 minutes TTL, otherwise fetches fresh data.
 */
export async function getOrFetchForecast(forceFresh = false): Promise<ForecastData> {
  if (!forceFresh && memoryCachedForecast) {
    const lastPolled = new Date(memoryCachedForecast.lastPolledAt).getTime();
    if (Date.now() - lastPolled < CACHE_TTL_MS) {
      return memoryCachedForecast;
    }
  }

  return fetchOpenMeteoForecast();
}

/**
 * Starts periodic 30-minute background poller.
 */
export function startForecastPoller(intervalMs = 30 * 60 * 1000): NodeJS.Timeout {
  // Trigger initial poll immediately
  getOrFetchForecast().catch((err) => {
    logger.warn({ err }, 'Initial forecast fetch encountered error');
  });

  const timer = setInterval(() => {
    getOrFetchForecast(true).catch((err) => {
      logger.warn({ err }, 'Periodic forecast fetch encountered error');
    });
  }, intervalMs);

  return timer;
}
