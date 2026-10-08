import React from 'react';
import AppShell from './components/layout/AppShell';
import { SocketProvider } from './contexts/SocketProvider';
import { TankProvider } from './contexts/TankContext';
import TankGrid from './components/tanks/TankGrid';

const DashboardContent: React.FC = () => {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Facility Cisterns</h1>
          <p className="text-sm text-[#8B949E] mt-0.5">
            Realtime SCADA rainwater collection & storage levels
          </p>
        </div>
        <TankGrid />
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
