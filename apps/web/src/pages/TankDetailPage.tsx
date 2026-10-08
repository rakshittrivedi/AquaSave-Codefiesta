import React, { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tank } from '../types/tank';
import { useTanks } from '../contexts/TankContext';
import StatusPill from '../components/tanks/StatusPill';
import TankFill from '../components/tanks/TankFill';
import LevelChart from '../components/charts/LevelChart';
import FlowChart from '../components/charts/FlowChart';
import ConsumptionChart from '../components/charts/ConsumptionChart';
import PredictionPanel from '../components/analytics/PredictionPanel';

interface TankDetailPageProps {
  tankId: string;
  onBack: () => void;
}

export const TankDetailPage: React.FC<TankDetailPageProps> = ({ tankId, onBack }) => {
  const { state } = useTanks();
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  // Live tank from context
  const liveTank = state.tanks[tankId];

  // Also query specific tank endpoint
  const { data: fetchedTank } = useQuery<Tank>({
    queryKey: ['tank', tankId],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/tanks/${tankId}`);
      if (!res.ok) throw new Error('Tank not found');
      return res.json();
    },
    staleTime: 10000,
  });

  const tank = liveTank || fetchedTank;

  useEffect(() => {
    if (tank?.name) {
      document.title = `${tank.name} | AquaSave SCADA`;
    }
    return () => {
      document.title = 'AquaSave | Smart Rainwater Management';
    };
  }, [tank?.name]);

  if (!tank) {
    return (
      <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-8 text-center text-[#8B949E]">
        <p>Loading reservoir telemetry...</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-md bg-[#21262D] text-sky-400 text-xs font-mono"
        >
          &larr; Back to Dashboard
        </button>
      </div>
    );
  }

  const isOffline = !tank.isOnline || tank.status === 'offline';

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#21262D]">
        <div>
          <button
            onClick={onBack}
            className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1.5 mb-2 focus:outline-none focus:underline"
            aria-label="Back to dashboard"
          >
            &larr; Return to Facility Overview
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{tank.name}</h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#21262D] text-[#8B949E] border border-[#30363D]">
              {tank.tankId}
            </span>
            <StatusPill status={tank.status} isOnline={tank.isOnline} />
          </div>
          <p className="text-sm text-[#8B949E] mt-1">{tank.location}</p>
        </div>

        <div className="text-left sm:text-right font-mono text-xs text-[#8B949E]">
          <div>HARDWARE: ESP32-WROOM-32</div>
          <div className="mt-0.5">
            LAST BEAT:{' '}
            <span className="text-white">{new Date(tank.lastSeenAt).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Main KPI Strip with Tank Cylinder Overview */}
      <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Cylinder Graphic */}
          <div className="flex items-center justify-center border-b md:border-b-0 md:border-r border-[#21262D] pb-6 md:pb-0 md:pr-6">
            <TankFill level={tank.currentWaterLevel} status={isOffline ? 'offline' : tank.status} />
          </div>

          {/* KPI 1: Level */}
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">
              Current Water Level
            </span>
            <div className="text-4xl font-mono font-bold text-white">
              {tank.currentWaterLevel}
              <span className="text-xl font-normal text-[#8B949E] ml-1">%</span>
            </div>
            <p className="text-xs text-[#8B949E]">
              {Math.round((tank.currentWaterLevel / 100) * tank.capacityLiters).toLocaleString()} L
              in storage
            </p>
          </div>

          {/* KPI 2: Flow Rate */}
          <div className="space-y-1">
            <span className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">
              Discharge Flow
            </span>
            <div className="text-4xl font-mono font-bold text-white">
              {tank.currentFlowRate.toFixed(1)}
              <span className="text-base font-normal text-[#8B949E] ml-1">L/min</span>
            </div>
            <p className="text-xs text-[#8B949E]">
              {(tank.currentFlowRate * 60).toFixed(0)} L/hr draw rate
            </p>
          </div>

          {/* KPI 3: Total Capacity & Thresholds */}
          <div className="space-y-2">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#8B949E]">
                Total Reservoir Capacity
              </span>
              <div className="text-2xl font-mono font-semibold text-white">
                {tank.capacityLiters.toLocaleString()} L
              </div>
            </div>
            <div className="text-xs font-mono text-[#8B949E] pt-2 border-t border-[#21262D] flex items-center justify-between">
              <span>Low Alert: &le;{tank.thresholds?.lowPercent ?? 20}%</span>
              <span>Crit: &le;{tank.thresholds?.criticalPercent ?? 10}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Analytics & Intelligence Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PredictionPanel
          hoursToEmpty={tank.analytics?.hoursToEmpty}
          rollingRateLph={tank.analytics?.rollingRateLph}
          flowRate={tank.currentFlowRate}
        />
      </div>

      {/* Historical Telemetry Charts (Level & Flow) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LevelChart tankId={tank.tankId} />
        <FlowChart tankId={tank.tankId} />
      </div>

      {/* Daily Consumption Aggregation */}
      <div>
        <ConsumptionChart tankId={tank.tankId} />
      </div>
    </div>
  );
};

export default TankDetailPage;
