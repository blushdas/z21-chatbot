
import { supabase } from '@/integrations/supabase/client';
import { MessageType } from '@/components/ChatInterface';

export const generateRagTitle = async (messages: MessageType[]): Promise<string | null> => {
  try {
    console.log('🏷️ 📡 [RAG SERVICE] Preparing request with', messages.length, 'messages');
    console.log('🏷️ 📡 [RAG SERVICE] Invoking Supabase Edge Function: generate-chat-title');
    
    const requestStart = Date.now();
    const { data, error } = await supabase.functions.invoke('generate-chat-title', {
      body: { messages }
    });
    const requestDuration = Date.now() - requestStart;

    console.log(`🏷️ 📡 [RAG SERVICE] Edge function responded in ${requestDuration}ms`);

    if (error) {
      console.error('🏷️ ❌ [RAG SERVICE] Edge function error:', error);
      return null;
    }

    console.log('🏷️ 📡 [RAG SERVICE] Response data:', data);

    const title = data?.title;
    if (title && typeof title === 'string' && title.trim()) {
      console.log('🏷️ ✅ [RAG SERVICE] Valid title received:', title);
      if (data?.fallback) {
        console.log('🏷️ ⚠️ [RAG SERVICE] Using fallback title (reason:', data.reason + ')');
      }
      return title.trim();
    }

    console.warn('🏷️ ⚠️ [RAG SERVICE] No valid title in response');
    return null;
  } catch (error) {
    console.error('🏷️ ❌ [RAG SERVICE] Exception:', error);
    return null;
  }
};
