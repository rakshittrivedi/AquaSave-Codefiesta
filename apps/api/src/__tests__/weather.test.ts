import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  fetchOpenMeteoForecast,
  getOrFetchForecast,
  setMemoryCachedForecast,
} from '../services/weatherService';

describe('Weather Service: Open-Meteo Forecast Poller & Resilient Cache', () => {
  beforeEach(() => {
    setMemoryCachedForecast(null);
    vi.restoreAllMocks();
  });

  it('fetches 24-hour precipitation and computes incoming rain flag (> 5mm)', async () => {
    // Generate synthetic 48-hour Open-Meteo response
    const syntheticTimes = Array.from({ length: 48 }).map((_, i) => {
      const d = new Date(Date.now() + i * 3600 * 1000);
      return d.toISOString();
    });

    // Precipitation with heavy rain in first 3 hours (> 5mm total)
    const syntheticPrecip = Array.from({ length: 48 }).map((_, i) => (i < 3 ? 3.0 : 0.0));

    const mockResponse = {
      hourly: {
        time: syntheticTimes,
        precipitation: syntheticPrecip,
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const forecast = await fetchOpenMeteoForecast('https://api.open-meteo.test/v1/forecast');

    expect(forecast).toBeDefined();
    expect(forecast.hourly.length).toBe(24);
    expect(forecast.hasIncomingRain).toBe(true);
    expect(forecast.lastPolledAt).toBeDefined();
  });

  it('computes hasIncomingRain = false when precipitation <= 5mm', async () => {
    const syntheticTimes = Array.from({ length: 48 }).map((_, i) => {
      const d = new Date(Date.now() + i * 3600 * 1000);
      return d.toISOString();
    });

    const syntheticPrecip = Array.from({ length: 48 }).map(() => 0.1);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        hourly: {
          time: syntheticTimes,
          precipitation: syntheticPrecip,
        },
      }),
    } as Response);

    const forecast = await fetchOpenMeteoForecast('https://api.open-meteo.test/v1/forecast');
    expect(forecast.hasIncomingRain).toBe(false);
  });

  it('serves memory cache without calling fetch when fresh', async () => {
    const cachedData = {
      hourly: Array.from({ length: 24 }).map((_, i) => ({
        time: new Date(Date.now() + i * 3600 * 1000).toISOString(),
        precipitation: 0.0,
      })),
      lastPolledAt: new Date().toISOString(), // very fresh
      hasIncomingRain: false,
    };

    setMemoryCachedForecast(cachedData);

    const fetchSpy = vi.fn();
    global.fetch = fetchSpy;

    const result = await getOrFetchForecast(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(result.lastPolledAt).toBe(cachedData.lastPolledAt);
  });

  it('falls back to last cached forecast when Open-Meteo URL is deliberately invalid', async () => {
    const previouslyCached = {
      hourly: Array.from({ length: 24 }).map((_, i) => ({
        time: new Date(Date.now() + i * 3600 * 1000).toISOString(),
        precipitation: 1.5,
      })),
      lastPolledAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      hasIncomingRain: true,
    };

    setMemoryCachedForecast(previouslyCached);

    // Mock fetch rejection (network failure or invalid URL)
    global.fetch = vi.fn().mockRejectedValue(new Error('DNS Resolution Failed'));

    const result = await fetchOpenMeteoForecast('https://invalid-nonexistent-domain.xyz');

    expect(result).toBeDefined();
    expect(result.hourly.length).toBe(24);
    expect(result.hasIncomingRain).toBe(true);
  });
});
