import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AIEditMode = 'selection' | 'document';
export type AIEditAction =
  | 'improve' | 'shorter' | 'longer' | 'bullets' | 'table'
  | 'summary' | 'grammar' | 'tone_professional' | 'tone_friendly' | 'custom';

export interface AIEditRequest {
  canvasId: string;
  mode: AIEditMode;
  action: AIEditAction;
  instruction?: string;
  selectionText?: string;
  fullText?: string;
  /** Chat-native context the AI uses to understand intent. */
  chatId?: string | null;
  recentMessages?: Array<{ role: string; content: string }>;
  originatingMessageId?: string | null;
}

export interface AIEditResult {
  html: string;
  mode: AIEditMode;
  action: AIEditAction;
}

export function useCanvasAIEdit() {
  const [loading, setLoading] = useState(false);

  const runEdit = useCallback(async (req: AIEditRequest): Promise<AIEditResult | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('canvas-ai-edit', { body: req });
      if (error) {
        // supabase-js wraps non-2xx in FunctionsHttpError; the real Response is on error.context.
        const ctx = (error as unknown as { context?: Response }).context;
        let status: number | undefined = ctx?.status;
        let serverMsg: string | undefined;
        if (ctx && typeof ctx.clone === 'function') {
          try {
            const body = await ctx.clone().json();
            serverMsg = body?.error || body?.message;
            if (typeof body?.status === 'number') status = body.status;
          } catch {
            try { serverMsg = await ctx.clone().text(); } catch { /* noop */ }
          }
        }
        if (status === 429) toast.error('Rate limited. Try again in a moment.');
        else if (status === 402) toast.error('AI credits exhausted. Add credits in workspace settings.');
        else if (status === 413) toast.error(serverMsg || 'Document too long for whole-doc rewrite.');
        else if (status === 401) toast.error('You need to be signed in.');
        else toast.error(serverMsg || error.message || 'AI edit failed');
        return null;
      }
      if (!data?.html) {
        toast.error('AI returned an empty response.');
        return null;
      }
      return data as AIEditResult;
    } finally {
      setLoading(false);
    }
  }, []);

  return { runEdit, loading };
}

const KEY = 'canvas-ai-edit-mode';
export type ApplyMode = 'direct' | 'suggest';
export function getApplyMode(): ApplyMode {
  if (typeof window === 'undefined') return 'direct';
  return (window.localStorage.getItem(KEY) as ApplyMode) || 'direct';
}
export function setApplyMode(m: ApplyMode) {
  if (typeof window !== 'undefined') window.localStorage.setItem(KEY, m);
}