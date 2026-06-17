
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SupabaseChat } from './types';
import { MessageType, ChatMode } from '@/components/ChatInterface';
import { markGeneratedExternal } from '@/hooks/useTitleGenerationLock';
import logger from '@/utils/logger';
import { openDB, IDBPDatabase } from 'idb';

// Reuse the same DB instance from useOfflineMessageQueue
const DB_NAME = 'daryle-offline-db';
const DB_VERSION = 1;

interface CachedChat {
  id: string;
  userId: string;
  title: string;
  messages: any[];
  mode: ChatMode;
  updatedAt: number;
  cachedAt: number;
}

let dbPromise: Promise<IDBPDatabase<any>> | null = null;

const getDB = async () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pending-messages')) {
          const messageStore = db.createObjectStore('pending-messages', { keyPath: 'id' });
          messageStore.createIndex('by-chat', 'chatId');
          messageStore.createIndex('by-status', 'status');
          messageStore.createIndex('by-timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('cached-chats')) {
          const chatStore = db.createObjectStore('cached-chats', { keyPath: 'id' });
          chatStore.createIndex('by-user', 'userId');
          chatStore.createIndex('by-updated', 'updatedAt');
        }
      },
    });
  }
  return dbPromise;
};

export const useChatLoader = (userId?: string) => {
  const { toast } = useToast();
  
  const isLoadingRef = useRef(false);
  const loadPromiseRef = useRef<Promise<SupabaseChat[]> | null>(null);

  // Cache chats to IndexedDB for offline access
  const cacheChats = useCallback(async (chats: SupabaseChat[]) => {
    if (!userId || chats.length === 0) return;

    try {
      const db = await getDB();
      const tx = db.transaction('cached-chats', 'readwrite');
      
      for (const chat of chats) {
        const cached: CachedChat = {
          id: chat.id,
          userId,
          title: chat.title,
          messages: chat.messages,
          mode: chat.mode,
          updatedAt: new Date(chat.updated_at).getTime(),
          cachedAt: Date.now(),
        };
        await tx.store.put(cached);
      }
      
      await tx.done;
      logger.debug(`Cached ${chats.length} chats for offline access`);
    } catch (error) {
      logger.warn('Failed to cache chats:', error);
    }
  }, [userId]);

  // Load chats from IndexedDB cache
  const loadFromCache = useCallback(async (): Promise<SupabaseChat[]> => {
    if (!userId) return [];

    try {
      const db = await getDB();
      const cached = await db.getAllFromIndex('cached-chats', 'by-user', userId);
      
      if (cached.length === 0) {
        logger.debug('No cached chats found');
        return [];
      }

      // Convert cached chats to SupabaseChat format
      const chats: SupabaseChat[] = cached.map((c: CachedChat) => ({
        id: c.id,
        user_id: c.userId,
        title: c.title,
        messages: c.messages as MessageType[],
        mode: c.mode,
        created_at: new Date(c.updatedAt).toISOString(),
        updated_at: new Date(c.updatedAt).toISOString(),
        pinned: false,
        isTypingTitle: false,
        folder_id: null,
        mode_change_events: [],
      }));

      // Sort by updatedAt descending
      chats.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      logger.info(`Loaded ${chats.length} chats from cache (offline mode)`);
      return chats;
    } catch (error) {
      logger.error('Failed to load from cache:', error);
      return [];
    }
  }, [userId]);
  
  const getTotalCount = useCallback(async (): Promise<number> => {
    if (!userId) return 0;
    
    try {
      const { count, error } = await supabase
        .from('chats')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error getting chat count:', error);
      return 0;
    }
  }, [userId]);
  
  const loadChats = useCallback(async (limit: number = 50, offset: number = 0): Promise<SupabaseChat[]> => {
    if (isLoadingRef.current && loadPromiseRef.current) {
      logger.debug('Deduplicating: reusing existing load request');
      return loadPromiseRef.current;
    }
    
    isLoadingRef.current = true;
    
    loadPromiseRef.current = (async () => {
      if (!userId) {
        logger.debug('No user ID, returning empty chats');
        return [];
      }

      try {
        logger.debug(`Loading chats for user: ${userId} (limit: ${limit}, offset: ${offset})`);
        const { data, error } = await supabase
          .from('chats')
          .select('*')
          .eq('user_id', userId)
          .is('deleted_at', null)
          .order('pinned', { ascending: false })
          .order('updated_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          logger.error('Error loading chats from Supabase:', error);
          
          // Fallback to cache on error
          logger.info('Falling back to cached chats');
          const cachedChats = await loadFromCache();
          
          if (cachedChats.length > 0) {
            toast({
              title: "Viewing cached data",
              description: "You're viewing saved chats while offline",
              duration: 5000
            });
            return cachedChats;
          }
          
          throw error;
        }

        const convertedChats: SupabaseChat[] = (data || []).map(chat => {
          const messages = Array.isArray(chat.messages) ? chat.messages as unknown as MessageType[] : [];
          const modeChangeEvents = Array.isArray((chat as any).mode_change_events) 
            ? (chat as any).mode_change_events 
            : [];
          
          return {
            ...chat,
            messages,
            mode: (chat.mode as ChatMode) || 'coach',
            created_at: chat.created_at || new Date().toISOString(),
            updated_at: chat.updated_at || new Date().toISOString(),
            pinned: chat.pinned || false,
            isTypingTitle: chat.is_typing_title || false,
            folder_id: (chat as any).folder_id || null,
            mode_change_events: modeChangeEvents
          };
        });

        convertedChats.forEach(chat => {
          if (chat.title && chat.title !== "New Chat" && chat.title.trim() !== '') {
            markGeneratedExternal(chat.id);
          }
        });

        // Cache for offline access
        cacheChats(convertedChats);

        logger.debug(`Successfully loaded ${convertedChats.length} chats from Supabase`);
        return convertedChats;
      } catch (error) {
        logger.error('Error loading chats:', error);
        
        // Try cache fallback
        const cachedChats = await loadFromCache();
        if (cachedChats.length > 0) {
          toast({
            title: "Viewing cached data",
            description: "Unable to connect to server. Showing saved chats.",
            duration: 5000
          });
          return cachedChats;
        }
        
        toast({
          title: "Error loading chats",
          description: "Failed to load your saved conversations",
          variant: "destructive"
        });
        return [];
      } finally {
        isLoadingRef.current = false;
        loadPromiseRef.current = null;
      }
    })();
    
    return loadPromiseRef.current;
  }, [userId, toast, cacheChats, loadFromCache]);

  return { loadChats, getTotalCount, loadFromCache };
};

