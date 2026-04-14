import { useState, useEffect, useCallback } from 'react';
import { f1Api } from '../utils/api';

export function useF1Fetch(fetchFn, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, loading, error, refetch: execute };
}

// Specific hooks
export function useDrivers(sessionKey = 'latest') {
  return useF1Fetch(() => f1Api.getDrivers(sessionKey), [sessionKey]);
}

export function useChampionshipDrivers(sessionKey = 'latest') {
  return useF1Fetch(() => f1Api.getChampionshipDrivers(sessionKey), [sessionKey]);
}

export function useChampionshipTeams(sessionKey = 'latest') {
  return useF1Fetch(() => f1Api.getChampionshipTeams(sessionKey), [sessionKey]);
}

export function useMeetings(year) {
  return useF1Fetch(() => f1Api.getMeetings(year), [year]);
}

export function useSessions(year) {
  return useF1Fetch(() => f1Api.getSessions(year), [year]);
}
