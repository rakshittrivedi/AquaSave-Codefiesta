import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TankCard from '../components/tanks/TankCard';
import { Tank } from '../types/tank';

const baseAnalytics = {
  rollingRateLph: 120,
  hoursToEmpty: 12.5,
  leakageFlag: false,
  leakageFlagReason: null,
  totalHarvestedLiters: 5000,
  estimatedSavingsUsd: 15,
  co2SavedKg: 1.49,
};

const baseThresholds = {
  lowPercent: 25,
  criticalPercent: 10,
};

const normalFixture: Tank = {
  tankId: 'tank-01',
  name: 'North Cistern',
  location: 'Building A Roof',
  capacityLiters: 10000,
  currentWaterLevel: 82,
  currentFlowRate: 2.0,
  status: 'normal',
  isOnline: true,
  lastSeenAt: new Date().toISOString(),
  thresholds: baseThresholds,
  analytics: baseAnalytics,
};

const lowFixture: Tank = {
  tankId: 'tank-02',
  name: 'South Cistern',
  location: 'Courtyard Sub-surface',
  capacityLiters: 8000,
  currentWaterLevel: 22,
  currentFlowRate: 1.2,
  status: 'low',
  isOnline: true,
  lastSeenAt: new Date().toISOString(),
  thresholds: baseThresholds,
  analytics: baseAnalytics,
};

const criticalFixture: Tank = {
  tankId: 'tank-03',
  name: 'East Cistern',
  location: 'Landscape Facility',
  capacityLiters: 15000,
  currentWaterLevel: 8,
  currentFlowRate: 0.4,
  status: 'critical',
  isOnline: true,
  lastSeenAt: new Date().toISOString(),
  thresholds: baseThresholds,
  analytics: baseAnalytics,
};

const offlineFixture: Tank = {
  tankId: 'tank-04',
  name: 'West Cistern',
  location: 'Loading Bay Basement',
  capacityLiters: 5000,
  currentWaterLevel: 45,
  currentFlowRate: 0.0,
  status: 'offline',
  isOnline: false,
  lastSeenAt: new Date(Date.now() - 3600000).toISOString(),
  thresholds: baseThresholds,
  analytics: baseAnalytics,
};

describe('TankCard Component', () => {
  it('renders normal status fixture with correct pill, level percentage, and aria attributes', () => {
    const handleSelect = vi.fn();
    render(<TankCard tank={normalFixture} onSelect={handleSelect} />);

    // Status pill
    expect(screen.getByRole('status')).toHaveTextContent('Normal');

    // Level display
    expect(screen.getByText('82')).toBeInTheDocument();
    expect(screen.getByText('%')).toBeInTheDocument();

    // Name and location
    expect(screen.getByText('North Cistern')).toBeInTheDocument();
    expect(screen.getByText('Building A Roof')).toBeInTheDocument();

    // Accessible container
    const card = screen.getByRole('button', {
      name: /Tank North Cistern, level 82%, status normal/i,
    });
    expect(card).toBeInTheDocument();

    // Click handler
    fireEvent.click(card);
    expect(handleSelect).toHaveBeenCalledWith('tank-01');
  });

  it('renders low water level status fixture', () => {
    render(<TankCard tank={lowFixture} />);

    expect(screen.getByRole('status')).toHaveTextContent('Low Level');
    expect(screen.getByText('22')).toBeInTheDocument();

    const card = screen.getByRole('button', {
      name: /Tank South Cistern, level 22%, status low/i,
    });
    expect(card).toBeInTheDocument();
  });

  it('renders critical water level status fixture', () => {
    render(<TankCard tank={criticalFixture} />);

    expect(screen.getByRole('status')).toHaveTextContent('Critical');
    expect(screen.getByText('8')).toBeInTheDocument();

    const card = screen.getByRole('button', {
      name: /Tank East Cistern, level 8%, status critical/i,
    });
    expect(card).toBeInTheDocument();
  });

  it('renders offline status fixture with offline pill and indicators', () => {
    render(<TankCard tank={offlineFixture} />);

    expect(screen.getByRole('status')).toHaveTextContent('Offline');
    expect(screen.getByText('45')).toBeInTheDocument();

    const card = screen.getByRole('button', {
      name: /Tank West Cistern, level 45%, status offline/i,
    });
    expect(card).toBeInTheDocument();
  });

  it('supports keyboard navigation (Enter and Space keys)', () => {
    const handleSelect = vi.fn();
    render(<TankCard tank={normalFixture} onSelect={handleSelect} />);

    const card = screen.getByRole('button', {
      name: /Tank North Cistern, level 82%, status normal/i,
    });

    fireEvent.keyDown(card, { key: 'Enter', code: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith('tank-01');

    fireEvent.keyDown(card, { key: ' ', code: 'Space' });
    expect(handleSelect).toHaveBeenCalledTimes(2);
  });
});
