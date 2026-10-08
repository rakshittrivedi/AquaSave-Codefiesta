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
import { TimeRange } from './LevelChart';

interface FlowReading {
  timestamp: string;
  flowRate: number;
}

interface FlowChartProps {
  tankId: string;
}

export const FlowChart: React.FC<FlowChartProps> = ({ tankId }) => {
  const [range, setRange] = useState<TimeRange>('24h');
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const { data, isLoading } = useQuery<{ readings: FlowReading[] }>({
    queryKey: ['readings', 'flow', tankId, range],
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
      flowRate: r.flowRate,
    };
  });

  return (
    <figure className="rounded-xl border border-[#30363D] bg-[#161B22] p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="font-semibold text-sm text-[#F0F6FC] tracking-tight">
            Flow Rate Velocity
          </h3>
          <figcaption className="text-xs text-[#8B949E] mt-0.5">
            Realtime sensor throughput in liters per minute (L/min)
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
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-600/40'
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
            Loading flow telemetry...
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs font-mono text-[#8B949E]">
            No flow activity recorded in selected window.
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
                stroke="#6E7681"
                fontSize={11}
                tickLine={false}
                fontFamily="ui-monospace, monospace"
                unit=" L/m"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-lg border border-[#30363D] bg-[#0D1117] p-2.5 shadow-xl font-mono text-xs">
                        <div className="text-[#8B949E] mb-1">{item.fullTime}</div>
                        <div className="text-emerald-400 font-semibold text-sm">
                          Flow: {item.flowRate} L/min
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="flowRate"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: '#34D399', stroke: '#10B981', strokeWidth: 2 }}
                isAnimationActive={true}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </figure>
  );
};

export default FlowChart;
