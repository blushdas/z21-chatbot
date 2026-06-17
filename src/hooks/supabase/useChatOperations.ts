
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SupabaseChat } from './types';
import { MessageType, ChatMode } from '@/components/ChatInterface';

export const useChatOperations = (userId?: string) => {
  const { toast } = useToast();

  const getChat = useCallback(async (chatId: string, savedChats: SupabaseChat[]): Promise<SupabaseChat | undefined> => {
    if (!userId || chatId.startsWith('guest-')) {
      return undefined;
    }
    
    // First check if chat is already in local state
    const localChat = savedChats.find(c => c.id === chatId);
    if (localChat) {
      console.log(`Getting chat ${chatId}: Found locally with ${localChat.messages.length} messages`);
      return localChat;
    }
    
    // If not found locally, fetch from database
    console.log(`Getting chat ${chatId}: Not found locally, fetching from database...`);
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error(`Error fetching chat ${chatId}:`, error);
        return undefined;
      }

      if (data) {
        const messages = Array.isArray(data.messages) ? (data.messages as unknown as MessageType[]) : [];
        console.log(`✅ Chat ${chatId} fetched from database with ${messages.length} messages`);
        
        const supabaseChat: SupabaseChat = {
          id: data.id,
          title: data.title,
          messages,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString(),
          mode: data.mode as ChatMode,
          user_id: data.user_id,
          pinned: data.pinned || false,
          isTypingTitle: data.is_typing_title || false,
          folder_id: data.folder_id,
          mode_change_events: Array.isArray(data.mode_change_events) 
            ? (data.mode_change_events as Array<{id: string, type: 'mode' | 'model', value: string, timestamp: string}>)
            : []
        };
        
        return supabaseChat;
      }
    } catch (error) {
      console.error(`Error fetching chat ${chatId}:`, error);
    }
    
    console.log(`❌ Chat ${chatId} not found`);
    return undefined;
  }, [userId]);

  const updateChatTitle = useCallback(async (chatId: string, newTitle: string) => {
    if (!userId || chatId.startsWith('guest-')) return;

    try {
      const { error } = await supabase
        .from('chats')
        .update({ title: newTitle.trim() || "Untitled Chat" })
        .eq('id', chatId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log(`📝 Manual title update for chat ${chatId}: ${newTitle}`);
    } catch (error) {
      console.error('Error updating chat title:', error);
      toast({
        title: "Error updating title",
        description: "Failed to update chat title",
        variant: "destructive"
      });
    }
  }, [userId, toast]);

  const deleteChat = useCallback(async (chatId: string) => {
    if (!userId || chatId.startsWith('guest-')) return;

    try {
      const { error } = await supabase
        .from('chats')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', chatId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log(`Soft-deleted chat: ${chatId}`);
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast({
        title: "Error deleting chat",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  }, [userId, toast]);

  const togglePinStatus = useCallback(async (chatId: string, pinned: boolean) => {
    if (!userId || chatId.startsWith('guest-')) return;

    try {
      const { error } = await supabase
        .from('chats')
        .update({ 
          pinned,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId)
        .eq('user_id', userId);

      if (error) throw error;

      console.log(`${pinned ? 'Pinned' : 'Unpinned'} chat: ${chatId}`);
    } catch (error) {
      console.error('Error toggling pin status:', error);
      toast({
        title: "Error updating pin status",
        description: "Failed to update chat pin status",
        variant: "destructive"
      });
    }
  }, [userId, toast]);

  return {
    getChat,
    updateChatTitle,
    deleteChat,
    togglePinStatus
  };
};
