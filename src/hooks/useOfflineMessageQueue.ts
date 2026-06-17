import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSupabaseHealthOptional } from '@/context/SupabaseHealthContext';
import { ChatMode } from '@/components/ChatInterface';
import logger from '@/utils/logger';
import { toast } from 'sonner';

// Database schema
interface DaryleOfflineDB extends DBSchema {
  'pending-messages': {
    key: string;
    value: PendingMessage;
    indexes: {
      'by-chat': string;
      'by-status': MessageStatus;
      'by-timestamp': number;
    };
  };
  'cached-chats': {
    key: string;
    value: CachedChat;
    indexes: {
      'by-user': string;
      'by-updated': number;
    };
  };
}

type MessageStatus = 'pending' | 'sending' | 'sent' | 'failed';

export interface PendingMessage {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  mode: ChatMode;
  timestamp: number;
  status: MessageStatus;
  retries: number;
  maxRetries: number;
}

export interface CachedChat {
  id: string;
  userId: string;
  title: string;
  messages: any[]; // MessageType[]
  mode: ChatMode;
  updatedAt: number;
  cachedAt: number;
}

const DB_NAME = 'daryle-offline-db';
const DB_VERSION = 1;
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 second, doubles each retry

let dbPromise: Promise<IDBPDatabase<DaryleOfflineDB>> | null = null;

