import { supabase } from '@/integrations/supabase/client';

export type ProcessingPowerValue = 'auto' | 'instant' | 'thinking' | 'pro';

export interface PineconeChatRequest {
  message: string;
  mode: string;
  length: string;
  responseMode?: string; // Response mode for different answer styles
  subPrompts?: string[];
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  chatId?: string; // Chat ID for backend logs
  fastMode?: boolean; // Fast mode flag
  debugMode?: boolean; // Debug mode flag
  processingPower?: ProcessingPowerValue; // Instant / Thinking / Pro tier
  modelOverride?: string; // Model selection override
  skipRAG?: boolean; // When true, bypass Pinecone knowledge base
  rawModelOnly?: boolean; // When true, no Daryle prompt, no static facts, no folder instructions, raw provider call
  skipPrompts?: boolean; // When true, bypass Daryle persona/blueprints but keep KB context if enabled ("No Blueprints" mode)
  folderInstructions?: string; // Project-specific instructions to prepend to system prompt
  userInstructions?: string; // Profile-level custom instructions applied to every chat for this user
  folderId?: string; // When the chat lives inside a folder, used to scope folder-KB Pinecone retrieval
  attachments?: PineconeChatAttachment[]; // Parsed text from files attached to this user turn
  kbSources?: string[]; // Selected KB source toggles (e.g. ['ambassador'], ['bill_yeargin'])
}

export interface PineconeChatAttachment {
  fileId: string;
  fileName: string;
  parsedText?: string;
  imageBase64?: string;
  fileType?: string; // 'pdf' | 'docx' | 'txt' | 'md' | 'rtf' | image mime/extension
  pageCount?: number;
}

export interface PineconeChatResponse {
  response: string;
  citation?: {
    source: string;
    title: string;
    url?: string;
  };
  intent?: string;
  sources?: Array<{
    title: string;
    url?: string;
    date?: string;
    type?: string;
    page?: string;
  }>;
  debug?: {
    timing: {
      getEmbedding: number;
      queryPinecone: number;
      rerankMatches: number;
      buildSystemPrompt: number;
      callOpenAI: number;
    };
    totalTime: number;
    fastMode: boolean;
    matchCount: number;
    sourceCount: number;
  };
}

export const sendPineconeChatMessage = async (request: PineconeChatRequest): Promise<PineconeChatResponse> => {
  try {
    const clientStartTime = Date.now();
    
    const { data, error } = await supabase.functions.invoke('pinecone-rag-chat', {
      body: { ...request, streaming: false } // Disable streaming for non-streaming calls
    });
    
    const clientEndTime = Date.now();
    

    if (error) {
      const { describeInvokeError } = await import('@/lib/invokeError');
      throw new Error(await describeInvokeError(error, 'pinecone-rag-chat'));
    }

    if (!data) {
      throw new Error('No response from edge function');
    }

    return data;

  } catch (error) {
    throw error;
  }
};

