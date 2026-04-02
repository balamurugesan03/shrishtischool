import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const execute = useCallback(async (apiCall, options = {}) => {
    const { successMessage, errorMessage, onSuccess, onError } = options;
    setLoading(true);
    try {
      const result = await apiCall();
      if (successMessage) {
        enqueueSnackbar(successMessage, { variant: 'success' });
      }
      if (onSuccess) onSuccess(result);
      return result;
    } catch (error) {
      const msg = errorMessage || error.message || 'An error occurred';
      enqueueSnackbar(msg, { variant: 'error' });
      if (onError) onError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  return { loading, execute };
};

export const useFetch = (apiCall, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiCall();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, deps);

  return { data, loading, error, refetch: fetch };
};
