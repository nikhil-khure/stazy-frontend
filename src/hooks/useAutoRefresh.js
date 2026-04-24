import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for automatic data fetching with refresh capability
 * Solves Requirement 36: Automatic UI updates without page reload
 */
export function useAutoRefresh(fetchFunction, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchFunction()
      .then(result => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(err => {
        if (active) {
          setError(err.message || 'Failed to fetch data');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchFunction, refreshKey, ...dependencies]);

  return { data, loading, error, refresh };
}

/**
 * Hook for managing mutations with automatic refresh
 */
export function useMutation(mutationFunction, onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutationFunction(...args);
      setLoading(false);
      if (onSuccess) {
        onSuccess(result);
      }
      return result;
    } catch (err) {
      setError(err.message || 'Operation failed');
      setLoading(false);
      throw err;
    }
  }, [mutationFunction, onSuccess]);

  return { mutate, loading, error };
}
