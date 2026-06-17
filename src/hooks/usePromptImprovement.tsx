import { useReducer, useCallback, useRef, useEffect, useState } from 'react';
import { improvePrompt, logPromptImprovement } from '@/api/promptImprovement';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { track } from '@/lib/analytics';

// ─── Types ───────────────────────────────────────────────────────────────────

export type PromptImprovementState =
  | 'idle'
  | 'offering'
  | 'generating'
  | 'reviewing'
  | 'complete';

export type UsePromptImprovementReturn = {
  // State
  state: PromptImprovementState;
  isEnabled: boolean;
  originalPrompt: string | null;
  improvedPrompt: string | null;
  finalPrompt: string | null;
  isActive: boolean;

  // Actions
  startOffer: (content: string) => void;
  acceptImprovement: () => Promise<void>;
  declineImprovement: () => void;
  useImproved: () => void;
  keepOriginal: () => void;
  useEdited: (edited: string) => void;
  reset: () => void;
  setEnabled: (enabled: boolean) => void;
};

type PromptImprovementPhase = PromptImprovementState;

type PromptImprovementReducerState = {
  phase: PromptImprovementPhase;
  originalPrompt: string | null;
  improvedPrompt: string | null;
  finalPrompt: string | null;
};

type PromptImprovementAction =
  | { type: 'OFFER'; originalPrompt: string }
  | { type: 'ACCEPT' }
  | { type: 'DECLINE' }
  | { type: 'GENERATION_SUCCESS'; improvedPrompt: string }
  | { type: 'GENERATION_FAILED' }
  | { type: 'USE_IMPROVED' }
  | { type: 'KEEP_ORIGINAL' }
  | { type: 'USE_EDITED'; editedPrompt: string }
  | { type: 'RESET' };

type PlatformSettingValue = { enabled: boolean };

// ─── Reducer ─────────────────────────────────────────────────────────────────

const initialReducerState: PromptImprovementReducerState = {
  phase: 'idle',
  originalPrompt: null,
  improvedPrompt: null,
  finalPrompt: null,
};

