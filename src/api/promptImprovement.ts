import { supabase } from '@/integrations/supabase/client';

export type PromptImprovementResult = {
  improvedPrompt: string;
  fallback?: boolean;
};

export async function improvePrompt(
  originalPrompt: string,
  conversationHistory?: Array<{ role: string; content: string }>,
  signal?: AbortSignal,
): Promise<PromptImprovementResult> {
  const { data, error } = await supabase.functions.invoke('improve-prompt', {
    body: {
      originalPrompt,
      conversationHistory: conversationHistory?.slice(-3), // Last 3 messages for context
    },
    // @ts-expect-error - supabase-js forwards this to fetch
    signal,
  });

  if (error) {
    console.error('Failed to improve prompt:', error);
    // Graceful fallback — return original prompt so the flow continues
    return { improvedPrompt: originalPrompt, fallback: true };
  }

  return {
    improvedPrompt: (data as { improvedPrompt?: string }).improvedPrompt || originalPrompt,
    fallback: (data as { fallback?: boolean }).fallback || false,
  };
}

export async function logPromptImprovement(params: {
  userId: string;
  chatId: string | null;
  originalPrompt: string;
  improvedPrompt: string | null;
  userChoice: 'declined' | 'used_improved' | 'kept_original' | 'used_edited';
  editedPrompt?: string;
}): Promise<void> {
  try {
    const { error } = await supabase.from('prompt_improvement_logs').insert({
      user_id: params.userId,
      chat_id: params.chatId,
      original_prompt: params.originalPrompt,
      improved_prompt: params.improvedPrompt,
      user_choice: params.userChoice,
      edited_prompt: params.editedPrompt || null,
    });
    if (error) {
      console.error('Failed to log prompt improvement:', error);
    }
  } catch (err) {
    // Fire-and-forget — don't break the flow for analytics
    console.error('Failed to log prompt improvement:', err);
  }
}
