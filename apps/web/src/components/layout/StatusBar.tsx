import React, { useEffect, useState } from 'react';
import { useTanks } from '../../contexts/TankContext';
import { useSocket } from '../../contexts/SocketProvider';

interface StatusBarProps {
  activeAlertCount?: number;
  onOpenAlerts?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({ activeAlertCount = 0, onOpenAlerts }) => {
  const { tanksList, state } = useTanks();
  const { isConnected } = useSocket();
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  const onlineCount = tanksList.filter((t) => t.isOnline && t.status !== 'offline').length;
  const totalCount = tanksList.length;

  useEffect(() => {
    const updateCounter = () => {
      if (state.lastDataReceivedAt) {
        const diff = Math.max(
          0,
          Math.floor((Date.now() - new Date(state.lastDataReceivedAt).getTime()) / 1000)
        );
        setSecondsAgo(diff);
      }
    };

    updateCounter();
    const interval = setInterval(updateCounter, 1000);
    return () => clearInterval(interval);
  }, [state.lastDataReceivedAt]);

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-mono">
      {/* Realtime Socket Connection Status */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D1117] border border-[#30363D]"
        title={isConnected ? 'Socket.IO connected' : 'Socket.IO disconnected'}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-emerald-400' : 'bg-rose-500 animate-pulse'
          }`}
        />
        <span className={isConnected ? 'text-[#F0F6FC]' : 'text-rose-400'}>
          {isConnected ? 'ONLINE' : 'CONNECTING'}
        </span>
      </div>

      {/* Online Tanks Telemetry Count */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D1117] border border-[#30363D] text-[#8B949E]">
        <span className="text-[#F0F6FC] font-semibold">
          {onlineCount}/{totalCount}
        </span>
        <span>TANKS LIVE</span>
      </div>

      {/* Counter: Last Data Received */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0D1117] border border-[#30363D] text-[#8B949E]">
        <span>UPDATED:</span>
        <span className="text-sky-400 font-semibold">
          {state.lastDataReceivedAt ? `${secondsAgo}s ago` : 'LIVE'}
        </span>
      </div>

      {/* Alerts Log & History Button */}
      <button
        onClick={onOpenAlerts}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border transition-colors focus:outline-none focus:ring-1 ${
          activeAlertCount > 0
            ? 'bg-rose-950/80 border-rose-800/80 text-rose-300 font-semibold hover:bg-rose-900 focus:ring-rose-400'
            : 'bg-[#0D1117] border-[#30363D] text-[#8B949E] hover:text-[#F0F6FC] hover:border-[#58A6FF]/40 focus:ring-sky-400'
        }`}
        aria-label={`${activeAlertCount} active alerts. Click to view alert history.`}
      >
        {activeAlertCount > 0 ? (
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
        ) : (
          <span className="w-2 h-2 rounded-full bg-slate-500" />
        )}
        <span>{activeAlertCount > 0 ? `${activeAlertCount} ALERTS` : 'ALERTS (0)'}</span>
      </button>
    </div>
  );
};

export default StatusBar;
