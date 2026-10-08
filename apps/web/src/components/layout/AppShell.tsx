import React, { ReactNode } from 'react';

interface AppShellProps {
  children?: ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#0D1117] text-[#F0F6FC] flex flex-col font-sans selection:bg-sky-900 selection:text-white">
      {/* Top Utility Header */}
      <header className="border-b border-[#30363D] bg-[#161B22]/90 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-sky-900/40 border border-sky-500/30 flex items-center justify-center text-sky-400">
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
              <span className="font-semibold tracking-tight text-white flex items-center gap-2">
                AquaSave
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800/60">
                  SCADA v0.1
                </span>
              </span>
              <p className="text-xs text-[#8B949E] hidden sm:block">
                Smart Rainwater Harvesting & Utility Monitor
              </p>
            </div>
          </div>
          <div id="status-bar-slot" className="flex items-center space-x-4">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0D1117] border border-[#30363D] text-xs font-mono text-[#8B949E]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SYS_READY</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {children || (
          <div className="rounded-lg border border-[#30363D] bg-[#161B22] p-8 text-center">
            <h2 className="text-lg font-medium text-white mb-2">AquaSave Monitoring Core</h2>
            <p className="text-sm text-[#8B949E]">
              System initialized and ready for telemetry ingestion.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#30363D] bg-[#0D1117] px-4 py-3 text-xs text-[#8B949E] text-center font-mono">
        AquaSave Environmental Management Platform &copy; 2026
      </footer>
    </div>
  );
};

export default AppShell;
