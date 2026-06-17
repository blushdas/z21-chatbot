/**
 * Centralized logging utility with environment-based filtering
 * - debug/timing: Only in development
 * - info/warn/error: Always logged
 */

const isDev = import.meta.env.DEV;

export const logger = {
  /** Debug logs - only in development */
  debug: (...args: unknown[]) => {
    if (isDev) console.log('[DEBUG]', ...args);
  },
  
  /** Info logs - always shown */
  info: (...args: unknown[]) => {
    console.log('[INFO]', ...args);
  },
  
  /** Warning logs - always shown */
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },
  
  /** Error logs - always shown */
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
  
  /** Timing logs - only in development */
  timing: (label: string, ms: number) => {
    if (isDev) console.log(`⏱️ ${label}: ${ms}ms`);
  },
  
  /** Group logs - only in development */
  group: (label: string) => {
    if (isDev) console.group(label);
  },
  
  /** End group - only in development */
  groupEnd: () => {
    if (isDev) console.groupEnd();
  },
  
  /** Table logs - only in development */
  table: (data: unknown) => {
    if (isDev) console.table(data);
  }
};

export default logger;
