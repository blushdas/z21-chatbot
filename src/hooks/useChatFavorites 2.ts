import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { toast } from 'sonner';
import { track } from '@/lib/analytics';

export interface ChatFavoriteRecord {
  id: string;
  user_id: string;
  chat_id: string;
  created_at: string;
}

export const useChatFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<ChatFavoriteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const idSetRef = useRef<Set<string>>(new Set());

  const refreshIdSet = (rows: ChatFavoriteRecord[]) => {
    idSetRef.current = new Set(rows.map((r) => r.chat_id));
  };

  const load = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      refreshIdSet([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as ChatFavoriteRecord[];
      setFavorites(rows);
      refreshIdSet(rows);
    } catch (e) {
      console.error('Failed to load chat favorites', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const isChatFavorite = useCallback((chatId: string) => idSetRef.current.has(chatId), [favorites]);

  const toggleChatFavorite = useCallback(
    async (chatId: string) => {
      if (!user) {
        toast.error('Sign in to favorite chats');
        return;
      }
      const already = idSetRef.current.has(chatId);
      if (already) {
        const prev = favorites;
        const next = favorites.filter((f) => f.chat_id !== chatId);
        setFavorites(next);
        refreshIdSet(next);
        const { error } = await supabase
          .from('chat_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('chat_id', chatId);
        if (error) {
          setFavorites(prev);
          refreshIdSet(prev);
          toast.error('Failed to remove favorite');
        } else {
          toast.success('Removed from Favorites');
          track({ event_name: 'favorite.removed', category: 'favorite', chat_id: chatId });
        }
      } else {
        const optimistic: ChatFavoriteRecord = {
          id: `temp-${Date.now()}`,
          user_id: user.id,
          chat_id: chatId,
          created_at: new Date().toISOString(),
        };
        const next = [optimistic, ...favorites];
        setFavorites(next);
        refreshIdSet(next);
        const { data, error } = await supabase
          .from('chat_favorites')
          .insert({ user_id: user.id, chat_id: chatId })
          .select()
          .single();
        if (error) {
          const reverted = favorites;
          setFavorites(reverted);
          refreshIdSet(reverted);
          toast.error('Failed to add favorite');
        } else if (data) {
          const replaced = [data as ChatFavoriteRecord, ...favorites.filter((f) => f.chat_id !== chatId)];
          setFavorites(replaced);
          refreshIdSet(replaced);
          toast.success('Added to Favorites');
          track({ event_name: 'favorite.added', category: 'favorite', chat_id: chatId });
        }
      }
    },
    [user, favorites],
  );

  return { favorites, loading, isChatFavorite, toggleChatFavorite, reload: load };
};
