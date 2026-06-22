import { useCallback, useEffect, useRef, useState } from 'react';
import { API_BASE_URL, getHealth } from '../services/api';

const POLL_INTERVAL_MS = 15000;

export function useBackendStatus({ poll = true } = {}) {
  const [status, setStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);
  const checkingRef = useRef(false);

  const checkBackend = useCallback(async () => {
    if (checkingRef.current) return null;

    checkingRef.current = true;
    setStatus((current) => (current === 'online' ? 'online' : 'checking'));

    try {
      await getHealth();
      setStatus('online');
      setLastChecked(Date.now());
      return 'online';
    } catch {
      setStatus('offline');
      setLastChecked(Date.now());
      return 'offline';
    } finally {
      checkingRef.current = false;
    }
  }, []);

  useEffect(() => {
    checkBackend();
  }, [checkBackend]);

  useEffect(() => {
    if (!poll) return undefined;

    const intervalId = window.setInterval(() => {
      checkBackend();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [checkBackend, poll]);

  const markOffline = useCallback(() => {
    setStatus('offline');
    setLastChecked(Date.now());
  }, []);

  const markOnline = useCallback(() => {
    setStatus('online');
    setLastChecked(Date.now());
  }, []);

  return {
    status,
    isChecking: status === 'checking',
    isOnline: status === 'online',
    isOffline: status === 'offline',
    apiBaseUrl: API_BASE_URL,
    lastChecked,
    checkBackend,
    markOffline,
    markOnline,
  };
}
