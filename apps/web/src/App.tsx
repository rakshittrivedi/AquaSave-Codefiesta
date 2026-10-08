import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from './components/layout/AppShell';
import { SocketProvider } from './contexts/SocketProvider';
import { TankProvider } from './contexts/TankContext';
import { AlertProvider } from './contexts/AlertContext';
import { useTanksQuery } from './hooks/useTanksQuery';
import TankGrid from './components/tanks/TankGrid';
import ErrorBoundary from './components/common/ErrorBoundary';
import TankDetailPage from './pages/TankDetailPage';
import SavingsPanel from './components/analytics/SavingsPanel';
import RainForecast from './components/forecast/RainForecast';
import AlertPanel from './components/alerts/AlertPanel';

import LoginPage from './pages/LoginPage';
import { isAuthenticated, removeToken } from './lib/api';

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
  onOpenAlerts: () => void;
  onLogout: () => void;
}> = ({ currentRoute, onNavigate, onOpenAlerts, onLogout }) => {
  const { data: tanks, isLoading, isError, error } = useTanksQuery();

  const isDetail = currentRoute.startsWith('/tank/');
  const tankId = isDetail ? currentRoute.replace('/tank/', '') : null;

  return (
    <AppShell
      activeRoute={currentRoute}
      onNavigate={onNavigate}
      onOpenAlerts={onOpenAlerts}
      onLogout={onLogout}
    >
      <ErrorBoundary fallbackMessage={isError ? error?.message : undefined}>
        {isDetail && tankId ? (
          <TankDetailPage tankId={tankId} onBack={() => onNavigate('/')} />
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
            {/* Dashboard Analytics Impact Row */}
            <SavingsPanel tanks={tanks} />
            <RainForecast forecast={tanks?.[0]?.forecast} />
            <TankGrid isLoading={isLoading} onSelectTank={(id) => onNavigate(`/tank/${id}`)} />
          </div>
        )}
      </ErrorBoundary>
    </AppShell>
  );
};

export const App: React.FC = () => {
  const [route, setRoute] = useState<string>('/');
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState<boolean>(false);
  const [authenticated, setAuthenticated] = useState<boolean>(isAuthenticated());

  React.useEffect(() => {
    const handleUnauthorized = () => {
      setAuthenticated(false);
      setRoute('/login');
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const handleLogout = () => {
    removeToken();
    setAuthenticated(false);
    setRoute('/login');
  };

  if (!authenticated || route === '/login') {
    return (
      <LoginPage
        onLoginSuccess={() => {
          setAuthenticated(true);
          setRoute('/');
        }}
      />
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        <TankProvider>
          <AlertProvider>
            <DashboardContent
              currentRoute={route}
              onNavigate={setRoute}
              onOpenAlerts={() => setIsAlertPanelOpen(true)}
              onLogout={handleLogout}
            />
            <AlertPanel isOpen={isAlertPanelOpen} onClose={() => setIsAlertPanelOpen(false)} />
          </AlertProvider>
        </TankProvider>
      </SocketProvider>
    </QueryClientProvider>
  );
};

export default App;