function reducer(
  state: PromptImprovementReducerState,
  action: PromptImprovementAction,
): PromptImprovementReducerState {
  switch (action.type) {
    case 'OFFER':
      if (state.phase !== 'idle') return state;
      return { ...state, phase: 'offering', originalPrompt: action.originalPrompt, improvedPrompt: null, finalPrompt: null };

    case 'ACCEPT':
      if (state.phase !== 'offering') return state;
      return { ...state, phase: 'generating' };

    case 'DECLINE':
      if (state.phase !== 'offering') return state;
      return { ...state, phase: 'complete', finalPrompt: state.originalPrompt };

    case 'GENERATION_SUCCESS':
      if (state.phase !== 'generating') return state;
      return { ...state, phase: 'reviewing', improvedPrompt: action.improvedPrompt };

    case 'GENERATION_FAILED':
      if (state.phase !== 'generating') return state;
      return { ...state, phase: 'complete', finalPrompt: state.originalPrompt };

    case 'USE_IMPROVED':
      if (state.phase !== 'reviewing') return state;
      return { ...state, phase: 'complete', finalPrompt: state.improvedPrompt };

    case 'KEEP_ORIGINAL':
      if (state.phase !== 'reviewing') return state;
      return { ...state, phase: 'complete', finalPrompt: state.originalPrompt };

    case 'USE_EDITED':
      if (state.phase !== 'reviewing') return state;
      return { ...state, phase: 'complete', finalPrompt: action.editedPrompt };

    case 'RESET':
      if (state.phase !== 'complete') return state;
      return initialReducerState;

    default:
      return state;
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function usePromptImprovement(
  conversationHistory?: Array<{ role: string; content: string }>,
  chatId?: string | null,
): UsePromptImprovementReturn {
  const { user, profile } = useAuth();

  const [reducerState, dispatch] = useReducer(reducer, initialReducerState);
  const [platformDefault, setPlatformDefault] = useState<boolean | null>(null);
  const [localEnabledOverride, setLocalEnabledOverride] = useState<boolean | null>(null);

  // Keep conversation history in a ref so acceptImprovement never closes over a stale value
  const historyRef = useRef(conversationHistory);
  useEffect(() => {
    historyRef.current = conversationHistory;
  }, [conversationHistory]);

  // Keep originalPrompt in a ref to avoid stale closure in acceptImprovement
  const originalPromptRef = useRef(reducerState.originalPrompt);
  useEffect(() => {
    originalPromptRef.current = reducerState.originalPrompt;
  }, [reducerState.originalPrompt]);

  // ─── Preference resolution ────────────────────────────────────────────────

  // Fetch platform default once — only when the user has no explicit preference
  useEffect(() => {
    if (profile?.prompt_coaching_enabled != null) return;

    supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'prompt_coaching_default')
      .single()
      .then(({ data }) => {
        if (
          data?.value &&
          typeof data.value === 'object' &&
          'enabled' in (data.value as object)
        ) {
          setPlatformDefault((data.value as PlatformSettingValue).enabled);
        }
      });
  }, [profile?.prompt_coaching_enabled]);

  const isEnabled: boolean = localEnabledOverride ?? false;

  const isActive = reducerState.phase !== 'idle' && reducerState.phase !== 'complete';

  // Auto-dismiss offering state after 10 seconds to prevent permanent stuck UI
  useEffect(() => {
    if (reducerState.phase !== 'offering' || !reducerState.originalPrompt) return;
    const timer = setTimeout(() => {
      dispatch({ type: 'DECLINE' });
    }, 10_000);
    return () => clearTimeout(timer);
  }, [reducerState.phase, reducerState.originalPrompt]);

  // ─── Analytics helper ─────────────────────────────────────────────────────

  const fireLog = useCallback(
    (
      userChoice: 'declined' | 'used_improved' | 'kept_original' | 'used_edited',
      params: {
        original: string;
        improved: string | null;
        edited?: string;
      },
    ) => {
      if (!user?.id) return;
      // Fire-and-forget
      logPromptImprovement({
        userId: user.id,
        chatId: chatId ?? null,
        originalPrompt: params.original,
        improvedPrompt: params.improved,
        userChoice,
        editedPrompt: params.edited,
      });
      try {
        track({
          event_name: 'prompt.sharpen_choice',
          category: 'prompt',
          chat_id: chatId ?? null,
          properties: {
            choice: userChoice,
            original_len: params.original?.length ?? 0,
            improved_len: params.improved?.length ?? 0,
            edited_len: params.edited?.length ?? 0,
          },
        });
      } catch {}
    },
    [user?.id, chatId],
  );

  // ─── Actions ──────────────────────────────────────────────────────────────

  /**
   * idle → offering
   * Captures the user's prompt and moves to the "offer" state so the UI can
   * ask whether they want an AI-improved version.
   */
  const startOffer = useCallback((content: string) => {
    dispatch({ type: 'OFFER', originalPrompt: content });
  }, []);

  /**
   * offering → generating → reviewing | complete
   * Calls the API and transitions to reviewing on success, or completes with
   * the original prompt on error.
   */
  const acceptImprovement = useCallback(async () => {
    dispatch({ type: 'ACCEPT' });
    const original = originalPromptRef.current;
    if (!original) return;

    try {
      const result = await improvePrompt(original, historyRef.current);
      if (result.fallback) {
        dispatch({ type: 'GENERATION_FAILED' });
      } else {
        dispatch({ type: 'GENERATION_SUCCESS', improvedPrompt: result.improvedPrompt });
      }
    } catch {
      dispatch({ type: 'GENERATION_FAILED' });
    }
  }, []);

  /**
   * offering → complete
   * User declined — final prompt is the original.
   */
  const declineImprovement = useCallback(() => {
    const original = originalPromptRef.current;
    if (original) {
      fireLog('declined', { original, improved: null });
    }
    dispatch({ type: 'DECLINE' });
  }, [fireLog]);

  /**
   * reviewing → complete
   * User chose the AI-improved version.
   */
  const useImproved = useCallback(() => {
    const original = originalPromptRef.current;
    const improved = reducerState.improvedPrompt;
    if (original && improved) {
      fireLog('used_improved', { original, improved });
    }
    dispatch({ type: 'USE_IMPROVED' });
  }, [fireLog, reducerState.improvedPrompt]);

  /**
   * reviewing → complete
   * User decided to keep their original prompt.
   */
  const keepOriginal = useCallback(() => {
    const original = originalPromptRef.current;
    const improved = reducerState.improvedPrompt;
    if (original) {
      fireLog('kept_original', { original, improved });
    }
    dispatch({ type: 'KEEP_ORIGINAL' });
  }, [fireLog, reducerState.improvedPrompt]);

  /**
   * reviewing → complete
   * User edited the improved prompt before submitting.
   */
  const useEdited = useCallback(
    (edited: string) => {
      const original = originalPromptRef.current;
      const improved = reducerState.improvedPrompt;
      if (original) {
        fireLog('used_edited', { original, improved, edited });
      }
      dispatch({ type: 'USE_EDITED', editedPrompt: edited });
    },
    [fireLog, reducerState.improvedPrompt],
  );

  /**
   * complete → idle
   * Resets all transient state so the hook is ready for the next prompt.
   */
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  /**
   * Immediately update local enabled state (for inline toggle).
   * Caller is responsible for persisting to DB.
   */
  const setEnabled = useCallback((enabled: boolean) => {
    setLocalEnabledOverride(enabled);
  }, []);

  // ─── Return ───────────────────────────────────────────────────────────────

  return {
    state: reducerState.phase,
    isEnabled,
    originalPrompt: reducerState.originalPrompt,
    improvedPrompt: reducerState.improvedPrompt,
    finalPrompt: reducerState.finalPrompt,
    isActive,
    startOffer,
    acceptImprovement,
    declineImprovement,
    useImproved,
    keepOriginal,
    useEdited,
    reset,
    setEnabled,
  };
}
