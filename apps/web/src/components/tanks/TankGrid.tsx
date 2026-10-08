import React from 'react';
import { useTanks } from '../../contexts/TankContext';
import TankCard from './TankCard';
import SkeletonCard from '../common/SkeletonCard';

interface TankGridProps {
  onSelectTank?: (tankId: string) => void;
  isLoading?: boolean;
}

export const TankGrid: React.FC<TankGridProps> = ({ onSelectTank, isLoading = false }) => {
  const { tanksList, dispatch } = useTanks();

  const handleSelect = (tankId: string) => {
    dispatch({ type: 'SELECT_TANK', payload: tankId });
    if (onSelectTank) {
      onSelectTank(tankId);
    }
  };

  if (isLoading && (!tanksList || tanksList.length === 0)) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!tanksList || tanksList.length === 0) {
    return (
      <div className="rounded-xl border border-[#30363D] bg-[#161B22] p-8 text-center text-[#8B949E]">
        No tanks registered in current facility.
      </div>
    );
  }

  return (
    <section aria-label="Tank Telemetry Grid" className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
        {tanksList.map((tank) => (
          <TankCard key={tank.tankId} tank={tank} onSelect={handleSelect} />
        ))}
      </div>
    </section>
  );
};

export default TankGrid;
