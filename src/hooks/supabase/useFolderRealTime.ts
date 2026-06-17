import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Folder } from './useFolderOperations';

interface UseFolderRealTimeProps {
  userId: string | null;
  addFolder: (folder: Folder) => void;
  updateFolder: (folderId: string, updates: Partial<Folder>) => void;
  removeFolder: (folderId: string) => void;
  loadFolders: () => void;
}

export const useFolderRealTime = ({
  userId,
  addFolder,
  updateFolder,
  removeFolder,
  loadFolders
}: UseFolderRealTimeProps) => {
  const { user } = useAuth();
  const subscriptionRef = useRef<any>(null);
  const isSubscribingRef = useRef(false);
  const connectionStateRef = useRef<'disconnected' | 'connecting' | 'connected' | 'cleaning'>('disconnected');

  useEffect(() => {
    // Prevent multiple subscriptions
    if (isSubscribingRef.current) return;
    
    // Only subscribe if user exists and folder feature is needed
    if (!userId || !user?.id) {
      if (subscriptionRef.current) {
        connectionStateRef.current = 'cleaning';
        try {
          subscriptionRef.current.unsubscribe();
          supabase.removeChannel(subscriptionRef.current);
        } catch (error) {
          console.error('Error during folder subscription cleanup:', error);
        }
        subscriptionRef.current = null;
        isSubscribingRef.current = false;
        connectionStateRef.current = 'disconnected';
      }
      return;
    }

    // Clean up existing subscription first
    if (subscriptionRef.current) {
      connectionStateRef.current = 'cleaning';
      try {
        subscriptionRef.current.unsubscribe();
        supabase.removeChannel(subscriptionRef.current);
      } catch (error) {
        console.error('Error cleaning up existing folder subscription:', error);
      }
      subscriptionRef.current = null;
      connectionStateRef.current = 'disconnected';
    }

    isSubscribingRef.current = true;
    connectionStateRef.current = 'connecting';

    // Delay subscription to avoid blocking initial load
    const subscriptionDelay = setTimeout(() => {
      if (!userId || !user?.id || subscriptionRef.current) {
        isSubscribingRef.current = false;
        connectionStateRef.current = 'disconnected';
        return;
      }

      const channelName = `folders_${userId.replace(/-/g, '_')}_${Date.now()}_${Math.random()}`;
      const channel = supabase.channel(channelName);

      channel
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${userId}`
        }, (payload) => addFolder(payload.new as Folder))
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${userId}`
        }, (payload) => updateFolder(payload.new.id, payload.new as Partial<Folder>))
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'folders',
          filter: `user_id=eq.${userId}`
        }, (payload) => removeFolder(payload.old.id))
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            isSubscribingRef.current = false;
            connectionStateRef.current = 'connected';
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            // Ignore status events during cleaning or when already disconnected
            if (connectionStateRef.current === 'cleaning' || connectionStateRef.current === 'disconnected') {
              console.log('🔕 Ignoring folder status, state:', connectionStateRef.current);
              return;
            }
            isSubscribingRef.current = false;
            connectionStateRef.current = 'disconnected';
            subscriptionRef.current = null;
          }
        });

      subscriptionRef.current = channel;
    }, 3000); // Increased delay to 3 seconds

    // Cleanup function
    return () => {
      clearTimeout(subscriptionDelay);
      isSubscribingRef.current = false;
      if (subscriptionRef.current) {
        connectionStateRef.current = 'cleaning';
        try {
          subscriptionRef.current.unsubscribe();
          supabase.removeChannel(subscriptionRef.current);
        } catch (error) {
          console.error('Error during folder subscription cleanup:', error);
        }
        subscriptionRef.current = null;
        connectionStateRef.current = 'disconnected';
      }
    };
  }, [userId, user?.id]);

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        if (subscriptionRef.current) {
          connectionStateRef.current = 'cleaning';
          try {
            subscriptionRef.current.unsubscribe();
            supabase.removeChannel(subscriptionRef.current);
          } catch (error) {
            console.error('Error during auth cleanup:', error);
          }
          subscriptionRef.current = null;
          connectionStateRef.current = 'disconnected';
        }
      } else if (event === 'SIGNED_IN' && session?.user?.id) {
        // Reload folders when user signs in
        loadFolders();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadFolders]);

  return {
    subscriptionActive: !!subscriptionRef.current
  };
};