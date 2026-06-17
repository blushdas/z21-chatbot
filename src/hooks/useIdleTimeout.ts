import { useEffect, useCallback, useRef, useState } from 'react';
import { getRememberMePreference } from '@/utils/sessionStorageAdapter';

interface UseIdleTimeoutOptions {
  /** Timeout in milliseconds before auto-logout (default: 15 minutes) */
  timeout?: number;
  /** Time in milliseconds before timeout to show warning (default: 60 seconds) */
  warningTime?: number;
  /** Callback when timeout occurs */
  onTimeout: () => void;
  /** Callback when warning should be shown */
  onWarning: () => void;
  /** Whether the timeout is enabled (typically: user is logged in) */
  enabled?: boolean;
}

interface UseIdleTimeoutReturn {
  /** Whether the warning modal should be shown */
  isWarningShown: boolean;
  /** Remaining seconds until auto-logout */
  remainingTime: number;
  /** Call to extend the session (reset timers) */
  extendSession: () => void;
  /** Manually reset the timer */
  resetTimer: () => void;
}

/**
 * Hook to detect user inactivity and trigger logout
 * Only active for non-"Remember Me" sessions
 */
export const useIdleTimeout = ({
  timeout = 15 * 60 * 1000, // 15 minutes default
  warningTime = 60 * 1000,  // 1 minute warning
  onTimeout,
  onWarning,
  enabled = true
}: UseIdleTimeoutOptions): UseIdleTimeoutReturn => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const warningRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [isWarningShown, setIsWarningShown] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  // Track if "Remember Me" is enabled - skip idle timeout for these sessions
  const shouldSkip = getRememberMePreference();

  const resetTimer = useCallback(() => {
    // Don't run for "Remember Me" sessions or when disabled
    if (shouldSkip || !enabled) return;

    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    setIsWarningShown(false);

    // Set warning timer (fires warningTime ms before timeout)
    warningRef.current = setTimeout(() => {
      setIsWarningShown(true);
      setRemainingTime(Math.ceil(warningTime / 1000));
      onWarning();
    }, timeout - warningTime);

    // Set logout timer
    timeoutRef.current = setTimeout(() => {
      setIsWarningShown(false);
      onTimeout();
    }, timeout);
  }, [timeout, warningTime, onTimeout, onWarning, enabled, shouldSkip]);

  const extendSession = useCallback(() => {
    setIsWarningShown(false);
    resetTimer();
  }, [resetTimer]);

  // Set up activity listeners
  useEffect(() => {
    if (!enabled || shouldSkip) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    
    // Throttle reset to avoid excessive timer resets
    let lastReset = Date.now();
    const throttledReset = () => {
      const now = Date.now();
      if (now - lastReset > 1000) { // Max once per second
        lastReset = now;
        resetTimer();
      }
    };

    events.forEach(event => {
      window.addEventListener(event, throttledReset, { passive: true });
    });

    // Start the timer
    resetTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, throttledReset);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [resetTimer, enabled, shouldSkip]);

  // Countdown timer for warning display
  useEffect(() => {
    if (!isWarningShown) return;
    
    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isWarningShown]);

  return { 
    isWarningShown, 
    remainingTime, 
    extendSession, 
    resetTimer 
  };
};
