import React from 'react';
import { Tank } from '../../types/tank';

export interface SavingsPanelProps {
  tanks?: Tank[];
  tank?: Tank;
  className?: string;
}

export const SavingsPanel: React.FC<SavingsPanelProps> = ({ tanks, tank, className = '' }) => {
  // Aggregate if tanks array provided, or use single tank
  let totalLiters = 0;
  let totalUsd = 0;
  let totalCo2Kg = 0;

  if (tank) {
    totalLiters = tank.analytics?.totalHarvestedLiters || 0;
    totalUsd = tank.analytics?.estimatedSavingsUsd || 0;
    totalCo2Kg = tank.analytics?.co2SavedKg || 0;
  } else if (tanks && tanks.length > 0) {
    tanks.forEach((t) => {
      totalLiters += t.analytics?.totalHarvestedLiters || 0;
      totalUsd += t.analytics?.estimatedSavingsUsd || 0;
      totalCo2Kg += t.analytics?.co2SavedKg || 0;
    });
  }

  return (
    <div
      role="region"
      aria-label="Water Conservation and Sustainability Impact"
      className={`rounded-xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#21262D]">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300">
            {tank ? `${tank.name} Sustainability Impact` : 'Facility Conservation Impact'}
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          ECO-ACTIVE
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Harvested Water */}
        <div className="bg-[#0D1117] rounded-lg p-3.5 border border-[#21262D]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Total Rainwater Harvested
          </span>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {Math.round(totalLiters).toLocaleString()}
            <span className="text-sm font-normal text-slate-400 ml-1">L</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Displacing municipal utility draw
          </span>
        </div>

        {/* Metric 2: Financial Savings */}
        <div className="bg-[#0D1117] rounded-lg p-3.5 border border-[#21262D]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Estimated Cost Savings
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ${totalUsd.toFixed(2)}
            <span className="text-sm font-normal text-slate-400 ml-1">USD</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Rate: $0.003 / Liter equivalent
          </span>
        </div>

        {/* Metric 3: Carbon Offset */}
        <div className="bg-[#0D1117] rounded-lg p-3.5 border border-[#21262D]">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Emissions Avoided
          </span>
          <div className="text-2xl font-bold font-mono text-teal-300">
            {totalCo2Kg.toFixed(3)}
            <span className="text-sm font-normal text-slate-400 ml-1">kg CO₂e</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Factor: 0.000298 kg CO₂ / Liter
          </span>
        </div>
      </div>
    </div>
  );
};

export default SavingsPanel;