// Streaming requires direct fetch with Supabase URL and anon key
// Import from centralized client to maintain single source of truth (SEC-01 fix)
import { supabase as supabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/integrations/supabase/client';
export { supabaseClient };

// Timeout constants
const OVERALL_TIMEOUT_MS = 300000; // 5 minutes total timeout (Pro mode can be slow)
const STALL_TIMEOUT_MS = 30000; // 30 seconds without a chunk = stall (only applies BEFORE first content)

// Error type helpers for distinguishing error causes
export const isTimeoutError = (error: Error): boolean => 
  error.name === 'AbortError' || error.message.includes('timeout') || error.message.includes('timed out');

export const isStallError = (error: Error): boolean =>
  error.message.includes('stall') || error.message.includes('no response');

export const isNetworkError = (error: Error): boolean =>
  error.message.includes('network') || error.message.includes('fetch') || error.message.includes('Failed to fetch');

export const isRateLimitError = (error: Error): boolean =>
  error.message.includes('rate limit') || error.message.includes('quota') || error.message.includes('429');

export interface ThinkingStep {
  step: string;
  detail?: string;
  timestamp: number;
}

// Error type for user-initiated cancellation
export const isUserAbortError = (error: Error): boolean =>
  error.message === 'user_cancelled' || error.message.includes('user cancelled');

export const streamPineconeChatMessage = async (
  request: PineconeChatRequest,
  onChunk: (chunk: string) => void,
  onMetadata?: (metadata: any) => void,
  onComplete?: () => void | Promise<void>,
  onError?: (error: Error) => void,
  onIncrementalSave?: () => void | Promise<void>,
  onThinking?: (step: ThinkingStep) => void,
  externalSignal?: AbortSignal,  // NEW: External abort signal for user cancellation
  _endpoint: string = 'pinecone-rag-chat'  // NEW: endpoint override (default keeps backward compat)
): Promise<void> => {
  // Track if onComplete was called to prevent double-firing
  let completedCalled = false;
  // Track if the edge function has started sending SSE events. Once the
  // backend responds, slow model first-token latency should use overall timeout.
  let hasReceivedServerEvent = false;
  // Track if we've received actual content for first-token UI bookkeeping.
  let hasReceivedContent = false;

  const callOnComplete = async () => {
    if (!completedCalled) {
      completedCalled = true;
      console.log('✅ Streaming: Calling onComplete');
      await onComplete?.();
    }
  };

  // Create AbortController for timeout handling
  const controller = new AbortController();
  let overallTimeoutId: ReturnType<typeof setTimeout>;
  let stallTimeoutId: ReturnType<typeof setTimeout>;
  let lastChunkTime = Date.now();
  let userAborted = false; // Track if user initiated the abort

  // Link external signal to internal controller for user-initiated cancellation
  if (externalSignal) {
    externalSignal.addEventListener('abort', () => {
      console.log('🛑 External abort signal received - user cancelled');
      userAborted = true;
      controller.abort();
    }, { once: true });
  }

  // Setup overall timeout (5 minutes for Pro mode)
  overallTimeoutId = setTimeout(() => {
    console.error('⏰ Overall timeout reached (5 min) - aborting stream');
    controller.abort();
  }, OVERALL_TIMEOUT_MS);

  // Stall detection only applies before the edge function sends any SSE event.
  // After metadata/thinking arrives, provider first-token latency can exceed 30s.
  const resetStallTimeout = () => {
    lastChunkTime = Date.now();
    if (stallTimeoutId) clearTimeout(stallTimeoutId);
    
    if (!hasReceivedServerEvent) {
      stallTimeoutId = setTimeout(() => {
        console.error('⏰ Stall timeout reached (30s without any server event) - aborting stream');
        controller.abort();
      }, STALL_TIMEOUT_MS);
    }
  };

  // Cleanup function
  const cleanup = () => {
    if (overallTimeoutId) clearTimeout(overallTimeoutId);
    if (stallTimeoutId) clearTimeout(stallTimeoutId);
  };

  try {
    // Force server-validated token refresh before streaming (prevents stale cached session)
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !authUser) {
      cleanup();
      console.error('❌ Auth validation failed:', authError?.message || 'No user');
      onError?.(new Error('Authentication required'));
      return;
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    if (!token) {
      cleanup();
      console.error('❌ No auth token available after refresh');
      onError?.(new Error('Authentication required'));
      return;
    }

    console.log('🔐 Auth token refreshed and validated, proceeding with streaming request');
    
    // Start stall detection
    resetStallTimeout();
    
    const buildFetchOptions = (authToken: string) => ({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ ...request, streaming: true }),
      signal: controller.signal
    });

    let response = await fetch(`${SUPABASE_URL}/functions/v1/${_endpoint}`, buildFetchOptions(token!));

    // P2: Auto-retry once on auth failure with forced token refresh
    if (response.status === 401 || response.status === 403) {
      console.warn('⚠️ Auth rejected by edge function (', response.status, '), forcing token refresh and retrying...');
      try {
        const { data: { session: freshSession } } = await supabase.auth.refreshSession();
        const freshToken = freshSession?.access_token;
        if (freshToken) {
          response = await fetch(`${SUPABASE_URL}/functions/v1/${_endpoint}`, buildFetchOptions(freshToken));
          console.log('✅ Retry with refreshed token completed, status:', response.status);
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
      }
    }

    // P1: Better error classification - read response body for details
    if (!response.ok || !response.body) {
      cleanup();
      let errorDetail = '';
      try {
        const errorBody = await response.text();
        errorDetail = errorBody;
      } catch {}
      
      if (response.status === 401 || response.status === 403) {
        throw new Error(`Authentication failed: ${response.status} - ${errorDetail}`);
      }
      throw new Error(`Streaming failed: ${response.status} ${response.statusText} - ${errorDetail}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let chunkCount = 0;
    let lastIncrementalSave = Date.now();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (!hasReceivedServerEvent) {
        hasReceivedServerEvent = true;
        if (stallTimeoutId) clearTimeout(stallTimeoutId);
        console.log('✅ First server event received - stall detection disabled');
      }

      // Keep last activity timestamp current for timeout diagnostics
      resetStallTimeout();

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (!data) continue;

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'thinking') {
              // Handle thinking/progress events
              onThinking?.({
                step: parsed.step,
                detail: parsed.detail,
                timestamp: parsed.timestamp || Date.now()
              });
            } else if (parsed.type === 'metadata') {
              onMetadata?.(parsed);
            } else if (parsed.type === 'content') {
              // Mark that we've received content - disable stall timeout from now on
              if (!hasReceivedContent) {
                hasReceivedContent = true;
                if (stallTimeoutId) clearTimeout(stallTimeoutId);
                console.log('✅ First content received - stall detection disabled');
              }
              
              onChunk(parsed.content);
              chunkCount++;
              
              // ✅ FIX: Incremental save every 5 chunks or 3 seconds (increased frequency)
              const now = Date.now();
              if (chunkCount % 5 === 0 || now - lastIncrementalSave >= 3000) {
                console.log('💾 Incremental save triggered (chunk', chunkCount, ')');
                await onIncrementalSave?.();
                lastIncrementalSave = now;
              }
            } else if (parsed.type === 'done') {
              cleanup();
              await callOnComplete();
              return;
            } else if (parsed.type === 'error') {
              cleanup();
              throw new Error(parsed.error);
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e, 'Raw data:', data);
            // Continue processing other lines
          }
        }
      }
    }

    // CRITICAL: Flush remaining buffer after stream ends
    if (buffer.trim()) {
      const lines = buffer.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (!data) continue;
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'thinking') {
              onThinking?.({
                step: parsed.step,
                detail: parsed.detail,
                timestamp: parsed.timestamp || Date.now()
              });
            } else if (parsed.type === 'metadata') {
              onMetadata?.(parsed);
            } else if (parsed.type === 'content') {
              onChunk(parsed.content);
            } else if (parsed.type === 'done') {
              cleanup();
              await callOnComplete();
              return;
            } else if (parsed.type === 'error') {
              cleanup();
              throw new Error(parsed.error);
            }
          } catch (e) {
            console.error('Error parsing SSE data from buffer flush:', e, 'Raw data:', data);
          }
        }
      }
    }

    // Guaranteed: Call onComplete if we exited without hitting 'done'
    cleanup();
    await callOnComplete();
  } catch (error) {
    cleanup();
    
    // Provide more specific error information
    const err = error as Error;
    if (err.name === 'AbortError') {
      // Check if user initiated the abort
      if (userAborted) {
        console.log('🛑 Stream cancelled by user');
        // Create a special error for user cancellation - this should be handled differently
        const userCancelError = new Error('user_cancelled');
        userCancelError.name = 'UserAbortError';
        onError?.(userCancelError);
      } else {
        // Determine if it was overall timeout or stall (only before first content)
        const timeSinceLastChunk = Date.now() - lastChunkTime;
        if (!hasReceivedServerEvent && timeSinceLastChunk >= STALL_TIMEOUT_MS - 1000) {
          console.error('❌ Stream stalled - no server event received for 30 seconds');
          onError?.(new Error('Response stalled: no server event received for 30 seconds'));
        } else {
          console.error('❌ Stream timed out after 5 minutes');
          onError?.(new Error('Request timed out after 5 minutes'));
        }
      }
    } else {
      console.error('❌ Streaming error:', error);
      onError?.(err);
    }
  }
};

// Thin wrapper that targets route-orchestrator instead of pinecone-rag-chat
export const streamRoutedChatMessage = async (
  request: PineconeChatRequest & { routeSelection?: string },
  onChunk: (chunk: string) => void,
  onMetadata?: (metadata: any) => void,
  onComplete?: () => void | Promise<void>,
  onError?: (error: Error) => void,
  onIncrementalSave?: () => void | Promise<void>,
  onThinking?: (step: ThinkingStep) => void,
  externalSignal?: AbortSignal
): Promise<void> => {
  return streamPineconeChatMessage(
    request,
    onChunk,
    onMetadata,
    onComplete,
    onError,
    onIncrementalSave,
    onThinking,
    externalSignal,
    'route-orchestrator'
  );
};

// Add OpenAI chat function for default (non-dual) responses using GPT 4.1
export const sendOpenAIChatMessage = async (request: PineconeChatRequest): Promise<PineconeChatResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('openai-chat', {
      body: {
        message: request.message,
        mode: request.mode,
        length: request.length,
        conversationHistory: request.conversationHistory
      }
    });

    if (error) {
      const { describeInvokeError } = await import('@/lib/invokeError');
      throw new Error(await describeInvokeError(error, 'openai-chat'));
    }

    if (!data) {
      throw new Error('No response from OpenAI chat function');
    }

    return {
      response: data.response,
      sources: data.sources,
      intent: data.intent || 'guidance'
    };

  } catch (error) {
    throw error;
  }
};

export interface DualResponseRequest {
  message: string;
  mode: string;
  length: string;
  conversationHistory?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface DualResponseResponse {
  responseA: string;
  responseB: string;
  modelA: string;
  modelB: string;
  sourcesA?: any[];
  sourcesB?: any[];
  citationA?: string;
  citationB?: string;
}

export const sendDualResponseRequest = async (request: DualResponseRequest): Promise<DualResponseResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('dual-response-chat', {
      body: request
    });

    if (error) {
      const { describeInvokeError } = await import('@/lib/invokeError');
      throw new Error(await describeInvokeError(error, 'dual-response-chat'));
    }

    if (!data) {
      throw new Error('No response from dual response function');
    }

    return data;

  } catch (error) {
    throw error;
  }
};

export const logDualResponseChoice = async (logData: {
  chatId?: string;
  messageQuery: string;
  responseA: string;
  responseB: string;
  userChoice: 'a' | 'b' | 'tie';
  modelA?: string;
  modelB?: string;
}) => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('dual_response_logs')
      .insert({
        user_id: userData.user.id,
        chat_id: logData.chatId,
        message_query: logData.messageQuery,
        response_a: logData.responseA,
        response_b: logData.responseB,
        user_choice: logData.userChoice,
        model_a: logData.modelA,
        model_b: logData.modelB
      });

    if (error) {
      console.error('Error logging dual response choice:', error);
      throw error;
    }

    console.log('✅ Dual response choice logged successfully');
  } catch (error) {
    console.error('❌ Failed to log dual response choice:', error);
    throw error;
  }
};
