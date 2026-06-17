import { useEffect, useRef, useCallback, useState } from 'react';
import { MessageType, ChatMode } from '@/components/ChatInterface';
import { useToast } from '@/hooks/use-toast';

interface QueuedSave {
  id: string;
  chatId: string;
  messages: MessageType[];
  mode: ChatMode;
  attempts: number;
  timestamp: number;
  priority: 'high' | 'normal';
}

const STORAGE_KEY = 'daryle_save_queue';
const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000]; // Exponential backoff

export const usePersistentSaveQueue = (
  saveFunction: (chatId: string, messages: MessageType[], mode: ChatMode) => Promise<void>
) => {
  const { toast } = useToast();
  const [queue, setQueue] = useState<QueuedSave[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const processingRef = useRef(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📦 Loaded save queue from storage:', parsed.length, 'items');
        setQueue(parsed);
      }
    } catch (error) {
      console.error('Failed to load save queue from storage:', error);
    }
  }, []);

  // Persist queue to localStorage whenever it changes
  useEffect(() => {
    if (queue.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        console.log('💾 Persisted save queue to storage:', queue.length, 'items');
      } catch (error) {
        console.error('Failed to persist save queue to storage:', error);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [queue]);

  // Process queue
  const processQueue = useCallback(async () => {
    if (processingRef.current || queue.length === 0) return;

    processingRef.current = true;
    setIsProcessing(true);
    setSaveStatus('saving');

    const item = queue[0];
    console.log(`🔄 Processing save queue item (attempt ${item.attempts + 1}/${MAX_RETRIES}):`, {
      chatId: item.chatId,
      messageCount: item.messages.length,
      priority: item.priority
    });

    try {
      await saveFunction(item.chatId, item.messages, item.mode);
      console.log('✅ Save queue item completed successfully');
      
      // Remove from queue
      setQueue(prev => prev.filter(q => q.id !== item.id));
      setSaveStatus('success');
      
      // Reset to idle after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('❌ Save queue item failed:', error);
      
      // Retry logic
      if (item.attempts < MAX_RETRIES - 1) {
        const nextDelay = RETRY_DELAYS[item.attempts];
        console.log(`⏳ Retrying in ${nextDelay}ms...`);
        
        // Update attempts count
        setQueue(prev => prev.map(q => 
          q.id === item.id 
            ? { ...q, attempts: q.attempts + 1 }
            : q
        ));
        
        // Schedule retry
        setTimeout(() => {
          processingRef.current = false;
          processQueue();
        }, nextDelay);
      } else {
        // Max retries exhausted
        console.error('❌ Max retries exhausted for save item');
        setSaveStatus('error');
        
        toast({
          title: "Save Failed",
          description: "Your conversation couldn't be saved. Please refresh and try again.",
          variant: "destructive"
        });
        
        // Remove failed item after showing error
        setTimeout(() => {
          setQueue(prev => prev.filter(q => q.id !== item.id));
          setSaveStatus('idle');
        }, 5000);
      }
    } finally {
      if (item.attempts >= MAX_RETRIES - 1) {
        processingRef.current = false;
      }
      setIsProcessing(false);
    }
  }, [queue, saveFunction, toast]);

  // Auto-process queue when items are added
  useEffect(() => {
    if (queue.length > 0 && !processingRef.current) {
      processQueue();
    }
  }, [queue, processQueue]);

  // Clear queue for specific chat
  const clearQueueForChat = useCallback((chatId: string) => {
    console.log('🧹 Clearing save queue for chat:', chatId);
    setQueue(prev => {
      const filtered = prev.filter(q => q.chatId !== chatId);
      console.log(`🧹 Removed ${prev.length - filtered.length} pending saves for chat ${chatId}`);
      return filtered;
    });
  }, []);

  // Add to queue
  const queueSave = useCallback((
    chatId: string,
    messages: MessageType[],
    mode: ChatMode,
    priority: 'high' | 'normal' = 'normal'
  ) => {
    const saveId = `save-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newSave: QueuedSave = {
      id: saveId,
      chatId,
      messages,
      mode,
      attempts: 0,
      timestamp: Date.now(),
      priority
    };

    console.log('➕ Adding to save queue:', {
      saveId,
      chatId,
      messageCount: messages.length,
      priority
    });

    setQueue(prev => {
      const existing = prev.find(q => q.chatId === chatId);
      
      // ✅ CRITICAL FIX: Don't replace if existing save has MORE content (prevents truncation)
      if (existing) {
        const existingBotContent = existing.messages.find(m => m.sender === 'daryle')?.content || '';
        const newBotContent = messages.find(m => m.sender === 'daryle')?.content || '';
        
        if (existingBotContent.length > newBotContent.length) {
          console.log(`⚠️ Keeping existing save with more content (${existingBotContent.length} > ${newBotContent.length} chars)`);
          return prev; // Keep existing, don't replace with shorter content
        }
        
        console.log(`✅ Replacing with newer/longer content (${newBotContent.length} >= ${existingBotContent.length} chars)`);
      }
      
      // Remove any existing saves for this chat (replace with latest)
      const filtered = prev.filter(q => q.chatId !== chatId);
      
      // Add new save (high priority first)
      if (priority === 'high') {
        return [newSave, ...filtered];
      } else {
        return [...filtered, newSave];
      }
    });
  }, []);

  // beforeunload handler
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (queue.length > 0) {
        console.warn('⚠️ Page unload with pending saves:', queue.length);
        
        // Show browser warning
        e.preventDefault();
        e.returnValue = '';
        
        // Try synchronous save with sendBeacon as fallback
        const highPrioritySaves = queue.filter(q => q.priority === 'high');
        if (highPrioritySaves.length > 0) {
          console.log('🚨 Attempting emergency save with sendBeacon');
          // Note: sendBeacon would need backend endpoint - placeholder for now
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [queue]);

  return {
    queueSave,
    clearQueueForChat,
    saveStatus,
    isProcessing,
    queueLength: queue.length
  };
};
