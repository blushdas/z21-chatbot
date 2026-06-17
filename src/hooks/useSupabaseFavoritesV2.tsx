
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { MessageType } from '@/components/ChatInterface';
import { useToast } from '@/hooks/use-toast';

export interface FavoriteRecord {
  id: string;
  user_id: string;
  chat_id: string;
  message_index: number;
  content: string;
  title?: string;
  created_at: string;
  chat_created_at?: string; // Add chat creation timestamp
  chat_title?: string; // Add chat title for reference
}

export const useSupabaseFavoritesV2 = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const channelRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<any>(null);
  const connectionStateRef = useRef<'disconnected' | 'connecting' | 'connected' | 'cleaning'>('disconnected');

  // Force re-render helper
  const forceUpdate = useCallback(() => {
    setRenderKey(prev => prev + 1);
  }, []);

  // Load favorites from Supabase with dependency tracking
  const loadFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          chats!inner(
            created_at,
            title
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading favorites:', error);
        return;
      }

      if (data) {
        // Transform the joined data to include chat timestamps
        const transformedData = data.map(fav => ({
          ...fav,
          chat_created_at: fav.chats?.created_at,
          chat_title: fav.chats?.title,
          chats: undefined // Remove the nested object
        })) as FavoriteRecord[];
        
        console.log('📋 Loaded favorites with chat timestamps:', transformedData);
        setFavorites(transformedData);
      } else {
        setFavorites([]);
      }
      forceUpdate(); // Force UI update
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user, forceUpdate]);

  // Enhanced add favorite with immediate UI feedback
  const addFavorite = useCallback(async (
    chatId: string, 
    messageIndex: number, 
    messageContent: string, 
    role: string,
    title?: string
  ) => {
    if (!user) {
      console.error('Cannot favorite without user');
      return false;
    }

    const defaultTitle = title || (messageContent.length > 50 
      ? messageContent.substring(0, 47) + '...' 
      : messageContent);

    console.log('🌟 Adding favorite:', { chatId, messageIndex, user: user.id, title: defaultTitle });

    // Create optimistic favorite with temp ID
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const optimisticFavorite: FavoriteRecord = {
      id: tempId,
      user_id: user.id,
      chat_id: chatId,
      message_index: messageIndex,
      content: messageContent,
      title: defaultTitle,
      created_at: new Date().toISOString()
    };
    
    // Optimistic update - add to UI immediately
    setFavorites(prev => {
      const updated = [optimisticFavorite, ...prev];
      console.log('🎯 Optimistic add - new favorites count:', updated.length);
      return updated;
    });
    forceUpdate();

    try {
      const { data, error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          chat_id: chatId,
          message_index: messageIndex,
          content: messageContent,
          title: defaultTitle
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding favorite:', error);
        // Rollback optimistic update
        setFavorites(prev => {
          const rolled = prev.filter(fav => fav.id !== tempId);
          console.log('🔄 Rollback add - favorites count:', rolled.length);
          return rolled;
        });
        forceUpdate();
        toast({
          title: "Error",
          description: "Failed to add favorite. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Replace optimistic update with real data
      setFavorites(prev => {
        const updated = prev.map(fav => fav.id === tempId ? data : fav);
        console.log('✅ Confirmed add - favorites count:', updated.length);
        return updated;
      });
      forceUpdate();
      
      toast({
        title: "Added to Favorites",
        description: "This message has been saved to your favorites.",
        duration: 3000,
      });
      
      console.log('✅ Successfully added favorite:', data.id);
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      // Rollback optimistic update
      setFavorites(prev => prev.filter(fav => fav.id !== tempId));
      forceUpdate();
      toast({
        title: "Error",
        description: "Failed to add favorite. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, toast, forceUpdate]);

  // Enhanced remove favorite with immediate UI feedback
  const removeFavorite = useCallback(async (chatId: string, messageIndex: number) => {
    if (!user) return false;

    console.log('🗑️ Removing favorite:', { chatId, messageIndex, user: user.id });

    const favoriteToRemove = favorites.find(fav => 
      fav.chat_id === chatId && fav.message_index === messageIndex
    );

    if (!favoriteToRemove) {
      console.log('Favorite not found to remove');
      return false;
    }

    // Optimistic update - remove from UI immediately
    setFavorites(prev => {
      const updated = prev.filter(fav => fav.id !== favoriteToRemove.id);
      console.log('🎯 Optimistic remove - new favorites count:', updated.length);
      return updated;
    });
    forceUpdate();

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('chat_id', chatId)
        .eq('message_index', messageIndex);

      if (error) {
        console.error('Error removing favorite:', error);
        // Rollback optimistic update
        setFavorites(prev => {
          const rolled = [favoriteToRemove, ...prev].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          console.log('🔄 Rollback remove - favorites count:', rolled.length);
          return rolled;
        });
        forceUpdate();
        toast({
          title: "Error",
          description: "Failed to remove favorite. Please try again.",
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "Removed from Favorites",
        description: "This message has been removed from your favorites.",
        duration: 3000,
      });
      
      console.log('✅ Successfully removed favorite');
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      // Rollback optimistic update
      setFavorites(prev => [favoriteToRemove, ...prev].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      forceUpdate();
      toast({
        title: "Error",
        description: "Failed to remove favorite. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, favorites, toast, forceUpdate]);

  // Update favorite title with proper state tracking
  const updateFavoriteTitle = useCallback(async (favoriteId: string, newTitle: string) => {
    if (!user) return false;

    console.log('📝 Updating favorite title:', { favoriteId, newTitle });

    const originalFavorite = favorites.find(fav => fav.id === favoriteId);
    if (!originalFavorite) return false;

    // Optimistic update
    setFavorites(prev => {
      const updated = prev.map(fav => 
        fav.id === favoriteId ? { ...fav, title: newTitle } : fav
      );
      console.log('🎯 Optimistic title update');
      return updated;
    });
    forceUpdate();

    try {
      const { error } = await supabase
        .from('favorites')
        .update({ title: newTitle })
        .eq('id', favoriteId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating favorite title:', error);
        // Rollback optimistic update
        setFavorites(prev => prev.map(fav => 
          fav.id === favoriteId ? originalFavorite : fav
        ));
        forceUpdate();
        toast({
          title: "Error",
          description: "Failed to update title. Please try again.",
          variant: "destructive",
        });
        return false;
      }
      
      toast({
        title: "Title Updated",
        description: "Favorite title has been updated.",
        duration: 2000,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating favorite title:', error);
      // Rollback optimistic update
      setFavorites(prev => prev.map(fav => 
        fav.id === favoriteId ? originalFavorite : fav
      ));
      forceUpdate();
      toast({
        title: "Error",
        description: "Failed to update title. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  }, [user, favorites, toast, forceUpdate]);

  // Check if message is favorited with current state
  const isFavorite = useCallback((chatId: string, messageIndex: number) => {
    const result = favorites.some(fav => 
      fav.chat_id === chatId && fav.message_index === messageIndex
    );
    return result;
  }, [favorites]);

  // Toggle favorite with enhanced state tracking
  const toggleFavorite = useCallback(async (
    chatId: string, 
    messageIndex: number, 
    messageContent: string, 
    role: string,
    title?: string
  ) => {
    const isCurrentlyFavorited = isFavorite(chatId, messageIndex);
    
    if (isCurrentlyFavorited) {
      return await removeFavorite(chatId, messageIndex);
    } else {
      return await addFavorite(chatId, messageIndex, messageContent, role, title);
    }
  }, [isFavorite, addFavorite, removeFavorite]);

  // Set up real-time subscription with deferred loading to prevent blocking app init
  useEffect(() => {
    if (!user?.id) {
      console.log('⏸️  No user ID, skipping favorites subscription setup');
      return;
    }

    // Add small delay to prevent blocking initial app load
    const timer = setTimeout(() => {
      console.log('🔄 Setting up real-time subscription for user:', user.id);
      setupRealTimeSubscription(user.id);
    }, 500); // 500ms delay to let app render first

    return () => {
      clearTimeout(timer);
    };
  }, [user?.id]);

  const setupRealTimeSubscription = useCallback((currentUserId: string) => {
    // Prevent multiple simultaneous connection attempts
    if (connectionStateRef.current === 'connecting' || connectionStateRef.current === 'cleaning') {
      console.log('🛑 Favorites connection blocked, state:', connectionStateRef.current);
      return;
    }

    console.log('🚀 Setting up favorites real-time subscription for user:', currentUserId);
    connectionStateRef.current = 'connecting';

    // Clean up existing channel (unsubscribe only, no removeChannel)
    if (channelRef.current) {
      try {
        channelRef.current.unsubscribe();
      } catch (error) {
        console.error('Error cleaning up favorites channel:', error);
      }
      channelRef.current = null;
    }

    // Create a unique channel name
    const channelName = `favorites_realtime_${currentUserId}_${Date.now()}_${Math.random()}`;
    const channel = supabase.channel(channelName);

    // Add event listeners with enhanced state updates
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('📥 Real-time INSERT:', payload.new);
          const newFavorite = payload.new as FavoriteRecord;
          setFavorites(prev => {
            // Avoid duplicates from optimistic updates
            const exists = prev.some(fav => 
              (fav.id === newFavorite.id) ||
              (fav.chat_id === newFavorite.chat_id && fav.message_index === newFavorite.message_index)
            );
            if (exists) {
              // Replace any temporary/optimistic entry with the real one
              const updated = prev.map(fav => {
                if (fav.id.startsWith('temp-') && 
                    fav.chat_id === newFavorite.chat_id && 
                    fav.message_index === newFavorite.message_index) {
                  return newFavorite;
                }
                return fav;
              });
              console.log('🔄 Real-time replace temp with real:', updated.length);
              return updated;
            }
            const updated = [newFavorite, ...prev];
            console.log('📥 Real-time add new:', updated.length);
            return updated;
          });
          forceUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('📝 Real-time UPDATE:', payload.new);
          const updatedFavorite = payload.new as FavoriteRecord;
          setFavorites(prev => {
            const updated = prev.map(fav => 
              fav.id === updatedFavorite.id ? updatedFavorite : fav
            );
            console.log('📝 Real-time update applied');
            return updated;
          });
          forceUpdate();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'favorites',
          filter: `user_id=eq.${currentUserId}`
        },
        (payload) => {
          console.log('📤 Real-time DELETE:', payload.old);
          const deletedFavorite = payload.old as FavoriteRecord;
          setFavorites(prev => {
            const updated = prev.filter(fav => fav.id !== deletedFavorite.id);
            console.log('📤 Real-time delete applied:', updated.length);
            return updated;
          });
          forceUpdate();
        }
      );

    // Store reference before subscribing
    channelRef.current = channel;

    // Subscribe with enhanced status handling
    channel.subscribe((status) => {
      console.log(`📡 Subscription status: ${status} for channel: ${channelName}`);
      
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to favorites real-time updates');
        connectionStateRef.current = 'connected';
        retryCountRef.current = 0;
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        // Ignore status events during cleaning or when already disconnected
        if (connectionStateRef.current === 'cleaning' || connectionStateRef.current === 'disconnected') {
          console.log('🔕 Ignoring favorites status, state:', connectionStateRef.current);
          return;
        }

        console.log(`❌ Subscription failed/closed: ${status}`);
        connectionStateRef.current = 'disconnected';
        
        // Increment retry count
        retryCountRef.current += 1;
        // Only retry for timeout and channel errors, not for intentional closes
        if ((status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') && retryCountRef.current < 3) {
          // Exponential backoff: 15s, 30s, 60s
          const retryDelay = Math.min(15000 * Math.pow(2, retryCountRef.current - 1), 60000);
          
          console.log(`🔄 Scheduling favorites reconnection attempt ${retryCountRef.current} in ${retryDelay/1000}s`);
          
          retryTimeoutRef.current = setTimeout(() => {
            if (retryCountRef.current <= 3) {
              console.log(`🔄 Attempting to reconnect subscription... (attempt ${retryCountRef.current})`);
              loadFavorites();
            }
            retryTimeoutRef.current = null;
          }, retryDelay);
        } else {
          console.log('🛑 Max reconnection attempts reached or intentional close');
        }
      }
    });

    // Cleanup function
    const cleanup = () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      if (channelRef.current) {
        connectionStateRef.current = 'cleaning';
        try {
          channelRef.current.unsubscribe();
          supabase.removeChannel(channelRef.current);
        } catch (error) {
          console.error('Error during favorites cleanup:', error);
        }
        channelRef.current = null;
        connectionStateRef.current = 'disconnected';
      }
    };
    
    return cleanup;
  }, [loadFavorites, forceUpdate]);

  // Load favorites with deferred loading to prevent blocking app initialization
  useEffect(() => {
    // Add delay to prevent blocking app load
    const timer = setTimeout(() => {
      if (user?.id) {
        loadFavorites();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [user?.id]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    updateFavoriteTitle,
    isFavorite,
    toggleFavorite,
    loadFavorites,
    renderKey // Expose render key for components that need forced updates
  };
};
