
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageType, ChatMode } from '@/components/ChatInterface';
import { useToast } from '@/hooks/use-toast';

// Retry configuration
const RETRY_CONFIG = {
  maxAttempts: 3,
  baseDelayMs: 1000,  // Start with 1 second
  maxDelayMs: 10000,  // Cap at 10 seconds
  backoffMultiplier: 2
};

// Calculate delay with exponential backoff + jitter
const getRetryDelay = (attempt: number): number => {
  const exponentialDelay = RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, RETRY_CONFIG.maxDelayMs);
  // Add jitter (±20%) to prevent thundering herd
  const jitter = cappedDelay * 0.2 * (Math.random() - 0.5);
  return Math.round(cappedDelay + jitter);
};

// Sleep helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Sanitize message content to remove problematic Unicode characters
const sanitizeMessageContent = (content: string): string => {
  if (!content) return content;
  
  return content
    // Remove null characters (most common cause of "unsupported Unicode escape sequence")
    .replace(/\u0000/g, '')
    // Remove other problematic control characters (U+0001 through U+001F except tab, newline, carriage return)
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    // Fix any malformed Unicode escape sequences
    .replace(/\\u0000/g, '');
};

// Deep sanitize any value (handles strings, arrays, objects recursively)
const deepSanitize = (value: any): any => {
  if (value === null || value === undefined) {
    return value;
  }
  
  if (typeof value === 'string') {
    return sanitizeMessageContent(value);
  }
  
  // Handle Date objects by converting to ISO string
  if (value instanceof Date) {
    // Validate date before calling toISOString to prevent RangeError: Invalid time value
    if (!isNaN(value.getTime())) {
      return value.toISOString();
    }
    // Invalid date - return current time as fallback
    console.warn('⚠️ Invalid Date detected during sanitization, using current time');
    return new Date().toISOString();
  }
  
  if (Array.isArray(value)) {
    return value.map(item => deepSanitize(item));
  }
  
  if (typeof value === 'object') {
    const sanitized: any = {};
    for (const key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        sanitized[key] = deepSanitize(value[key]);
      }
    }
    return sanitized;
  }
  
  return value; // numbers, booleans, etc. pass through unchanged
};

// Sanitize all messages before saving (deep sanitization of all nested fields)
const sanitizeMessages = (messages: MessageType[]): MessageType[] => {
  return messages.map(msg => deepSanitize(msg));
};

// Retry wrapper with exponential backoff
const saveWithRetry = async (
  chatId: string,
  updateData: any,
  userId: string
): Promise<any> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        const delay = getRetryDelay(attempt - 1);
        console.log(`🔄 Retry attempt ${attempt + 1}/${RETRY_CONFIG.maxAttempts} after ${delay}ms delay`);
        await sleep(delay);
      }
      
      const { data, error } = await supabase
        .from('chats')
        .update(updateData)
        .eq('id', chatId)
        .eq('user_id', userId)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      if (attempt > 0) {
        console.log(`✅ Save succeeded on retry attempt ${attempt + 1}`);
      }
      
      return data;
    } catch (error: any) {
      lastError = error as Error;
      console.warn(`⚠️ Save attempt ${attempt + 1} failed:`, error.message);
      
      // Don't retry on certain errors (e.g., auth errors, not found)
      if (error.code === 'PGRST116' || error.code === '42501') {
        console.error('❌ Non-retryable error, aborting retry attempts');
        throw error;
      }
    }
  }
  
  // All retries exhausted
  console.error(`❌ All ${RETRY_CONFIG.maxAttempts} save attempts failed`);
  throw lastError;
};

export const useChatSupabaseOperations = (userId?: string) => {
  const { toast } = useToast();

  const saveToSupabase = useCallback(async (
    chatId: string,
    messages: MessageType[],
    mode: ChatMode,
    title?: string,
    forceUpdateTimestamp?: boolean,
    modeChangeEvents?: Array<{id: string, type: 'mode' | 'model' | 'power' | 'blueprint', value: string, timestamp: string}>
  ) => {
    if (!userId || chatId.startsWith('guest-') || chatId.startsWith('temp-')) {
      return;
    }

    const now = new Date().toISOString();
    const updateData: any = {
      messages: sanitizeMessages(messages),
      mode,
      is_typing_title: false
    };

    // Only update timestamp when explicitly requested or when title changes
    if (title || forceUpdateTimestamp) {
      updateData.updated_at = now;
    }

    if (title) {
      updateData.title = title;
    }

    // Save mode change events if provided
    if (modeChangeEvents !== undefined) {
      updateData.mode_change_events = modeChangeEvents;
    }

    const supabaseStartTime = Date.now();
    
    // Check if chat exists to decide UPDATE vs INSERT
    const { data: existingChat } = await supabase
      .from('chats')
      .select('id, title')
      .eq('id', chatId)
      .eq('user_id', userId)
      .maybeSingle();

    let data;
    let error;

    if (existingChat) {
      // UPDATE - preserve existing title unless explicitly provided
      const updatePayload: any = { ...updateData };
      if (title) {
        updatePayload.title = title;
      }
      // Don't include 'New Chat' fallback - keep existing title
      
      const result = await supabase
        .from('chats')
        .update(updatePayload)
        .eq('id', chatId)
        .eq('user_id', userId)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    } else {
      // INSERT - new chat needs a title
      const insertPayload = {
        id: chatId,
        user_id: userId,
        title: title || 'New Chat',
        ...updateData
      };
      
      const result = await supabase
        .from('chats')
        .insert(insertPayload)
        .select()
        .single();
      
      data = result.data;
      error = result.error;
    }
    
    if (error) {
      console.error('❌ Save failed:', error);
      throw error;
    }
    
    const supabaseEndTime = Date.now();

    if (title) {
      console.log(`🏷️ 💾 Title "${title}" saved to database for chat ${chatId} (${supabaseEndTime - supabaseStartTime}ms)`);
      
      // Dispatch fallback UI event for title updates (works even if real-time is down)
      window.dispatchEvent(new CustomEvent('chatTitleSaved', {
        detail: { chatId, title, updatedAt: now }
      }));
    }

    return data;
  }, [userId, toast]);

  return {
    saveToSupabase
  };
};
