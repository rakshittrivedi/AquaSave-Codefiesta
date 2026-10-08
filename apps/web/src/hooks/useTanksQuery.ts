import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Tank } from '../types/tank';
import { useTanks } from '../contexts/TankContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchTanks(): Promise<Tank[]> {
  const res = await fetch(`${API_URL}/api/v1/tanks`);
  if (!res.ok) {
    throw new Error(`Failed to fetch tanks: HTTP ${res.status}`);
  }
  return res.json();
}

export function useTanksQuery() {
  const { dispatch } = useTanks();

  const query = useQuery<Tank[], Error>({
    queryKey: ['tanks'],
    queryFn: fetchTanks,
    staleTime: 10000,
    refetchInterval: 30000, // 30-second background re-sync
  });

  useEffect(() => {
    if (query.data && query.data.length > 0) {
      dispatch({ type: 'SET_TANKS', payload: query.data });
    }
  }, [query.data, dispatch]);

  return query;
}
