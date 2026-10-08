import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './components/layout/AppShell';
import { SocketProvider } from './contexts/SocketProvider';
import { TankProvider, useTanks } from './contexts/TankContext';
import { AlertProvider } from './contexts/AlertContext';
import { useTanksQuery } from './hooks/useTanksQuery';
import TankGrid from './components/tanks/TankGrid';
import ErrorBoundary from './components/common/ErrorBoundary';
import LevelChart from './components/charts/LevelChart';
import FlowChart from './components/charts/FlowChart';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const DashboardContent: React.FC<{
  currentRoute: string;
  onNavigate: (route: string) => void;
}> = ({ currentRoute, onNavigate }) => {
  const { state } = useTanks();
  const { isLoading, isError, error } = useTanksQuery();

  const isDetail = currentRoute.startsWith('/tank/');
  const tankId = isDetail ? currentRoute.replace('/tank/', '') : null;
  const currentTank = tankId ? state.tanks[tankId] : null;

  return (
    <AppShell activeRoute={currentRoute} onNavigate={onNavigate}>
      <ErrorBoundary fallbackMessage={isError ? error?.message : undefined}>
        {isDetail && currentTank ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => onNavigate('/')}
                  className="text-xs font-mono text-sky-400 hover:text-sky-300 flex items-center gap-1.5 mb-2 focus:outline-none"
                >
                  &larr; Back to Dashboard
                </button>
                <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                  {currentTank.name}
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#21262D] text-[#8B949E] border border-[#30363D]">
                    {currentTank.tankId}
                  </span>
                </h1>
                <p className="text-sm text-[#8B949E] mt-0.5">{currentTank.location}</p>
              </div>
            </div>

            <div className="p-6 rounded-xl border border-[#30363D] bg-[#161B22]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <div className="text-xs uppercase font-mono text-[#8B949E]">Current Level</div>
                  <div className="text-4xl font-mono font-bold text-white mt-1">
                    {currentTank.currentWaterLevel}%
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase font-mono text-[#8B949E]">Flow Rate</div>
                  <div className="text-4xl font-mono font-bold text-white mt-1">
                    {currentTank.currentFlowRate.toFixed(1)}{' '}
                    <span className="text-sm text-[#8B949E] font-normal">L/min</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase font-mono text-[#8B949E]">Capacity</div>
                  <div className="text-4xl font-mono font-bold text-white mt-1">
                    {currentTank.capacityLiters.toLocaleString()}{' '}
                    <span className="text-sm text-[#8B949E] font-normal">L</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LevelChart tankId={currentTank.tankId} />
              <FlowChart tankId={currentTank.tankId} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Facility Cisterns</h1>
                <p className="text-sm text-[#8B949E] mt-0.5">
                  Realtime SCADA rainwater collection & storage levels
                </p>
              </div>
            </div>
            <TankGrid isLoading={isLoading} onSelectTank={(id) => onNavigate(`/tank/${id}`)} />
          </div>
        )}
      </ErrorBoundary>
    </AppShell>
  );
};

export const App: React.FC = () => {
  const [route, setRoute] = useState<string>('/');

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <TankProvider>
          <AlertProvider>
            <DashboardContent currentRoute={route} onNavigate={setRoute} />
          </AlertProvider>
        </TankProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
};

export default App;
