import { useState, useEffect, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export const useSaveStatusIndicator = () => {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  const setSaving = useCallback(() => {
    setStatus('saving');
  }, []);

  const setSuccess = useCallback(() => {
    setStatus('success');
    setLastSaveTime(new Date());
    
    // Auto-hide success indicator after 2 seconds
    setTimeout(() => {
      setStatus('idle');
    }, 2000);
  }, []);

  const setError = useCallback(() => {
    setStatus('error');
    
    // Keep error visible longer (5 seconds)
    setTimeout(() => {
      setStatus('idle');
    }, 5000);
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
  }, []);

  return {
    status,
    lastSaveTime,
    setSaving,
    setSuccess,
    setError,
    reset
  };
};
