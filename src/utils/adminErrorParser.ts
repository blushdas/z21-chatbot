import { FunctionsHttpError } from '@supabase/supabase-js';

export interface ParsedAdminError {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

/**
 * Parses edge function errors from supabase.functions.invoke() calls.
 * Extracts structured error bodies from FunctionsHttpError responses
 * that would otherwise be lost as generic "non-2xx status code" messages.
 */
export async function parseAdminError(error: unknown): Promise<ParsedAdminError> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (body?.error) {
        return {
          message: body.error,
          code: body.code,
          details: body.details,
        };
      }
    } catch {
      // Could not parse response body
    }
  }

  // Fallback to generic message
  return {
    message: (error as Error)?.message || 'An unexpected error occurred',
  };
}

/**
 * Displays a parsed admin error as a toast notification.
 * Handles validation details, known error codes, and generic errors.
 */
export function formatAdminErrorMessage(parsed: ParsedAdminError): { title: string; description?: string } {
  // Validation errors with field-level details
  if (parsed.details && typeof parsed.details === 'object') {
    const fieldMessages = Object.entries(parsed.details)
      .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
      .join('\n');
    return { title: 'Validation Failed', description: fieldMessages };
  }

  // Known error codes
  if (parsed.code === 'USER_EXISTS' || parsed.message.toLowerCase().includes('already exists')) {
    return { title: 'User already exists with this email address' };
  }

  if (parsed.message.toLowerCase().includes('forbidden') || parsed.message.toLowerCase().includes('superadmin')) {
    return { title: 'Permission Denied', description: parsed.message };
  }

  if (parsed.message.toLowerCase().includes('unauthorized') || parsed.message.toLowerCase().includes('invalid authentication')) {
    return { title: 'Authentication Error', description: 'Your session may have expired. Please log in again.' };
  }

  return { title: parsed.message };
}
