import React from 'react';
import { useAlerts } from '../../contexts/AlertContext';
import { useTanks } from '../../contexts/TankContext';

export const AlertBanner: React.FC = () => {
  const { activeBanners, dismissAlert } = useAlerts();
  const { state } = useTanks();

  if (activeBanners.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 space-y-2"
    >
      {activeBanners.map((alert) => {
        const tank = state.tanks[alert.tankId];
        const tankName = tank?.name || alert.tankId;

        const isCritical = alert.type === 'CRITICAL_WATER';
        const isLow = alert.type === 'LOW_WATER';
        const isLeak = alert.type === 'LEAKAGE_SUSPECTED';

        const style = isCritical
          ? 'bg-rose-950/90 border-rose-700 text-rose-200'
          : isLeak
            ? 'bg-purple-950/90 border-purple-700 text-purple-200'
            : isLow
              ? 'bg-amber-950/90 border-amber-700 text-amber-200'
              : 'bg-slate-900/90 border-slate-700 text-slate-200';

        const title = isCritical
          ? 'CRITICAL LOW WATER LEVEL'
          : isLeak
            ? 'POTENTIAL LEAKAGE DETECTED'
            : isLow
              ? 'LOW WATER RESERVE WARNING'
              : 'DEVICE TELEMETRY OFFLINE';

        return (
          <div
            key={alert._id}
            role="alert"
            className={`flex items-center justify-between gap-4 p-3.5 rounded-lg border shadow-lg backdrop-blur ${style} transition-all`}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isCritical ? 'bg-rose-400' : 'bg-amber-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isCritical ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                />
              </span>
              <div>
                <div className="text-xs font-mono font-bold tracking-wider uppercase">
                  {title} &bull; {tankName}
                </div>
                <div className="text-sm font-medium mt-0.5 opacity-90">
                  {alert.message} &mdash;{' '}
                  <span className="font-mono text-xs">Current Level: {alert.level}%</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => dismissAlert(alert._id)}
                className="px-2.5 py-1 text-xs font-mono rounded bg-white/10 hover:bg-white/20 transition-colors focus:outline-none focus:ring-1 focus:ring-white/40"
                aria-label={`Dismiss alert for ${tankName}`}
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AlertBanner;
