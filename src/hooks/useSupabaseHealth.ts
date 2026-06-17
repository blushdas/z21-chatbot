import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import logger from '@/utils/logger';

export type ServiceStatus = 'online' | 'degraded' | 'offline';

export interface ServiceHealthState {
  database: ServiceStatus;
  auth: ServiceStatus;
  realtime: ServiceStatus;
  edgeFunctions: ServiceStatus;
}

export interface HealthState {
  isOnline: boolean;
  isDegraded: boolean;
  isOffline: boolean;
  browserOnline: boolean;
  lastSuccessfulPing: Date | null;
  lastError: string | null;
  services: ServiceHealthState;
  reconnecting: boolean;
  syncProgress: number; // 0-100 for sync progress indicator
}

const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const DEGRADED_THRESHOLD = 5000; // Consider degraded if response > 5s

export const useSupabaseHealth = () => {
  const [healthState, setHealthState] = useState<HealthState>({
    isOnline: navigator.onLine,
    isDegraded: false,
    isOffline: !navigator.onLine,
    browserOnline: navigator.onLine,
    lastSuccessfulPing: null,
    lastError: null,
    services: {
      database: navigator.onLine ? 'online' : 'offline',
      auth: navigator.onLine ? 'online' : 'offline',
      realtime: navigator.onLine ? 'online' : 'offline',
      edgeFunctions: navigator.onLine ? 'online' : 'offline',
    },
    reconnecting: false,
    syncProgress: 0,
  });

  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wasOfflineRef = useRef(!navigator.onLine);
  const consecutiveFailuresRef = useRef(0);

  // Check database health with a lightweight query
  const checkDatabaseHealth = useCallback(async (): Promise<ServiceStatus> => {
    try {
      const startTime = Date.now();
      const { error } = await supabase
        .from('chats')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        logger.warn('Database health check failed:', error.message);
        return 'offline';
      }
      
      return responseTime > DEGRADED_THRESHOLD ? 'degraded' : 'online';
    } catch (error) {
      logger.error('Database health check error:', error);
      return 'offline';
    }
  }, []);

  // Check auth health
  const checkAuthHealth = useCallback(async (): Promise<ServiceStatus> => {
    try {
      const startTime = Date.now();
      const { data, error } = await supabase.auth.getSession();
      const responseTime = Date.now() - startTime;
      
      if (error) {
        // Session errors are expected when not logged in - not a service failure
        if (error.message.includes('session') || error.message.includes('refresh')) {
          return 'online';
        }
        logger.warn('Auth health check failed:', error.message);
        return 'offline';
      }
      
      return responseTime > DEGRADED_THRESHOLD ? 'degraded' : 'online';
    } catch (error) {
      logger.error('Auth health check error:', error);
      return 'offline';
    }
  }, []);

  // Perform full health check
  const performHealthCheck = useCallback(async () => {
    if (!navigator.onLine) {
      setHealthState(prev => ({
        ...prev,
        isOnline: false,
        isDegraded: false,
        isOffline: true,
        browserOnline: false,
        services: {
          database: 'offline',
          auth: 'offline',
          realtime: 'offline',
          edgeFunctions: 'offline',
        },
      }));
      return;
    }

    try {
      // Run health checks in parallel
      const [dbStatus, authStatus] = await Promise.all([
        checkDatabaseHealth(),
        checkAuthHealth(),
      ]);

      // Determine overall status
      const allOnline = dbStatus === 'online' && authStatus === 'online';
      const anyOffline = dbStatus === 'offline' || authStatus === 'offline';
      const anyDegraded = dbStatus === 'degraded' || authStatus === 'degraded';

      if (allOnline) {
        consecutiveFailuresRef.current = 0;
      } else if (anyOffline) {
        consecutiveFailuresRef.current++;
      }

      setHealthState(prev => {
        const wasOffline = prev.isOffline;
        const nowOnline = !anyOffline;
        
        return {
          ...prev,
          isOnline: allOnline,
          isDegraded: anyDegraded && !anyOffline,
          isOffline: anyOffline,
          browserOnline: navigator.onLine,
          lastSuccessfulPing: allOnline ? new Date() : prev.lastSuccessfulPing,
          lastError: anyOffline ? 'Service temporarily unavailable' : null,
          services: {
            database: dbStatus,
            auth: authStatus,
            realtime: prev.services.realtime, // Updated via realtime subscription
            edgeFunctions: prev.services.edgeFunctions,
          },
          reconnecting: wasOffline && nowOnline,
        };
      });

    } catch (error) {
      logger.error('Health check failed:', error);
      consecutiveFailuresRef.current++;
      
      // Only mark as offline after multiple consecutive failures
      if (consecutiveFailuresRef.current >= 3) {
        setHealthState(prev => ({
          ...prev,
          isOnline: false,
          isDegraded: false,
          isOffline: true,
          lastError: 'Unable to reach services',
        }));
      }
    }
  }, [checkDatabaseHealth, checkAuthHealth]);

  // Browser online/offline event handlers
  useEffect(() => {
    const handleOnline = () => {
      logger.info('Browser came online');
      wasOfflineRef.current = false;
      
      setHealthState(prev => ({
        ...prev,
        browserOnline: true,
        reconnecting: true,
      }));
      
      // Immediately check health when coming back online
      performHealthCheck();
    };

    const handleOffline = () => {
      logger.info('Browser went offline');
      wasOfflineRef.current = true;
      
      setHealthState(prev => ({
        ...prev,
        isOnline: false,
        isDegraded: false,
        isOffline: true,
        browserOnline: false,
        reconnecting: false,
        services: {
          database: 'offline',
          auth: 'offline',
          realtime: 'offline',
          edgeFunctions: 'offline',
        },
      }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performHealthCheck]);

  // Periodic health checks
  useEffect(() => {
    // Initial health check
    performHealthCheck();

    // Set up interval for periodic checks
    healthCheckIntervalRef.current = setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [performHealthCheck]);

  // Listen to Supabase realtime connection status
  useEffect(() => {
    const channel = supabase.channel('health-monitor');
    
    channel
      .on('system', { event: '*' }, (payload) => {
        logger.debug('Realtime system event:', payload);
        
        if (payload.extension === 'presence') {
          setHealthState(prev => ({
            ...prev,
            services: {
              ...prev.services,
              realtime: 'online',
            },
          }));
        }
      })
      .subscribe((status) => {
        logger.debug('Realtime subscription status:', status);
        
        const realtimeStatus: ServiceStatus = 
          status === 'SUBSCRIBED' ? 'online' :
          status === 'CHANNEL_ERROR' ? 'offline' :
          status === 'TIMED_OUT' ? 'degraded' : 'online';
        
        setHealthState(prev => ({
          ...prev,
          services: {
            ...prev.services,
            realtime: realtimeStatus,
          },
        }));
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update sync progress (called from offline queue)
  const updateSyncProgress = useCallback((progress: number) => {
    setHealthState(prev => ({
      ...prev,
      syncProgress: progress,
      reconnecting: progress < 100,
    }));
  }, []);

  // Clear reconnecting state
  const clearReconnecting = useCallback(() => {
    setHealthState(prev => ({
      ...prev,
      reconnecting: false,
      syncProgress: 0,
    }));
  }, []);

  // Force a health check
  const forceHealthCheck = useCallback(() => {
    return performHealthCheck();
  }, [performHealthCheck]);

  return {
    ...healthState,
    updateSyncProgress,
    clearReconnecting,
    forceHealthCheck,
  };
};

export default useSupabaseHealth;
