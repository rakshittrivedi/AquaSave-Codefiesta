import React from 'react';

export interface PredictionPanelProps {
  hoursToEmpty: number | null | undefined;
  rollingRateLph?: number;
  flowRate?: number;
  readingsCount?: number;
  compact?: boolean;
}

export function formatDepletionTime(
  hoursToEmpty: number | null | undefined,
  flowRate?: number,
  readingsCount?: number
): {
  title: string;
  subtitle: string;
  status: 'calculating' | 'filling' | 'steady' | 'warning' | 'normal';
} {
  // If fewer than 12 readings and no established prediction yet
  if (
    readingsCount !== undefined &&
    readingsCount < 12 &&
    (hoursToEmpty === null || hoursToEmpty === undefined)
  ) {
    return {
      title: 'Calculating…',
      subtitle: `${readingsCount}/12 samples collected`,
      status: 'calculating',
    };
  }

  // Net inflow / filling
  if (flowRate !== undefined && flowRate < 0) {
    return {
      title: 'Filling',
      subtitle: 'Net positive replenishment inflow',
      status: 'filling',
    };
  }

  // Zero flow / holding steady
  if (
    hoursToEmpty === null ||
    hoursToEmpty === undefined ||
    (flowRate !== undefined && flowRate === 0)
  ) {
    return {
      title: 'Holding Steady',
      subtitle: 'Zero active consumption',
      status: 'steady',
    };
  }

  // Depletion calculations
  if (hoursToEmpty <= 0) {
    return {
      title: 'Depleted (0 hrs)',
      subtitle: 'Cistern volume at minimum reserve',
      status: 'warning',
    };
  }

  if (hoursToEmpty < 1) {
    const mins = Math.max(1, Math.round(hoursToEmpty * 60));
    return {
      title: `~${mins} mins to empty`,
      subtitle: 'Depletion imminent under current flow',
      status: 'warning',
    };
  }

  if (hoursToEmpty < 12) {
    return {
      title: `~${hoursToEmpty.toFixed(1)} hrs to empty`,
      subtitle: 'Rapid draw-down active',
      status: 'warning',
    };
  }

  if (hoursToEmpty < 48) {
    return {
      title: `~${hoursToEmpty.toFixed(1)} hrs to empty`,
      subtitle: 'Estimated based on 12-sample rolling rate',
      status: 'normal',
    };
  }

  const days = (hoursToEmpty / 24).toFixed(1);
  return {
    title: `~${days} days to empty`,
    subtitle: 'Sustainable reserve duration',
    status: 'normal',
  };
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  hoursToEmpty,
  rollingRateLph = 0,
  flowRate,
  readingsCount,
  compact = false,
}) => {
  const { title, subtitle, status } = formatDepletionTime(hoursToEmpty, flowRate, readingsCount);

  if (compact) {
    const badgeColors = {
      calculating: 'bg-slate-800 text-slate-300 border-slate-700',
      filling: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/60',
      steady: 'bg-sky-950/70 text-sky-300 border-sky-800/60',
      warning: 'bg-amber-950/70 text-amber-300 border-amber-800/60 animate-pulse',
      normal: 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60',
    }[status];

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border ${badgeColors}`}
        title={`Rolling Rate: ${rollingRateLph} L/hr - ${subtitle}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {title}
      </span>
    );
  }

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-4 flex flex-col justify-between shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-cyan-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Depletion Forecast
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Rolling:{' '}
          <span className="text-slate-200 font-medium">{rollingRateLph.toFixed(0)} L/hr</span>
        </span>
      </div>

      <div className="my-1">
        <div className="text-xl font-bold font-mono tracking-tight text-slate-100">{title}</div>
        <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-[#21262D] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Model: Trapezoidal Flow</span>
        <span className="text-cyan-400">Live Auto-Update</span>
      </div>
    </div>
  );
};

export default PredictionPanel;
