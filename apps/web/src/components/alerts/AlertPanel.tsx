import React, { useEffect, useState, useCallback } from 'react';
import { useAlerts } from '../../contexts/AlertContext';
import { AlertEvent } from '../../types/tank';

export interface AlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ isOpen, onClose }) => {
  const { acknowledgeAlert } = useAlerts();
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/v1/alerts?limit=20`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAlerts(data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch alerts list:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch alerts whenever panel opens
  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen, fetchAlerts]);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleAcknowledge = async (alertId: string) => {
    try {
      setAcknowledgingId(alertId);
      await acknowledgeAlert(alertId);
      // Update local panel state
      setAlerts((prev) => prev.map((a) => (a._id === alertId ? { ...a, acknowledged: true } : a)));
    } finally {
      setAcknowledgingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Alerts Log and History"
      className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end"
    >
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Slide-in Drawer Container */}
      <div className="relative w-full max-w-md h-full bg-[#161B22] border-l border-[#30363D] shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#21262D] flex items-center justify-between bg-[#0D1117]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-950/70 border border-rose-800/80 flex items-center justify-center text-rose-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Facility Alerts Log</h2>
              <p className="text-xs text-[#8B949E]">Latest 20 system anomalies and thresholds</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-[#21262D] focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Close alerts panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading && alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 font-mono text-xs">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span>Loading telemetry alert log…</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 font-mono text-xs text-center p-6">
              <svg
                className="w-8 h-8 text-emerald-500/60 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-slate-300 font-semibold mb-1">No Alerts Recorded</span>
              <span>All facility cistern thresholds and telemetry are nominal.</span>
            </div>
          ) : (
            alerts.map((alert) => {
              const isAcknowledged = alert.acknowledged;
              const typeColor =
                {
                  CRITICAL_WATER: 'bg-rose-950/80 border-rose-800 text-rose-300',
                  LOW_WATER: 'bg-amber-950/80 border-amber-800 text-amber-300',
                  LEAKAGE_SUSPECTED: 'bg-orange-950/80 border-orange-800 text-orange-300',
                  DEVICE_OFFLINE: 'bg-slate-800 border-slate-700 text-slate-300',
                }[alert.type] || 'bg-slate-800 border-slate-700 text-slate-300';

              return (
                <div
                  key={alert._id}
                  className={`rounded-lg border p-3.5 transition-all ${
                    isAcknowledged
                      ? 'bg-[#0D1117]/60 border-[#21262D] opacity-60'
                      : 'bg-[#161B22] border-[#30363D] hover:border-[#58A6FF]/40 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border uppercase tracking-wider ${typeColor}`}
                    >
                      {alert.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-[#8B949E]">
                      {new Date(alert.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 font-medium mb-2.5">{alert.message}</p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8B949E] pt-2 border-t border-[#21262D]">
                    <span>
                      Tank: <span className="text-white font-semibold">{alert.tankId}</span> (
                      {alert.level}%)
                    </span>

                    {isAcknowledged ? (
                      <span className="flex items-center gap-1 text-emerald-400 font-medium text-xs">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Acknowledged
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAcknowledge(alert._id)}
                        disabled={acknowledgingId === alert._id}
                        className="px-2.5 py-1 rounded bg-[#21262D] hover:bg-emerald-950 hover:text-emerald-300 hover:border-emerald-800/80 text-xs font-mono font-medium text-sky-400 border border-[#30363D] transition-colors focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-50"
                      >
                        {acknowledgingId === alert._id ? 'Saving…' : 'Acknowledge'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#21262D] bg-[#0D1117] flex items-center justify-between text-xs font-mono text-[#8B949E]">
          <span>Total: {alerts.length} events</span>
          <button
            onClick={fetchAlerts}
            className="hover:text-white flex items-center gap-1 focus:outline-none"
          >
            Refresh Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertPanel;
