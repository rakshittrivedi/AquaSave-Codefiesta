import { describe, it, expect } from 'vitest';
import {
  computeRollingRate,
  computeDepletionHours,
  detectLeakage,
  updateSavingsMetrics,
} from '../services/analyticsService';

describe('Analytics Service: Rolling Rate & Depletion Hours', () => {
  describe('computeRollingRate (Trapezoidal Integration)', () => {
    it('returns 0 for empty readings array', () => {
      expect(computeRollingRate([])).toBe(0);
    });

    it('returns flowRate * 60 for single reading', () => {
      const now = new Date();
      expect(computeRollingRate([{ flowRate: 2.0, timestamp: now }])).toBe(120);
      expect(computeRollingRate([{ flowRate: 0, timestamp: now }])).toBe(0);
    });

    it('computes accurate trapezoidal rolling rate across time points', () => {
      // 3 readings spaced by 10 minutes (0 min, 10 min, 20 min)
      // Flows: 2.0 L/min, 3.0 L/min, 4.0 L/min
      // Segment 1 (0-10m): avg flow = 2.5 L/min * 10m = 25 Liters
      // Segment 2 (10-20m): avg flow = 3.5 L/min * 10m = 35 Liters
      // Total volume: 60 Liters in 20 minutes (1/3 hour)
      // Rate = 60 / (1/3) = 180 L/hr
      const t0 = new Date('2026-03-31T10:00:00.000Z');
      const t1 = new Date('2026-03-31T10:10:00.000Z');
      const t2 = new Date('2026-03-31T10:20:00.000Z');

      const readings = [
        { flowRate: 2.0, timestamp: t0 },
        { flowRate: 3.0, timestamp: t1 },
        { flowRate: 4.0, timestamp: t2 },
      ];

      expect(computeRollingRate(readings)).toBe(180);
    });

    it('handles zero or negative flow cleanly without negative rates', () => {
      const t0 = new Date('2026-03-31T10:00:00.000Z');
      const t1 = new Date('2026-03-31T10:10:00.000Z');
      const readings = [
        { flowRate: 0, timestamp: t0 },
        { flowRate: 0, timestamp: t1 },
      ];
      expect(computeRollingRate(readings)).toBe(0);
    });
  });

  describe('computeDepletionHours', () => {
    it('returns positive finite hours for steady consumption', () => {
      // 10,000 Liters at 50% = 5,000 Liters volume
      // 200 L/hr consumption
      // 5,000 / 200 = 25 hours
      const hours = computeDepletionHours(5000, 200);
      expect(hours).toBe(25);
    });

    it('returns null for zero flow (guards against Infinity/NaN)', () => {
      expect(computeDepletionHours(5000, 0)).toBeNull();
    });

    it('returns null for negative flow (filling/recharge)', () => {
      expect(computeDepletionHours(5000, -10)).toBeNull();
    });

    it('returns 0 if volume is 0 or negative', () => {
      expect(computeDepletionHours(0, 150)).toBe(0);
      expect(computeDepletionHours(-100, 150)).toBe(0);
    });

    it('returns null for non-finite rates', () => {
      expect(computeDepletionHours(5000, NaN)).toBeNull();
      expect(computeDepletionHours(5000, Infinity)).toBeNull();
    });
  });

  describe('detectLeakage', () => {
    it('returns false when fewer than 6 readings are available', () => {
      const readings = [
        { flowRate: 1.5, waterLevel: 75, timestamp: new Date() },
        { flowRate: 1.5, waterLevel: 75, timestamp: new Date() },
      ];
      const result = detectLeakage(readings[1], readings, false);
      expect(result.isLeak).toBe(false);
      expect(result.reason).toBeNull();
    });

    it('triggers Rule 1 when continuous flow occurs with static water level', () => {
      // 6 readings with flow = 1.2 L/min but water level static at 75%
      const baseTime = Date.now();
      const readings = Array.from({ length: 6 }).map((_, i) => ({
        flowRate: 1.2,
        waterLevel: 75.0,
        timestamp: new Date(baseTime + i * 5000),
      }));

      const result = detectLeakage(readings[5], readings, false);
      expect(result.isLeak).toBe(true);
      expect(result.reason).toMatch(/reservoir water level remains unchanged/i);
    });

    it('triggers Rule 2 on continuous uninterrupted flow across 8 samples', () => {
      // 8 readings with continuous draw
      const baseTime = Date.now();
      const readings = Array.from({ length: 8 }).map((_, i) => ({
        flowRate: 0.8,
        waterLevel: 75.0 - i * 0.1, // small drop
        timestamp: new Date(baseTime + i * 5000),
      }));

      const result = detectLeakage(readings[7], readings, false);
      expect(result.isLeak).toBe(true);
      expect(result.reason).toBeDefined();
    });

    it('clears leak flag when normal idle interval occurs', () => {
      const baseTime = Date.now();
      const readings = Array.from({ length: 8 }).map((_, i) => ({
        flowRate: i === 4 ? 0 : 0.8, // has idle period at i=4
        waterLevel: 75.0 - i * 0.1,
        timestamp: new Date(baseTime + i * 5000),
      }));

      const result = detectLeakage(readings[7], readings, true); // was currently flagged
      expect(result.isLeak).toBe(false);
      expect(result.reason).toBeNull();
    });
  });

  describe('updateSavingsMetrics', () => {
    it('increments totalHarvestedLiters and calculates savings and CO2 displacement', () => {
      const initial = {
        totalHarvestedLiters: 1000,
        estimatedSavingsUsd: 3.0,
        co2SavedKg: 0.298,
      };

      // Add 500 liters
      const updated = updateSavingsMetrics(initial, 500);

      expect(updated.totalHarvestedLiters).toBe(1500);
      // 1500 * $0.003 = $4.50
      expect(updated.estimatedSavingsUsd).toBe(4.5);
      // 1500 * 0.000298 = 0.447 kg
      expect(updated.co2SavedKg).toBe(0.447);
    });

    it('handles zero increment cleanly without altering totals', () => {
      const initial = {
        totalHarvestedLiters: 1420,
        estimatedSavingsUsd: 4.26,
        co2SavedKg: 0.423,
      };

      const updated = updateSavingsMetrics(initial, 0);
      expect(updated.totalHarvestedLiters).toBe(1420);
      expect(updated.estimatedSavingsUsd).toBe(4.26);
      expect(updated.co2SavedKg).toBe(0.423);
    });
  });
});
