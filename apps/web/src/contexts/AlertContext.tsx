import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { AlertEvent } from '../types/tank';
import { useSocket } from './SocketProvider';
import { authFetch } from '../lib/api';

export interface AlertItem extends AlertEvent {
  dismissed?: boolean;
}

interface AlertContextValue {
  alerts: AlertItem[];
  activeBanners: AlertItem[];
  dismissAlert: (alertId: string) => void;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  addAlert: (alert: AlertEvent) => void;
  activeCount: number;
}

const AlertContext = createContext<AlertContextValue | null>(null);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const { socket } = useSocket();

  const addAlert = useCallback((newAlert: AlertEvent) => {
    setAlerts((prev) => {
      // Avoid duplicate alert by ID
      if (prev.some((a) => a._id === newAlert._id)) {
        return prev;
      }
      return [newAlert, ...prev].slice(0, 50); // Keep max 50 in history
    });
  }, []);

  const dismissAlert = useCallback((alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a._id === alertId ? { ...a, dismissed: true } : a)));
  }, []);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      await authFetch(`${apiUrl}/api/v1/alerts/${alertId}/acknowledge`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('Failed to persist alert acknowledgement:', err);
    }

    setAlerts((prev) => prev.map((a) => (a._id === alertId ? { ...a, acknowledged: true } : a)));
  }, []);

  useEffect(() => {
    function handleNewAlert(alert: AlertEvent) {
      addAlert(alert);
    }

    function handleAcknowledgedAlert(payload: { alertId: string; acknowledged: boolean }) {
      setAlerts((prev) =>
        prev.map((a) => (a._id === payload.alertId ? { ...a, acknowledged: true } : a))
      );
    }

    socket.on('alert:new', handleNewAlert);
    socket.on('alert:acknowledged', handleAcknowledgedAlert);
    return () => {
      socket.off('alert:new', handleNewAlert);
      socket.off('alert:acknowledged', handleAcknowledgedAlert);
    };
  }, [socket, addAlert]);

  // Max 3 un-dismissed banners at a time
  const activeBanners = alerts.filter((a) => !a.dismissed && !a.acknowledged).slice(0, 3);

  const activeCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <AlertContext.Provider
      value={{
        alerts,
        activeBanners,
        dismissAlert,
        acknowledgeAlert,
        addAlert,
        activeCount,
      }}
    >
      {children}
    </AlertContext.Provider>
  );
};

export function useAlerts(): AlertContextValue {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlerts must be used within an AlertProvider');
  }
  return context;
}
