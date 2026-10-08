import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';

interface LevelReading {
  timestamp: string;
  waterLevel: number;
}

interface LevelChartProps {
  tankId: string;
}

export type TimeRange = '1h' | '6h' | '24h' | '7d';

export const LevelChart: React.FC<LevelChartProps> = ({ tankId }) => {
  const [range, setRange] = useState<TimeRange>('24h');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const { data, isLoading } = useQuery<{ readings: LevelReading[] }>({
    queryKey: ['readings', tankId, range],
    queryFn: async () => {
      const res = await fetch(`${apiUrl}/api/v1/tanks/${tankId}/readings?range=${range}&limit=500`);
      if (!res.ok) throw new Error('Failed to fetch readings');
      return res.json();
    },
    refetchInterval: 15000,
  });

  const chartData = (data?.readings || []).map((r) => {
    const d = new Date(r.timestamp);
    const timeLabel =
      range === '1h' || range === '6h'
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return {
      time: timeLabel,
      fullTime: d.toLocaleString(),
      waterLevel: r.waterLevel,
    };
  });

  return (
    <figure className="rounded-xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-semibold text-sm text-[#F0F6FC] tracking-tight">Water Level Trend</h3>
          <figcaption className="text-xs text-[#8B949E] mt-0.5">
            Historical reservoir capacity percentage over time
          </figcaption>
        </div>

        {/* Range Selector */}
        <div className="inline-flex rounded-lg bg-[#0D1117] p-1 border border-[#30363D]">
          {(['1h', '6h', '24h', '7d'] as TimeRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                range === r
                  ? 'bg-sky-900/60 text-sky-400 border border-sky-600/40'
                  : 'text-[#8B949E] hover:text-[#F0F6FC]'
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 w-full">
        {isLoading && chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-[#8B949E] animate-pulse">
            Loading telemetry data...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-[#8B949E]">
            No historical level telemetry recorded in selected window.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262D" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#6E7681"
                fontSize={11}
                tickLine={false}
                fontFamily="ui-monospace, monospace"
              />
              <YAxis
                domain={[0, 100]}
                stroke="#6E7681"
                fontSize={11}
                tickLine={false}
                fontFamily="ui-monospace, monospace"
                unit="%"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-2.5 shadow-xl font-mono text-xs">
                        <div className="text-[#8B949E] mb-1">{item.fullTime}</div>
                        <div className="text-sky-400 font-semibold text-sm">
                          Level: {item.waterLevel}%
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="waterLevel"
                stroke="#0284C7"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#38BDF8', stroke: '#0284C7', strokeWidth: 2 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </figure>
  );
};

export default LevelChart;
