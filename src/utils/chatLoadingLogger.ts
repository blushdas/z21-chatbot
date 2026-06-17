import { supabase } from '@/integrations/supabase/client';

export type ChatLoadFailureType = 
  | 'CHAT_NOT_FOUND'
  | 'LOADING_TIMEOUT'
  | 'MESSAGES_NOT_SYNCED'
  | 'RENDER_ERROR'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

interface ChatLoadFailureContext {
  wasInLocalState?: boolean;
  savedChatsCount?: number;
  loadTimeMs?: number;
  hasCurrentChat?: boolean;
  messagesLoaded?: boolean;
  initialized?: boolean;
  currentChatMessagesLength?: number;
  localMessagesCount?: number;
  isBotTyping?: boolean;
  chatLoadingState?: string;
  url?: string;
  [key: string]: any;
}

/**
 * Logs chat loading failures both to console and Supabase for debugging
 */
export async function logChatLoadFailure(
  userId: string | null | undefined,
  chatId: string,
  failureType: ChatLoadFailureType,
  errorMessage: string,
  context: ChatLoadFailureContext = {}
) {
  const timestamp = new Date().toISOString();
  
  // Always log to console for immediate visibility
  console.error('🚨 CHAT LOAD FAILURE:', {
    timestamp,
    userId: userId || 'anonymous',
    chatId,
    failureType,
    errorMessage,
    context
  });

  // Only log to Supabase if user is authenticated
  if (!userId) {
    console.warn('⚠️ Cannot log to Supabase - user not authenticated');
    return;
  }

  try {
    const { error } = await supabase
      .from('chat_load_failures')
      .insert({
        user_id: userId,
        chat_id: chatId,
        failure_type: failureType,
        error_message: errorMessage,
        context: {
          ...context,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp
        }
      });

    if (error) {
      console.error('❌ Failed to log to Supabase:', error);
    } else {
      console.log('✅ Chat load failure logged to Supabase');
    }
  } catch (err) {
    console.error('❌ Exception while logging to Supabase:', err);
  }
}

/**
 * Logs successful chat load for comparison with failures
 */
export function logChatLoadSuccess(
  chatId: string,
  loadTimeMs: number,
  context: Record<string, any> = {}
) {
  console.log('✅ CHAT LOAD SUCCESS:', {
    chatId,
    loadTimeMs,
    context
  });
}
