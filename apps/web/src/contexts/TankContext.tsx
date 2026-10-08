import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  Dispatch,
} from 'react';
import { Tank, ReadingEvent, OfflineEvent } from '../types/tank';
import { useSocket } from './SocketProvider';

interface TankState {
  tanks: Record<string, Tank>;
  selectedTankId: string | null;
  lastDataReceivedAt: Date | null;
}

type TankAction =
  | { type: 'SET_TANKS'; payload: Tank[] }
  | { type: 'UPDATE_TANK'; payload: ReadingEvent }
  | { type: 'SET_OFFLINE'; payload: OfflineEvent }
  | { type: 'SELECT_TANK'; payload: string | null };

const initialTanksArray: Tank[] = [
  {
    tankId: 'tank-01',
    name: 'Main Cistern',
    capacityLiters: 10000,
    location: 'Building A - North Roof',
    currentWaterLevel: 76,
    currentFlowRate: 2.3,
    status: 'normal',
    isOnline: true,
    lastSeenAt: new Date().toISOString(),
    thresholds: { lowPercent: 20, criticalPercent: 10 },
    analytics: {
      rollingRateLph: 138,
      hoursToEmpty: 36,
      leakageFlag: false,
      leakageFlagReason: null,
      totalHarvestedLiters: 1420,
      estimatedSavingsUsd: 4.26,
      co2SavedKg: 0.423,
    },
  },
  {
    tankId: 'tank-02',
    name: 'East Reserve',
    capacityLiters: 5000,
    location: 'Building B - East Courtyard',
    currentWaterLevel: 62,
    currentFlowRate: 1.1,
    status: 'normal',
    isOnline: true,
    lastSeenAt: new Date().toISOString(),
    thresholds: { lowPercent: 25, criticalPercent: 15 },
    analytics: {
      rollingRateLph: 66,
      hoursToEmpty: 48,
      leakageFlag: false,
      leakageFlagReason: null,
      totalHarvestedLiters: 980,
      estimatedSavingsUsd: 2.94,
      co2SavedKg: 0.292,
    },
  },
  {
    tankId: 'tank-03',
    name: 'Garden Cistern',
    capacityLiters: 7500,
    location: 'Perimeter Grounds - Sector 3',
    currentWaterLevel: 45,
    currentFlowRate: 0.0,
    status: 'normal',
    isOnline: true,
    lastSeenAt: new Date().toISOString(),
    thresholds: { lowPercent: 20, criticalPercent: 10 },
    analytics: {
      rollingRateLph: 0,
      hoursToEmpty: null,
      leakageFlag: false,
      leakageFlagReason: null,
      totalHarvestedLiters: 850,
      estimatedSavingsUsd: 2.55,
      co2SavedKg: 0.253,
    },
  },
  {
    tankId: 'tank-04',
    name: 'Auxiliary Reservoir',
    capacityLiters: 12000,
    location: 'Service Facility - Basement',
    currentWaterLevel: 88,
    currentFlowRate: 3.5,
    status: 'normal',
    isOnline: true,
    lastSeenAt: new Date().toISOString(),
    thresholds: { lowPercent: 15, criticalPercent: 8 },
    analytics: {
      rollingRateLph: 210,
      hoursToEmpty: 42,
      leakageFlag: false,
      leakageFlagReason: null,
      totalHarvestedLiters: 2310,
      estimatedSavingsUsd: 6.93,
      co2SavedKg: 0.688,
    },
  },
];

const initialTanksRecord: Record<string, Tank> = initialTanksArray.reduce(
  (acc, t) => {
    acc[t.tankId] = t;
    return acc;
  },
  {} as Record<string, Tank>
);

const initialState: TankState = {
  tanks: initialTanksRecord,
  selectedTankId: null,
  lastDataReceivedAt: new Date(),
};

function tankReducer(state: TankState, action: TankAction): TankState {
  switch (action.type) {
    case 'SET_TANKS': {
      const newRecord = action.payload.reduce(
        (acc, t) => {
          acc[t.tankId] = t;
          return acc;
        },
        {} as Record<string, Tank>
      );
      return {
        ...state,
        tanks: newRecord,
      };
    }
    case 'UPDATE_TANK': {
      const event = action.payload;
      const target = state.tanks[event.tankId];
      if (!target) return state;

      const updatedTank: Tank = {
        ...target,
        currentWaterLevel: event.waterLevel,
        currentFlowRate: event.flowRate,
        status: event.status,
        isOnline: event.isOnline,
        lastSeenAt: event.timestamp,
      };

      return {
        ...state,
        lastDataReceivedAt: new Date(),
        tanks: {
          ...state.tanks,
          [event.tankId]: updatedTank,
        },
      };
    }
    case 'SET_OFFLINE': {
      const event = action.payload;
      const target = state.tanks[event.tankId];
      if (!target) return state;

      const updatedTank: Tank = {
        ...target,
        isOnline: false,
        status: 'offline',
        lastSeenAt: event.lastSeenAt,
      };

      return {
        ...state,
        tanks: {
          ...state.tanks,
          [event.tankId]: updatedTank,
        },
      };
    }
    case 'SELECT_TANK':
      return {
        ...state,
        selectedTankId: action.payload,
      };
    default:
      return state;
  }
}

interface TankContextValue {
  state: TankState;
  dispatch: Dispatch<TankAction>;
  tanksList: Tank[];
}

const TankContext = createContext<TankContextValue | null>(null);

export const TankProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(tankReducer, initialState);
  const { socket } = useSocket();

  useEffect(() => {
    function handleReadingNew(data: ReadingEvent) {
      dispatch({ type: 'UPDATE_TANK', payload: data });
    }

    function handleDeviceOffline(data: OfflineEvent) {
      dispatch({ type: 'SET_OFFLINE', payload: data });
    }

    socket.on('reading:new', handleReadingNew);
    socket.on('device:offline', handleDeviceOffline);

    return () => {
      socket.off('reading:new', handleReadingNew);
      socket.off('device:offline', handleDeviceOffline);
    };
  }, [socket]);

  const tanksList = Object.values(state.tanks);

  return (
    <TankContext.Provider value={{ state, dispatch, tanksList }}>{children}</TankContext.Provider>
  );
};

export function useTanks(): TankContextValue {
  const context = useContext(TankContext);
  if (!context) {
    throw new Error('useTanks must be used within a TankProvider');
  }
  return context;
}
