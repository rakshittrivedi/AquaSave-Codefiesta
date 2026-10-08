import { describe, it, expect } from 'vitest';
import { computeRollingRate, computeDepletionHours } from '../services/analyticsService';

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
});
