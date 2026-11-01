import { useState, useEffect } from 'react';
import {
  searchPG,
  getPG,
  batchPG,
  getPreferences,
  savePreferences,
  askAssistant,
} from '../api/pgmateApi';

/**
 * Hook: Search PGs (offline, no React Query)
 * Returns { data, isLoading, error }
 */
export const useSearchPG = (params) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!params) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await searchPG(params);
        setData(result);
      } catch (err) {
        setError(err.message || 'Search failed');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params]);

  return { data, isLoading, error };
};

/**
 * Hook: Get single PG
 */
export const useGetPG = (id, isAuthenticated = false) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getPG(id, isAuthenticated);
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to fetch');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isAuthenticated]);

  return { data, isLoading, error };
};

/**
 * Hook: Batch get PGs
 */
export const useBatchPG = (ids, isAuthenticated = false) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ids || ids.length === 0) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await batchPG(ids, isAuthenticated);
        setData(result);
      } catch (err) {
        setError(err.message || 'Batch fetch failed');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [ids, isAuthenticated]);

  return { data, isLoading, error };
};

/**
 * Hook: Get user preferences
 */
export const useGetPreferences = (userId) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await getPreferences();
        setData(result);
      } catch (err) {
        setError(err.message || 'Failed to fetch preferences');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  return { data, isLoading, error };
};

/**
 * Hook: Save preferences (mutation-like)
 */
export const useSavePreferences = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (prefs) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await savePreferences(prefs);
      return result;
    } catch (err) {
      const msg = err.message || 'Save failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, isPending, error };
};

/**
 * Hook: Ask assistant (mutation-like)
 */
export const useAskAssistant = () => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  const mutateAsync = async ({ message, history }) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await askAssistant(message, history);
      return result;
    } catch (err) {
      const msg = err.message || 'Request failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsPending(false);
    }
  };

  return { mutateAsync, isPending, error };
};
