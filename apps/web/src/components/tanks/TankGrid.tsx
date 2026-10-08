import React from 'react';
import { useTanks } from '../../contexts/TankContext';
import TankCard from './TankCard';

interface TankGridProps {
  onSelectTank?: (tankId: string) => void;
}

export const TankGrid: React.FC<TankGridProps> = ({ onSelectTank }) => {
  const { tanksList, dispatch } = useTanks();

  const handleSelect = (tankId: string) => {
    dispatch({ type: 'SELECT_TANK', payload: tankId });
    if (onSelectTank) {
      onSelectTank(tankId);
    }
  };

  if (!tanksList || tanksList.length === 0) {
    return (
      <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-8 text-center text-[#8B949E]">
        No tanks registered in current facility.
      </div>
    );
  }

  return (
    <section aria-label="Tank Telemetry Grid" className="w-full">
      {/* 2x2 grid on desktop (lg:grid-cols-2), single column below 640px (grid-cols-1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
        {tanksList.map((tank) => (
          <TankCard key={tank.tankId} tank={tank} onSelect={handleSelect} />
        ))}
      </div>
    </section>
  );
};

export default TankGrid;
