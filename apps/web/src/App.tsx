import React from 'react';
import AppShell from './components/layout/AppShell';

export const App: React.FC = () => {
  return (
    <AppShell>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {['Tank 01', 'Tank 02', 'Tank 03', 'Tank 04'].map((tankName, idx) => (
          <div
            key={tankName}
            className="rounded-lg border border-[#30363D] bg-[#161B22] p-5 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium text-sm text-[#F0F6FC]">{tankName}</span>
              <span className="px-2 py-0.5 rounded text-xs font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                NORMAL
              </span>
            </div>
            <div className="my-4">
              <div className="text-3xl font-mono font-semibold text-white tracking-tight">
                {70 + idx * 5}%
              </div>
              <div className="text-xs text-[#8B949E] mt-1 font-mono">FLOW: 0.0 L/m</div>
            </div>
            <div className="w-full bg-[#21262D] rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${70 + idx * 5}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
};

export default App;
