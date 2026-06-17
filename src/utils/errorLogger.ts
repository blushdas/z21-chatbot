 /**
  * Centralized error logging utility
  * Prepared for future Sentry integration
  */
 
 interface ErrorContext {
   componentStack?: string;
   type?: string;
   userId?: string;
   route?: string;
   action?: string;
   metadata?: Record<string, unknown>;
   [key: string]: unknown;
 }
 
 interface LoggedError {
   message: string;
   stack?: string;
   context: ErrorContext;
   timestamp: string;
   url: string;
   userAgent: string;
 }
 
 /**
  * Log an error with context
  * Currently logs to console, prepared for Sentry integration
  * 
  * @param error - The error object or message
  * @param context - Additional context about the error
  */
 export function logError(
   error: Error | string,
   context: ErrorContext = {}
 ): void {
   const errorObj = typeof error === 'string' ? new Error(error) : error;
   
   const loggedError: LoggedError = {
     message: errorObj.message,
     stack: errorObj.stack,
     context,
     timestamp: new Date().toISOString(),
     url: typeof window !== 'undefined' ? window.location.href : 'unknown',
     userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
   };
 
   // Console logging (always)
   console.error('[Error Logger]', loggedError);
 
   // TODO: Sentry integration
   // if (typeof Sentry !== 'undefined') {
   //   Sentry.captureException(errorObj, {
   //     extra: context,
   //   });
   // }
 
   // TODO: Analytics integration
   // trackEvent('error', {
   //   error_message: errorObj.message,
   //   error_type: context.type,
   // });
 }
 
 /**
  * Log a warning (non-critical issue)
  * 
  * @param message - Warning message
  * @param context - Additional context
  */
 export function logWarning(
   message: string,
   context: ErrorContext = {}
 ): void {
   console.warn('[Warning Logger]', {
     message,
     context,
     timestamp: new Date().toISOString(),
     url: typeof window !== 'undefined' ? window.location.href : 'unknown',
   });
 
   // TODO: Sentry breadcrumb
   // Sentry.addBreadcrumb({
   //   category: 'warning',
   //   message,
   //   level: 'warning',
   //   data: context,
   // });
 }
 
 /**
  * Log an info message (for monitoring/debugging)
  * 
  * @param message - Info message
  * @param context - Additional context
  */
 export function logInfo(
   message: string,
   context: ErrorContext = {}
 ): void {
   if (process.env.NODE_ENV === 'development') {
     console.info('[Info Logger]', {
       message,
       context,
       timestamp: new Date().toISOString(),
     });
   }
 
   // TODO: Sentry breadcrumb
   // Sentry.addBreadcrumb({
   //   category: 'info',
   //   message,
   //   level: 'info',
   //   data: context,
   // });
 }
 
 /**
  * Create a scoped logger with preset context
  * Useful for component-specific logging
  * 
  * @param scope - Scope name (e.g., component name)
  * @returns Scoped logging functions
  */
 export function createScopedLogger(scope: string) {
   return {
     error: (error: Error | string, context?: ErrorContext) =>
       logError(error, { ...context, scope }),
     warning: (message: string, context?: ErrorContext) =>
       logWarning(message, { ...context, scope }),
     info: (message: string, context?: ErrorContext) =>
       logInfo(message, { ...context, scope }),
   };
 }