// Initialize database
const getDB = async (): Promise<IDBPDatabase<DaryleOfflineDB>> => {
  if (!dbPromise) {
    dbPromise = openDB<DaryleOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Pending messages store
        if (!db.objectStoreNames.contains('pending-messages')) {
          const messageStore = db.createObjectStore('pending-messages', { keyPath: 'id' });
          messageStore.createIndex('by-chat', 'chatId');
          messageStore.createIndex('by-status', 'status');
          messageStore.createIndex('by-timestamp', 'timestamp');
        }

        // Cached chats store
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

export interface UseOfflineMessageQueueReturn {
  // Message queue operations
  queueMessage: (message: Omit<PendingMessage, 'id' | 'timestamp' | 'status' | 'retries' | 'maxRetries'>) => Promise<string>;
  getPendingMessages: (chatId?: string) => Promise<PendingMessage[]>;
  getPendingCount: () => Promise<number>;
  clearPendingMessage: (messageId: string) => Promise<void>;
  
  // Chat cache operations
  cacheChat: (chat: Omit<CachedChat, 'cachedAt'>) => Promise<void>;
  getCachedChat: (chatId: string) => Promise<CachedChat | undefined>;
  getCachedChats: (userId: string) => Promise<CachedChat[]>;
  clearCachedChat: (chatId: string) => Promise<void>;
  
  // Sync operations
  processQueue: (sendMessage: (msg: PendingMessage) => Promise<boolean>) => Promise<void>;
  isProcessing: boolean;
  pendingCount: number;
}

export const useOfflineMessageQueue = (userId?: string): UseOfflineMessageQueueReturn => {
  const health = useSupabaseHealthOptional();
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const processingRef = useRef(false);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const db = await getDB();
      const count = await db.count('pending-messages');
      setPendingCount(count);
    } catch (error) {
      logger.error('Failed to get pending count:', error);
    }
  }, []);

  // Queue a message for later sending
  const queueMessage = useCallback(async (
    message: Omit<PendingMessage, 'id' | 'timestamp' | 'status' | 'retries' | 'maxRetries'>
  ): Promise<string> => {
    const db = await getDB();
    
    const pendingMessage: PendingMessage = {
      ...message,
      id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      retries: 0,
      maxRetries: MAX_RETRIES,
    };

    await db.put('pending-messages', pendingMessage);
    await updatePendingCount();
    
    logger.info('Message queued for offline sending:', pendingMessage.id);
    toast.info('Message queued', {
      description: 'Your message will be sent when you reconnect.',
    });
    
    return pendingMessage.id;
  }, [updatePendingCount]);

  // Get pending messages
  const getPendingMessages = useCallback(async (chatId?: string): Promise<PendingMessage[]> => {
    const db = await getDB();
    
    if (chatId) {
      return db.getAllFromIndex('pending-messages', 'by-chat', chatId);
    }
    
    return db.getAll('pending-messages');
  }, []);

  // Get pending count
  const getPendingCount = useCallback(async (): Promise<number> => {
    const db = await getDB();
    return db.count('pending-messages');
  }, []);

  // Clear a pending message
  const clearPendingMessage = useCallback(async (messageId: string): Promise<void> => {
    const db = await getDB();
    await db.delete('pending-messages', messageId);
    await updatePendingCount();
  }, [updatePendingCount]);

  // Cache a chat
  const cacheChat = useCallback(async (chat: Omit<CachedChat, 'cachedAt'>): Promise<void> => {
    const db = await getDB();
    
    const cachedChat: CachedChat = {
      ...chat,
      cachedAt: Date.now(),
    };

    await db.put('cached-chats', cachedChat);
    logger.debug('Chat cached:', chat.id);
  }, []);

  // Get a cached chat
  const getCachedChat = useCallback(async (chatId: string): Promise<CachedChat | undefined> => {
    const db = await getDB();
    return db.get('cached-chats', chatId);
  }, []);

  // Get all cached chats for a user
  const getCachedChats = useCallback(async (userId: string): Promise<CachedChat[]> => {
    const db = await getDB();
    const allChats = await db.getAllFromIndex('cached-chats', 'by-user', userId);
    
    // Sort by updatedAt descending
    return allChats.sort((a, b) => b.updatedAt - a.updatedAt);
  }, []);

  // Clear a cached chat
  const clearCachedChat = useCallback(async (chatId: string): Promise<void> => {
    const db = await getDB();
    await db.delete('cached-chats', chatId);
  }, []);

  // Process the queue when back online
  const processQueue = useCallback(async (
    sendMessage: (msg: PendingMessage) => Promise<boolean>
  ): Promise<void> => {
    if (processingRef.current) {
      logger.debug('Queue processing already in progress');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);

    try {
      const db = await getDB();
      const pending = await db.getAllFromIndex('pending-messages', 'by-status', 'pending');
      
      if (pending.length === 0) {
        logger.debug('No pending messages to process');
        return;
      }

      logger.info(`Processing ${pending.length} pending messages`);
      
      // Update sync progress
      let processed = 0;
      const total = pending.length;

      for (const message of pending) {
        try {
          // Mark as sending
          message.status = 'sending';
          await db.put('pending-messages', message);

          // Try to send
          const success = await sendMessage(message);

          if (success) {
            // Remove from queue
            await db.delete('pending-messages', message.id);
            logger.info('Pending message sent successfully:', message.id);
          } else {
            // Mark as failed for retry
            message.retries++;
            message.status = message.retries >= message.maxRetries ? 'failed' : 'pending';
            await db.put('pending-messages', message);
            
            if (message.status === 'failed') {
              logger.warn('Message failed after max retries:', message.id);
              toast.error('Failed to send message', {
                description: 'A queued message could not be delivered.',
              });
            }
          }
        } catch (error) {
          logger.error('Error processing pending message:', error);
          message.retries++;
          message.status = message.retries >= message.maxRetries ? 'failed' : 'pending';
          await db.put('pending-messages', message);
        }

        processed++;
        
        // Update progress via health context
        if (health?.updateSyncProgress) {
          health.updateSyncProgress(Math.round((processed / total) * 100));
        }

        // Small delay between messages to avoid overwhelming the server
        if (processed < total) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      // Clear reconnecting state when done
      if (health?.clearReconnecting) {
        health.clearReconnecting();
      }

    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      await updatePendingCount();
    }
  }, [health, updatePendingCount]);

  // Auto-process queue when coming back online
  useEffect(() => {
    if (health?.isOnline && health?.reconnecting && !processingRef.current) {
      logger.info('Back online - checking for pending messages');
      updatePendingCount();
    }
  }, [health?.isOnline, health?.reconnecting, updatePendingCount]);

  // Initial count
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  return {
    queueMessage,
    getPendingMessages,
    getPendingCount,
    clearPendingMessage,
    cacheChat,
    getCachedChat,
    getCachedChats,
    clearCachedChat,
    processQueue,
    isProcessing,
    pendingCount,
  };
};

export default useOfflineMessageQueue;
