
import { useCallback } from 'react';
import { SupabaseChat } from './types';

export const useChatSorting = () => {
  const sortChats = useCallback((chats: SupabaseChat[]): SupabaseChat[] => {
    
    const sorted = [...chats].sort((a, b) => {
      // First: Empty chats (no messages) always at the very top
      const aEmpty = !a.messages || (Array.isArray(a.messages) && a.messages.length === 0);
      const bEmpty = !b.messages || (Array.isArray(b.messages) && b.messages.length === 0);
      if (aEmpty && !bEmpty) return -1;
      if (!aEmpty && bEmpty) return 1;
      
      // Second: Pinned chats come next
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Third: Sort by updated_at descending (most recent first)
      const aTime = new Date(a.updated_at).getTime();
      const bTime = new Date(b.updated_at).getTime();
      
      // If times are very close (within 1 second), use creation time as tiebreaker
      if (Math.abs(bTime - aTime) < 1000) {
        const aCreated = new Date(a.created_at).getTime();
        const bCreated = new Date(b.created_at).getTime();
        return bCreated - aCreated;
      }
      
      return bTime - aTime;
    });
    
    
    return sorted;
  }, []);

  return { sortChats };
};
