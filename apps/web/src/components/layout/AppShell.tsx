import React, { ReactNode } from 'react';
import StatusBar from './StatusBar';
import AlertBanner from '../alerts/AlertBanner';
import { useAlerts } from '../../contexts/AlertContext';

interface AppShellProps {
  children?: ReactNode;
  activeRoute?: string;
  onNavigate?: (route: string) => void;
  onOpenAlerts?: () => void;
  onLogout?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  activeRoute = '/',
  onNavigate,
  onOpenAlerts,
  onLogout,
}) => {
  const { activeCount } = useAlerts();

  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] flex flex-col font-sans selection:bg-sky-900 selection:text-white">
      {/* Top SCADA Utility Navigation Bar */}
      <header className="border-b border-[#30363D] bg-[#161B22]/95 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand & Nav Links */}
          <div className="flex items-center space-x-6">
            <button
              onClick={() => onNavigate?.('/')}
              className="flex items-center space-x-3 text-left focus:outline-none focus:ring-1 focus:ring-[#58A6FF] rounded-md p-1"
              aria-label="AquaSave Home Dashboard"
            >
              <div className="w-8 h-8 rounded bg-sky-950 border border-sky-500/40 flex items-center justify-center text-sky-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </div>
              <div>
                <span className="font-semibold tracking-tight text-white flex items-center gap-2 text-base">
                  AquaSave
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                    SCADA
                  </span>
                </span>
                <p className="text-[11px] text-[#8B949E] hidden sm:block">
                  Smart Rainwater Management System
                </p>
              </div>
            </button>

            {/* Navigation tabs */}
            <nav className="flex items-center space-x-2 text-xs font-mono">
              <button
                onClick={() => onNavigate?.('/')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  activeRoute === '/'
                    ? 'bg-[#21262D] text-white border border-[#30363D]'
                    : 'text-[#8B949E] hover:text-[#F0F6FC] hover:bg-[#21262D]/50'
                }`}
              >
                Dashboard
              </button>
              {activeRoute.startsWith('/tank/') && (
                <span className="px-3 py-1.5 rounded-md bg-[#21262D] text-sky-400 border border-sky-800/40">
                  Tank Detail
                </span>
              )}
            </nav>
          </div>

          {/* Realtime Live StatusBar & Logout */}
          <div className="flex items-center gap-3 justify-end">
            <StatusBar activeAlertCount={activeCount} onOpenAlerts={onOpenAlerts} />
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-2.5 py-1 rounded-md text-xs font-mono text-[#8B949E] hover:text-white bg-[#0D1117] hover:bg-[#21262D] border border-[#30363D] transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500"
                aria-label="Sign out of SCADA console"
                title="Sign out of SCADA console"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Critical Alert Banners */}
      <AlertBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">{children}</main>

      {/* Industrial Footer */}
      <footer className="border-t border-[#30363D] bg-[#0D1117] px-4 py-4 text-xs text-[#8B949E] text-center font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AquaSave Environmental Telemetry Platform &bull; Hackathon MVP v0.1.0</span>
          <span>Open-Meteo &bull; Hardware Integration Layer Ready</span>
        </div>
      </footer>
    </div>
  );
};

export default AppShell;
