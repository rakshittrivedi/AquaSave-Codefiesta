import React from 'react';

export interface LeakagePanelProps {
  leakageFlag: boolean | undefined;
  leakageFlagReason: string | null | undefined;
  className?: string;
}

export const LeakagePanel: React.FC<LeakagePanelProps> = ({
  leakageFlag = false,
  leakageFlagReason,
  className = '',
}) => {
  const isLeaking = Boolean(leakageFlag);

  return (
    <div
      tabIndex={0}
      role="region"
      aria-label={
        isLeaking
          ? `Leakage Alert: ${leakageFlagReason || 'Potential leak detected'}`
          : 'Leakage Status: No leak detected'
      }
      className={`rounded-xl border p-4 flex flex-col justify-between shadow-sm transition-all focus:outline-none focus:ring-2 ${
        isLeaking
          ? 'bg-rose-950/25 border-rose-700/60 focus:ring-rose-500'
          : 'bg-[#161B22] border-[#30363D] focus:ring-emerald-500'
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isLeaking ? (
            <svg
              className="w-4 h-4 text-rose-400 animate-pulse"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          ) : (
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          )}
          <span className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-400">
            {isLeaking ? 'Leak Alert' : 'Leak Detection'}
          </span>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border ${
            isLeaking
              ? 'bg-rose-900/40 text-rose-300 border-rose-700/60'
              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${isLeaking ? 'bg-rose-400 animate-ping' : 'bg-emerald-400'}`}
          />
          {isLeaking ? 'ANOMALY DETECTED' : 'NOMINAL'}
        </span>
      </div>

      {/* Main Body */}
      <div className="my-1">
        <div
          className={`text-lg font-bold font-mono tracking-tight ${
            isLeaking ? 'text-rose-200' : 'text-emerald-300'
          }`}
        >
          {isLeaking
            ? `Potential leak: ${leakageFlagReason || 'Unexplained continuous draw'}`
            : 'No leak detected'}
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {isLeaking
            ? 'Continuous outflow observed without normal resting intervals or reservoir draw-down consistency.'
            : 'Hydraulic flow rates and hydrostatic pressure levels adhere to normal consumption boundaries.'}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2.5 border-t border-[#21262D] flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Rules: Static Level / Night Flow</span>
        <span className={isLeaking ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
          {isLeaking ? 'Requires Inspection' : 'All Checks Clear'}
        </span>
      </div>
    </div>
  );
};

export default LeakagePanel;
