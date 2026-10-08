import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface DaySummary {
  date: string;
  dayLabel: string;
  consumedLiters: number;
  harvestedLiters: number;
  avgWaterLevel: number;
  isToday: boolean;
}

interface AnalyticsDailyResponse {
  tankId: string;
  days: DaySummary[];
  summary: {
    totalConsumedLiters: number;
    percentChangeWeekOverWeek: number;
    changeLabel: string;
  };
}

interface ConsumptionChartProps {
  tankId: string;
}

export const ConsumptionChart: React.FC<ConsumptionChartProps> = ({ tankId }) => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const { data, isLoading } = useQuery<AnalyticsDailyResponse>({
    queryKey: ['analytics', 'daily', tankId],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/tanks/${tankId}/analytics/daily?days=7`);
      if (!res.ok) throw new Error('Failed to fetch daily analytics');
      return res.json();
    },
    refetchInterval: 30000,
  });

  const days = data?.days || [];
  const summary = data?.summary;
  const isIncrease = (summary?.percentChangeWeekOverWeek || 0) > 0;

  return (
    <figure className="rounded-xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-semibold text-sm text-[#F0F6FC] tracking-tight">
            Daily Water Consumption
          </h3>
          <figcaption className="text-xs text-[#8B949E] mt-0.5">
            7-day aggregate volume drawn from this reservoir
          </figcaption>
        </div>

        {/* Week-over-week comparison badge */}
        {summary && (
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium border ${
              isIncrease
                ? 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
            }`}
          >
            <span>{summary.changeLabel}</span>
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        {isLoading && days.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-[#8B949E] animate-pulse">
            Calculating aggregate consumption...
          </div>
        ) : days.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-[#8B949E]">
            No consumption data logged.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
              <XAxis
                dataKey="dayLabel"
                stroke="#6E7681"
                fontSize={11}
                tickLine={false}
                fontFamily="ui-monospace, monospace"
              />
              <YAxis
                stroke="#6E7681"
                fontSize={11}
                tickLine={false}
                fontFamily="ui-monospace, monospace"
                unit=" L"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload as DaySummary;
                    return (
                      <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-2.5 shadow-xl font-mono text-xs">
                        <div className="text-[#8B949E] mb-1">
                          {item.date} {item.isToday ? '(Today)' : ''}
                        </div>
                        <div className="text-sky-400 font-semibold text-sm">
                          Consumed: {item.consumedLiters.toLocaleString()} L
                        </div>
                        <div className="text-xs text-[#8B949E] mt-0.5">
                          Avg Level: {item.avgWaterLevel}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="consumedLiters" radius={[4, 4, 0, 0]}>
                {days.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isToday ? '#38BDF8' : '#0284C7'}
                    className="transition-colors hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </figure>
  );
};

export default ConsumptionChart;
