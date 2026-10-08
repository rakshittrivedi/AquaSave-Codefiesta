import React from 'react';
import { Tank } from '../../types/tank';
import TankFill from './TankFill';
import StatusPill from './StatusPill';

interface TankCardProps {
  tank: Tank;
  onSelect?: (tankId: string) => void;
}

export const TankCard: React.FC<TankCardProps> = ({ tank, onSelect }) => {
  const isOffline = !tank.isOnline || tank.status === 'offline';

  // Format relative last seen
  const formatLastSeen = (timestamp: string) => {
    try {
      const diffSec = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
      if (diffSec < 5) return 'just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      return `${Math.floor(diffMin / 60)}h ago`;
    } catch {
      return 'unknown';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
      e.preventDefault();
      onSelect(tank.tankId);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(tank.tankId)}
      onKeyDown={handleKeyDown}
      className="group relative rounded-xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm transition-all duration-200 hover:border-[#58A6FF]/60 hover:shadow-md hover:shadow-sky-950/20 focus:outline-none focus:ring-2 focus:ring-[#58A6FF] flex flex-col justify-between cursor-pointer"
      aria-label={`Tank ${tank.name}, level ${tank.currentWaterLevel}%, status ${isOffline ? 'offline' : tank.status}`}
    >
      {/* Header: Name and Status */}
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="font-semibold text-sm text-[#F0F6FC] tracking-tight group-hover:text-white flex items-center gap-2">
            {tank.name}
          </h3>
          <p className="text-xs text-[#8B949E] mt-0.5">{tank.location}</p>
        </div>
        <StatusPill status={tank.status} isOnline={tank.isOnline} />
      </div>

      {/* Body: SVG Visualization & Telemetry Metrics */}
      <div className="flex items-center justify-between my-2">
        <div className="flex-1 pr-4">
          <div className="text-xs uppercase font-mono text-[#8B949E] tracking-wider mb-1">
            Current Level
          </div>
          <div className="text-4xl font-mono font-bold text-white tracking-tight">
            {tank.currentWaterLevel}
            <span className="text-xl font-normal text-[#8B949E] ml-0.5">%</span>
          </div>

          <div className="mt-4 pt-3 border-t border-[#21262D] space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8B949E]">Flow Rate:</span>
              <span className="font-mono text-[#F0F6FC] font-medium">
                {tank.currentFlowRate.toFixed(1)} L/min
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#8B949E]">Capacity:</span>
              <span className="font-mono text-[#8B949E]">
                {tank.capacityLiters.toLocaleString()} L
              </span>
            </div>
          </div>
        </div>

        {/* Cylinder SVG graphic */}
        <div className="flex-shrink-0">
          <TankFill level={tank.currentWaterLevel} status={isOffline ? 'offline' : tank.status} />
        </div>
      </div>

      {/* Footer: Telemetry Timestamp */}
      <div className="mt-4 pt-3 border-t border-[#21262D] flex items-center justify-between text-[11px] font-mono text-[#8B949E]">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full ${isOffline ? 'bg-slate-500' : 'bg-emerald-400'}`}
          />
          {tank.tankId}
        </span>
        <span>Last seen: {formatLastSeen(tank.lastSeenAt)}</span>
      </div>
    </div>
  );
};

export default TankCard;
