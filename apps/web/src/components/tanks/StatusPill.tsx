import React from 'react';
import { TankStatus } from '../../types/tank';

interface StatusPillProps {
  status: TankStatus;
  isOnline?: boolean;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, isOnline = true }) => {
  const effectiveStatus = !isOnline || status === 'offline' ? 'offline' : status;

  const configMap: Record<
    TankStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    normal: {
      label: 'Normal',
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-400',
      border: 'border-emerald-800/50',
      dot: 'bg-emerald-400',
    },
    low: {
      label: 'Low Level',
      bg: 'bg-amber-950/70',
      text: 'text-amber-400',
      border: 'border-amber-800/60',
      dot: 'bg-amber-400',
    },
    critical: {
      label: 'Critical',
      bg: 'bg-rose-950/80',
      text: 'text-rose-400',
      border: 'border-rose-800/60',
      dot: 'bg-rose-400 animate-ping',
    },
    offline: {
      label: 'Offline',
      bg: 'bg-slate-800/70',
      text: 'text-slate-400',
      border: 'border-slate-700/60',
      dot: 'bg-slate-500',
    },
  };

  const current = configMap[effectiveStatus] || configMap.normal;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${current.bg} ${current.text} ${current.border}`}
      role="status"
      aria-label={`Tank status: ${current.label}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} aria-hidden="true" />
      <span>{current.label}</span>
    </span>
  );
};

export default StatusPill;
