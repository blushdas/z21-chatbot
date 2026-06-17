import { useCallback } from 'react';

/**
 * Global lock + cooldown + cache for RAG title generation per chat
 * Prevents duplicate/rapid calls and avoids "spasming" titles.
 * 
 * Day 3 Enhancements:
 * - Lock expiration after 60 seconds to prevent stale locks from browser crashes
 * - Periodic cleanup every 5 minutes to remove expired locks
 * - localStorage sync validation to ensure memory and storage are in sync
 * - Stale lock detection and recovery
 */
const locks = new Map<string, boolean>();
const lockTimestamps = new Map<string, number>(); // Track when lock was acquired
const lastGenAt = new Map<string, number>();
const generated = new Set<string>();
const pending = new Set<string>(); // Track in-progress generations

const COOLDOWN_MS = 5000; // prevent re-gen within 5s
const LOCK_EXPIRATION_MS = 60000; // 60 seconds max lock time

const isBrowser = typeof window !== 'undefined';
const lsKey = (id: string) => `rag_title_generated:${id}`;

// Cleanup stale locks
const cleanupStaleLock = (chatId: string) => {
  const lockTime = lockTimestamps.get(chatId);
  if (lockTime && Date.now() - lockTime > LOCK_EXPIRATION_MS) {
    console.warn(`🧹 Cleaning up stale lock for ${chatId} (age: ${Math.round((Date.now() - lockTime) / 1000)}s)`);
    locks.delete(chatId);
    pending.delete(chatId);
    lockTimestamps.delete(chatId);
    return true;
  }
  return false;
};

const hasGeneratedGlobal = (chatId: string) => {
  // First, check if lock is stale and clean it up
  cleanupStaleLock(chatId);
  
  if (generated.has(chatId)) return true;
  if (pending.has(chatId)) return true;
  
  // Validate localStorage is in sync with memory
  if (isBrowser) {
    try {
      const lsValue = localStorage.getItem(lsKey(chatId));
      if (lsValue === '1') {
        // localStorage says generated
        if (!generated.has(chatId)) {
          console.log(`🔄 Syncing memory with localStorage for ${chatId}`);
          generated.add(chatId);
        }
        return true;
      } else if (generated.has(chatId) && lsValue !== '1') {
        // Memory says generated but localStorage doesn't - fix it
        console.log(`🔄 Syncing localStorage with memory for ${chatId}`);
        localStorage.setItem(lsKey(chatId), '1');
      }
    } catch {}
  }
  return false;
};

const markGeneratedGlobal = (chatId: string) => {
  generated.add(chatId);
  pending.delete(chatId); // Remove from pending
  lastGenAt.set(chatId, Date.now());
  if (isBrowser) {
    try { localStorage.setItem(lsKey(chatId), '1'); } catch {}
  }
};

// Periodic cleanup of stale locks (runs every 5 minutes in browser)
if (isBrowser) {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [chatId, timestamp] of lockTimestamps.entries()) {
      if (now - timestamp > LOCK_EXPIRATION_MS) {
        console.warn(`🧹 Periodic cleanup: Removing stale lock for ${chatId} (age: ${Math.round((now - timestamp) / 1000)}s)`);
        locks.delete(chatId);
        pending.delete(chatId);
        lockTimestamps.delete(chatId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Periodic cleanup: Removed ${cleanedCount} stale lock(s)`);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
  
  // Cleanup on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      clearInterval(cleanupInterval);
    });
  }
}

// Export for external use (e.g., when loading existing chats or manual rename)
export const markGeneratedExternal = (chatId: string) => {
  markGeneratedGlobal(chatId);
};

// Export for external checks without using the hook
export const hasGeneratedExternal = (chatId: string): boolean => {
  return hasGeneratedGlobal(chatId);
};

export const useTitleGenerationLock = () => {
  // Atomic method that checks and acquires in one operation
  const tryAcquireForGeneration = useCallback((chatId: string): boolean => {
    if (!chatId) {
      return false;
    }
    
    // CRITICAL: Check all locks atomically before acquiring (includes stale lock cleanup)
    if (locks.get(chatId) || pending.has(chatId) || hasGeneratedGlobal(chatId)) {
      console.log(`🔒❌ Lock acquisition failed for ${chatId}:`, {
        isLocked: locks.get(chatId),
        isPending: pending.has(chatId),
        hasGenerated: hasGeneratedGlobal(chatId)
      });
      return false;
    }
    
    // Check cooldown
    const last = lastGenAt.get(chatId);
    if (last && Date.now() - last < COOLDOWN_MS) {
      console.log(`🔒❌ Lock acquisition failed - cooldown active for ${chatId}`);
      return false;
    }
    
    // Atomically set lock, pending state, and timestamp
    locks.set(chatId, true);
    pending.add(chatId);
    lockTimestamps.set(chatId, Date.now());
    console.log(`🔒✅ Lock acquired for ${chatId} at ${new Date().toISOString()}`);
    return true;
  }, []);

  const releaseLock = useCallback((chatId: string) => {
    locks.delete(chatId);
    pending.delete(chatId);
    lockTimestamps.delete(chatId);
    lastGenAt.set(chatId, Date.now());
    console.log(`🔓 Lock released for ${chatId}`);
  }, []);

  const isLocked = useCallback((chatId: string): boolean => {
    // Clean up stale lock before checking
    cleanupStaleLock(chatId);
    return !!locks.get(chatId);
  }, []);
  
  const hasGenerated = useCallback((chatId: string): boolean => hasGeneratedGlobal(chatId), []);
  const markGenerated = useCallback((chatId: string) => markGeneratedGlobal(chatId), []);

  return { 
    tryAcquireForGeneration,
    releaseLock, 
    isLocked, 
    hasGenerated, 
    markGenerated 
  };
};
