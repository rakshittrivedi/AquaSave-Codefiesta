import React from 'react';
import AppShell from './components/layout/AppShell';
import { SocketProvider } from './contexts/SocketProvider';
import { TankProvider, useTanks } from './contexts/TankContext';

const DashboardContent: React.FC = () => {
  const { tanksList } = useTanks();

  return (
    <AppShell>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tanksList.map((tank) => {
          const isOffline = !tank.isOnline || tank.status === 'offline';
          const isCritical = tank.status === 'critical';
          const isLow = tank.status === 'low';

          const badgeClasses = isOffline
            ? 'bg-slate-800/80 text-slate-400 border-slate-700'
            : isCritical
              ? 'bg-rose-950/80 text-rose-400 border-rose-800/60 animate-pulse'
              : isLow
                ? 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40';

          const barColor = isOffline
            ? 'bg-slate-500'
            : isCritical
              ? 'bg-rose-500'
              : isLow
                ? 'bg-amber-500'
                : 'bg-emerald-500';

          return (
            <div
              key={tank.tankId}
              className="rounded-lg border border-[#30363D] bg-[#161B22] p-5 flex flex-col justify-between transition-all hover:border-[#58A6FF]/50"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium text-sm text-[#F0F6FC]">{tank.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase border ${badgeClasses}`}
                >
                  {isOffline ? 'OFFLINE' : tank.status}
                </span>
              </div>
              <div className="my-4">
                <div className="text-3xl font-mono font-semibold text-white tracking-tight">
                  {tank.currentWaterLevel}%
                </div>
                <div className="text-xs text-[#8B949E] mt-1 font-mono">
                  FLOW: {tank.currentFlowRate.toFixed(1)} L/m
                </div>
              </div>
              <div className="w-full bg-[#21262D] rounded-full h-2 overflow-hidden">
                <div
                  className={`${barColor} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, tank.currentWaterLevel))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </AppShell>
  );
};

export const App: React.FC = () => {
  return (
    <SocketProvider>
      <TankProvider>
        <DashboardContent />
      </TankProvider>
    </SocketProvider>
  );
};

export default App;
