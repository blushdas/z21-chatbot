import { useEffect, useCallback, useRef } from 'react';
import { SupabaseChat } from './types';
import { useChatLoader } from './useChatLoader';
import { useChatSorting } from './useChatSorting';
import { logChatLoadFailure } from '@/utils/chatLoadingLogger';

interface UseChatInitializationProps {
  userId: string | null;
  setSavedChats: React.Dispatch<React.SetStateAction<SupabaseChat[]>>;
  setCurrentChatId: React.Dispatch<React.SetStateAction<string | null>>;
  setInitialized: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useChatInitialization = ({
  userId,
  setSavedChats,
  setCurrentChatId,
  setInitialized
}: UseChatInitializationProps) => {
  const { loadChats } = useChatLoader(userId);
  const { sortChats } = useChatSorting();
  const isLoadingRef = useRef(false);
  const lastLoadTimeRef = useRef<number>(0);
  const MIN_LOAD_INTERVAL = 2000; // Minimum 2 seconds between loads

  // Load chats from Supabase with proper ordering and aggressive deduplication
  const loadChatsFromSupabase = useCallback(async () => {
    // Deduplicate: prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      console.log('⏭️ Skipping load - already in progress');
      return;
    }

    // Throttle: prevent loads too close together
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTimeRef.current;
    if (timeSinceLastLoad < MIN_LOAD_INTERVAL) {
      console.log(`⏭️ Throttling load - only ${timeSinceLastLoad}ms since last load`);
      return;
    }

    if (!userId) {
      console.log('No user ID, clearing chats for guest user');
      setSavedChats([]);
      setCurrentChatId(null);
      setInitialized(true);
      return;
    }

    isLoadingRef.current = true;
    lastLoadTimeRef.current = now;

    try {
      // Only load first 50 chats for fast initial load
      const chats = await loadChats(50, 0);
      setSavedChats(sortChats(chats));
      setInitialized(true);
    } catch (error) {
      setInitialized(true);
    } finally {
      isLoadingRef.current = false;
    }
  }, [userId, loadChats, setSavedChats, setCurrentChatId, setInitialized]);

  // Initialize on user login/logout - ONLY depend on userId to prevent loops
  useEffect(() => {
    if (userId) {
      console.log('User logged in, initializing chats...');
      loadChatsFromSupabase();
    } else {
      console.log('No user or user logged out, clearing chats');
      setSavedChats([]);
      setCurrentChatId(null);
      setInitialized(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // ONLY userId - other functions are stable

  return {
    loadChatsFromSupabase
  };
};