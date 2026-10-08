import React, { useState } from 'react';

export interface HourlyPrecipitation {
  time: string;
  precipitation: number;
}

export interface RainForecastProps {
  forecast?: {
    hourly: HourlyPrecipitation[];
    lastPolledAt?: string;
    hasIncomingRain?: boolean;
  } | null;
  className?: string;
}

export const RainForecast: React.FC<RainForecastProps> = ({ forecast, className = '' }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!forecast || !forecast.hourly || forecast.hourly.length === 0) {
    return (
      <div
        className={`rounded-xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm ${className}`}
        role="region"
        aria-label="Rainfall Forecast"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-sky-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"
              />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-wider font-mono text-slate-300">
              Open-Meteo Precipitation Forecast
            </span>
          </div>
          <span className="text-xs font-mono text-slate-500">Forecast unavailable</span>
        </div>
      </div>
    );
  }

  const { hourly, hasIncomingRain, lastPolledAt } = forecast;
  const next24 = hourly.slice(0, 24);
  const total24hPrecip = next24.reduce((sum, h) => sum + h.precipitation, 0);
  const next6hPrecip = next24.slice(0, 6).reduce((sum, h) => sum + h.precipitation, 0);
  const isIncomingRain = hasIncomingRain || next6hPrecip > 5.0;

  // Max precipitation for scaling bar heights
  const maxPrecip = Math.max(5, ...next24.map((h) => h.precipitation));

  return (
    <div
      className={`rounded-xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm transition-all ${className}`}
      role="region"
      aria-label="Rainfall Forecast"
    >
      {/* Header with Collapsible Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <svg
            className="w-5 h-5 text-sky-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 00-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
              Atmospheric Rainfall Forecast (24h)
              {isIncomingRain ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-amber-300 bg-amber-950/70 border border-amber-800/70 animate-pulse">
                  RAIN INCOMING
                </span>
              ) : total24hPrecip === 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-slate-400 bg-slate-800/80 border border-slate-700">
                  No rain forecast
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-sky-300 bg-sky-950/70 border border-sky-800/70">
                  {total24hPrecip.toFixed(1)} mm total
                </span>
              )}
            </h2>
            <p className="text-xs text-[#8B949E] mt-0.5">
              Open-Meteo High-Resolution Precipitation Poller
              {lastPolledAt && ` · Updated ${new Date(lastPolledAt).toLocaleTimeString()}`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded bg-[#21262D] border border-[#30363D] flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Advisory Banner if incoming rain (> 5mm in next 6h) */}
          {isIncomingRain && (
            <div
              role="alert"
              className="rounded-lg bg-sky-950/40 border border-sky-700/60 p-3.5 flex items-start gap-3 shadow-inner"
            >
              <svg
                className="w-5 h-5 text-sky-400 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-xs">
                <span className="font-bold text-sky-200">Precipitation Inflow Advisory:</span>{' '}
                <span className="text-sky-300">
                  Over {next6hPrecip.toFixed(1)} mm of rainfall forecast across the next 6 hours.
                  Cistern collection channels and first-flush diverters are primed for harvesting.
                </span>
              </div>
            </div>
          )}

          {/* 24-Hour Precipitation Strip */}
          <div className="overflow-x-auto pb-2 scrollbar-thin">
            <div className="min-w-[700px] flex items-end gap-1.5 h-28 pt-2">
              {next24.map((hourPoint, idx) => {
                const dateObj = new Date(hourPoint.time);
                const hourLabel = isNaN(dateObj.getTime())
                  ? `+${idx}h`
                  : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const precip = hourPoint.precipitation;
                const barHeightPercent = Math.max(6, Math.min(100, (precip / maxPrecip) * 100));

                let barColor = 'bg-[#21262D] text-slate-500';
                if (precip > 5) {
                  barColor = 'bg-sky-400 text-sky-200 shadow-sm shadow-sky-400/50';
                } else if (precip > 1.5) {
                  barColor = 'bg-sky-500 text-sky-300';
                } else if (precip > 0) {
                  barColor = 'bg-sky-700/70 text-sky-400';
                }

                return (
                  <div
                    key={`${hourPoint.time}-${idx}`}
                    className="flex-1 flex flex-col items-center justify-end h-full group"
                    title={`${hourLabel}: ${precip.toFixed(1)} mm precipitation`}
                  >
                    <span className="text-[10px] font-mono text-slate-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {precip > 0 ? `${precip.toFixed(1)}` : ''}
                    </span>
                    <div className="w-full bg-[#1A202C] rounded-t overflow-hidden flex items-end h-16">
                      <div
                        style={{ height: `${barHeightPercent}%` }}
                        className={`w-full rounded-t transition-all duration-300 ${barColor}`}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-1.5 whitespace-nowrap">
                      {hourLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RainForecast;
