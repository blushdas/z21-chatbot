

import { supabase } from '@/integrations/supabase/client';

export interface ChatRequest {
  message: string;
  mode: string;
  length: string;
  assistantId?: string;
  subPrompts?: string[];
}

export interface ChatResponse {
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
  }>;
}

export const sendChatMessage = async (request: ChatRequest): Promise<ChatResponse> => {
  try {
    const { data, error } = await supabase.functions.invoke('openai-assistant-chat', {
      body: request
    });

    if (error) {
      const { describeInvokeError } = await import('@/lib/invokeError');
      throw new Error(await describeInvokeError(error, 'openai-assistant-chat'));
    }

    if (!data) {
      throw new Error('No response from edge function');
    }

    return data;

  } catch (error) {
    throw error;
  }
};

