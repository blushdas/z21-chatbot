import { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { streamPineconeChatMessage } from '@/api/pineconeChat';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { DARYLE_PERSPECTIVE } from '@/data/commentaryVoices';
import type {
  CommentaryDisplayMode,
  CommentaryEntry,
  CommentaryVoice,
  CommentaryOffer,
  CommentaryOfferState,
} from '@/types/commentary';

// ─── Types ───────────────────────────────────────────────────────────────────

type PlatformSettingValue = { enabled: boolean; default_mode: CommentaryDisplayMode };

type ReducerState = {
  phase: CommentaryOfferState;
  currentOffer: CommentaryOffer | null;
  commentaryMap: Record<string, CommentaryEntry>;
  streamingContent: string;
};

type Action =
  | { type: 'OFFER'; messageId: string; userQuestion: string; mainAnswer: string }
  | { type: 'ACCEPT' }
  | { type: 'DECLINE' }
  | { type: 'AUTO_GENERATE'; messageId: string; userQuestion: string; mainAnswer: string }
  | { type: 'STREAMING_CHUNK'; content: string }
  | { type: 'GENERATION_COMPLETE'; messageId: string; content: string; voiceId: string; voiceName: string; displayMode: CommentaryDisplayMode }
  | { type: 'GENERATION_FAILED' }
  | { type: 'DISMISS'; messageId: string }
  | { type: 'RESET' };

export type UseCommentaryLayerReturn = {
  // State
  isEnabled: boolean;
  displayMode: CommentaryDisplayMode;
  activeVoice: CommentaryVoice;
  currentOffer: CommentaryOffer | null;
  commentaryMap: Record<string, CommentaryEntry>;
  isGenerating: boolean;
  streamingContent: string;
  phase: CommentaryOfferState;

  // Actions
  offerCommentary: (messageId: string, userQuestion: string, mainAnswer: string) => void;
  acceptOffer: () => void;
  declineOffer: () => void;
  generateCommentary: (messageId: string, userQuestion: string, mainAnswer: string) => void;
  dismissCommentary: (messageId: string) => void;
  cancelGeneration: () => void;
  reset: () => void;
  setDisplayMode: (mode: CommentaryDisplayMode) => void;
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialState: ReducerState = {
  phase: 'idle',
  currentOffer: null,
  commentaryMap: {},
  streamingContent: '',
};

function reducer(state: ReducerState, action: Action): ReducerState {
  switch (action.type) {
    case 'OFFER':
      if (state.phase !== 'idle') return state;
      return {
        ...state,
        phase: 'offered',
        currentOffer: {
          messageId: action.messageId,
          userQuestion: action.userQuestion,
          mainAnswer: action.mainAnswer,
          state: 'offered',
        },
        streamingContent: '',
      };

    case 'ACCEPT':
      if (state.phase !== 'offered' || !state.currentOffer) return state;
      return {
        ...state,
        phase: 'generating',
        currentOffer: { ...state.currentOffer, state: 'accepted' },
        streamingContent: '',
      };

    case 'DECLINE':
      if (state.phase !== 'offered') return state;
      return {
        ...state,
        phase: 'idle',
        currentOffer: null,
        streamingContent: '',
      };

    case 'AUTO_GENERATE':
      return {
        ...state,
        phase: 'generating',
        currentOffer: {
          messageId: action.messageId,
          userQuestion: action.userQuestion,
          mainAnswer: action.mainAnswer,
          state: 'accepted',
        },
        streamingContent: '',
      };

    case 'STREAMING_CHUNK':
      if (state.phase !== 'generating') return state;
      return {
        ...state,
        streamingContent: state.streamingContent + action.content,
      };

    case 'GENERATION_COMPLETE': {
      const entry: CommentaryEntry = {
        messageId: action.messageId,
        voiceId: action.voiceId,
        voiceName: action.voiceName,
        content: action.content,
        generatedAt: new Date(),
        isStreaming: false,
        displayMode: action.displayMode,
      };
      return {
        ...state,
        phase: 'complete',
        currentOffer: null,
        streamingContent: '',
        commentaryMap: { ...state.commentaryMap, [action.messageId]: entry },
      };
    }

    case 'GENERATION_FAILED':
      return {
        ...state,
        phase: 'idle',
        currentOffer: null,
        streamingContent: '',
      };

    case 'DISMISS': {
      const { [action.messageId]: _, ...rest } = state.commentaryMap;
      return { ...state, commentaryMap: rest };
    }

    case 'RESET':
      return { ...state, phase: 'idle', currentOffer: null, streamingContent: '' };

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useCommentaryLayer(chatId?: string | null): UseCommentaryLayerReturn {
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();

  const [state, dispatch] = useReducer(reducer, initialState);
  const [platformDefault, setPlatformDefault] = useState<PlatformSettingValue | null>(null);
  const [userDisplayMode, setUserDisplayMode] = useState<CommentaryDisplayMode | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const generationStartRef = useRef<number>(0);
  const activeVoice = DARYLE_PERSPECTIVE;

  // ─── Preference resolution ──────────────────────────────────────────────────

  useEffect(() => {
    supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'commentary_layer_default')
      .single()
      .then(({ data }) => {
        if (data?.value && typeof data.value === 'object' && 'enabled' in (data.value as object)) {
          setPlatformDefault(data.value as PlatformSettingValue);
        }
      });
  }, []);

  // Read user preference from profile
  useEffect(() => {
    const pref = profile?.commentary_preference;
    if (pref !== undefined && pref !== null) {
      setUserDisplayMode(pref as CommentaryDisplayMode);
    }
  }, [profile?.commentary_preference]);

  const isEnabled: boolean = (() => {
    if (userDisplayMode === 'off') return false;
    if (platformDefault && !platformDefault.enabled) return false;
    return platformDefault?.enabled ?? true;
  })();

  // Mobile forces inline mode
  const displayMode: CommentaryDisplayMode = (() => {
    if (!isEnabled) return 'off';
    if (isMobile) return 'inline';
    if (userDisplayMode) return userDisplayMode;
    return platformDefault?.default_mode ?? 'inline';
  })();

  // ─── Analytics helper ───────────────────────────────────────────────────────

  const logAction = useCallback(
    (
      action: string,
      messageId: string,
      content?: string,
      generationTimeMs?: number,
      modelUsed?: string,
    ) => {
      if (!user?.id || displayMode === 'off') return;
      (supabase as any)
        .from('commentary_logs')
        .insert({
          user_id: user.id,
          chat_id: chatId ?? null,
          message_id: messageId,
          voice_id: activeVoice.id,
          action,
          commentary_content: content ?? null,
          generation_time_ms: generationTimeMs ?? null,
          display_mode: displayMode,
          model_used: modelUsed ?? null,
        })
        .then(({ error }) => { if (error) console.error('[Commentary] Log insert failed:', error.message); });
    },
    [user?.id, chatId, displayMode, activeVoice.id],
  );

  // ─── Core generation ────────────────────────────────────────────────────────

  const runGeneration = useCallback(
    async (messageId: string, userQuestion: string, mainAnswer: string) => {
      // Cancel any in-flight generation
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();
      generationStartRef.current = Date.now();

      const commentaryMessage = `[COMMENTARY REQUEST — Do not use RAG context for this. Focus only on interpreting the answer below.]

${activeVoice.systemPrompt}

---

USER'S ORIGINAL QUESTION:
${userQuestion}

---

MAIN RESPONSE TO INTERPRET:
${mainAnswer.slice(0, 3000)}

---

Provide your advisory commentary now. Remember: 3-5 sentences, never repeat the main answer, add genuine perspective.`;

      let fullContent = '';

      try {
        await streamPineconeChatMessage(
          {
            message: commentaryMessage,
            mode: 'coach',
            length: 'short',
            responseMode: 'standard',
            subPrompts: ['quickAnswer'],
            modelOverride: 'fast',
            fastMode: true,
            conversationHistory: [],
          },
          // onChunk
          (chunk: string) => {
            fullContent += chunk;
            dispatch({ type: 'STREAMING_CHUNK', content: chunk });
          },
          // onMetadata
          undefined,
          // onComplete
          () => {
            const generationTime = Date.now() - generationStartRef.current;
            dispatch({
              type: 'GENERATION_COMPLETE',
              messageId,
              content: fullContent,
              voiceId: activeVoice.id,
              voiceName: activeVoice.name,
              displayMode,
            });
            logAction('accepted', messageId, fullContent, generationTime, 'fast');
          },
          // onError
          (error: Error) => {
            console.error('Commentary generation failed:', error.message);
            dispatch({ type: 'GENERATION_FAILED' });
          },
          // onIncrementalSave
          undefined,
          // onThinking
          undefined,
          // externalSignal
          abortRef.current.signal,
        );
      } catch (error) {
        console.error('Commentary generation error:', error);
        dispatch({ type: 'GENERATION_FAILED' });
      }
    },
    [activeVoice, displayMode, logAction],
  );

  // ─── Actions ────────────────────────────────────────────────────────────────

  const offerCommentary = useCallback(
    (messageId: string, userQuestion: string, mainAnswer: string) => {
      if (!isEnabled || displayMode !== 'inline') return;
      dispatch({ type: 'OFFER', messageId, userQuestion, mainAnswer });
      logAction('offered', messageId);
    },
    [isEnabled, displayMode, logAction],
  );

  const acceptOffer = useCallback(() => {
    if (state.phase !== 'offered' || !state.currentOffer) return;
    const { messageId, userQuestion, mainAnswer } = state.currentOffer;
    dispatch({ type: 'ACCEPT' });
    runGeneration(messageId, userQuestion, mainAnswer);
  }, [state.phase, state.currentOffer, runGeneration]);

  const declineOffer = useCallback(() => {
    if (state.phase !== 'offered' || !state.currentOffer) return;
    logAction('declined', state.currentOffer.messageId);
    dispatch({ type: 'DECLINE' });
  }, [state.phase, state.currentOffer, logAction]);

  const generateCommentary = useCallback(
    (messageId: string, userQuestion: string, mainAnswer: string) => {
      if (!isEnabled) return;
      dispatch({ type: 'AUTO_GENERATE', messageId, userQuestion, mainAnswer });
      logAction('auto_generated', messageId);
      runGeneration(messageId, userQuestion, mainAnswer);
    },
    [isEnabled, logAction, runGeneration],
  );

  const dismissCommentary = useCallback(
    (messageId: string) => {
      logAction('dismissed', messageId);
      dispatch({ type: 'DISMISS', messageId });
    },
    [logAction],
  );

  const cancelGeneration = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    dispatch({ type: 'GENERATION_FAILED' });
  }, []);

  const reset = useCallback(() => {
    cancelGeneration();
    dispatch({ type: 'RESET' });
  }, [cancelGeneration]);

  const setDisplayMode = useCallback(
    (mode: CommentaryDisplayMode) => {
      setUserDisplayMode(mode);
      // Persist to profile
      if (user?.id) {
        supabase
          .from('profiles')
          .update({ commentary_preference: mode } as any)
          .eq('id', user.id)
          .then(({ error }) => { if (error) console.error('[Commentary] Preference save failed:', error.message); });
      }
    },
    [user?.id],
  );

  // Reset phase after completion so next offer can come through
  useEffect(() => {
    if (state.phase === 'complete') {
      const timer = setTimeout(() => dispatch({ type: 'RESET' }), 300);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  // ─── Return ─────────────────────────────────────────────────────────────────

  return {
    isEnabled,
    displayMode,
    activeVoice,
    currentOffer: state.currentOffer,
    commentaryMap: state.commentaryMap,
    isGenerating: state.phase === 'generating',
    streamingContent: state.streamingContent,
    phase: state.phase,
    offerCommentary,
    acceptOffer,
    declineOffer,
    generateCommentary,
    dismissCommentary,
    cancelGeneration,
    reset,
    setDisplayMode,
  };
}
