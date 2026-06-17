
import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useSupabaseFavoritesV2, FavoriteRecord } from '@/hooks/useSupabaseFavoritesV2';
import logger from '@/utils/logger';

// Legacy interface for backward compatibility
export interface FavoriteItem {
  id: string;
  message: {
    id: string;
    sender: string;
    content: string;
    timestamp: Date;
    mode: string;
  };
  addedAt: Date;
  tags: string[];
  title?: string;
}

interface FavoritesContextType {
  favorites: FavoriteItem[];
  loading: boolean;
  addFavorite: (message: any) => Promise<boolean>;
  removeFavorite: (messageId: string) => Promise<boolean>;
  updateFavoriteTitle: (favoriteId: string, newTitle: string) => Promise<boolean>;
  isFavorite: (messageId: string) => boolean;
  filterFavorites: (mode?: string, tag?: string, sortBy?: 'newest' | 'oldest') => FavoriteItem[];
  loadFavorites: () => Promise<void>;
  // New unified properties from useSupabaseFavoritesV2
  rawFavorites: FavoriteRecord[];
  favoritesCount: number;
  toggleFavorite: (chatId: string, messageIndex: number, messageContent: string, role: string, title?: string) => Promise<boolean>;
  isFavoriteByChat: (chatId: string, messageIndex: number) => boolean;
  renderKey: number;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Defer favorites loading to prevent blocking app initialization
  const supabaseFavorites = useSupabaseFavoritesV2();

  // Convert Supabase favorites to legacy format for backward compatibility
  const convertToLegacyFormat = (supabaseFavorites: FavoriteRecord[]): FavoriteItem[] => {
    return supabaseFavorites.map(fav => ({
      id: fav.id,
      message: {
        id: fav.id,
        sender: 'assistant', // Default since role is not stored anymore
        content: fav.content,
        // Use chat creation timestamp if available, otherwise fall back to favorite creation timestamp
        timestamp: fav.chat_created_at ? new Date(fav.chat_created_at) : new Date(fav.created_at),
        mode: 'coach' // Default mode since it's not stored in the new table
      },
      // Use chat creation timestamp for display if available
      addedAt: fav.chat_created_at ? new Date(fav.chat_created_at) : new Date(fav.created_at),
      tags: [], // Tags not implemented in new system yet
      title: fav.title
    }));
  };

  const legacyFavorites = convertToLegacyFormat(supabaseFavorites.favorites);

  // Remove excessive debugging logs to improve performance
  useEffect(() => {
    // Only log when there are significant changes
    if (supabaseFavorites.favorites.length !== legacyFavorites.length) {
      logger.debug('[FavoritesContext] Favorites count changed:', legacyFavorites.length);
    }
  }, [supabaseFavorites.favorites.length, legacyFavorites.length]);

  // Legacy wrapper functions that now properly delegate to the new system
  const addFavorite = async (message: any) => {
    logger.warn('addFavorite: Use toggleFavorite with chat context instead for new implementations');
    
    if (message.chatId && typeof message.messageIndex === 'number') {
      return await supabaseFavorites.addFavorite(
        message.chatId, 
        message.messageIndex, 
        message.content, 
        message.sender || 'user',
        message.title
      );
    }
    
    logger.error('addFavorite: Missing chatId or messageIndex');
    return false;
  };

  const removeFavorite = async (messageId: string) => {
    logger.warn('removeFavorite: Use the new toggleFavorite method instead');
    
    // Find the favorite by message ID and remove it
    const favorite = supabaseFavorites.favorites.find(fav => fav.id === messageId);
    if (favorite) {
      return await supabaseFavorites.removeFavorite(favorite.chat_id, favorite.message_index);
    }
    
    return false;
  };

  const isFavorite = (messageId: string) => {
    return legacyFavorites.some(fav => fav.id === messageId);
  };

  const filterFavorites = (mode?: string, tag?: string, sortBy: 'newest' | 'oldest' = 'newest') => {
    let filtered = [...legacyFavorites];
    
    if (mode) {
      filtered = filtered.filter(fav => fav.message.mode === mode);
    }
    
    if (tag) {
      filtered = filtered.filter(fav => fav.tags.includes(tag));
    }
    
    // Sort by date
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return b.addedAt.getTime() - a.addedAt.getTime();
      } else {
        return a.addedAt.getTime() - b.addedAt.getTime();
      }
    });
    
    return filtered;
  };

  const value: FavoritesContextType = {
    // Legacy interface for backward compatibility
    favorites: legacyFavorites,
    loading: supabaseFavorites.loading,
    addFavorite,
    removeFavorite,
    updateFavoriteTitle: supabaseFavorites.updateFavoriteTitle,
    isFavorite,
    filterFavorites,
    loadFavorites: supabaseFavorites.loadFavorites,
    
    // New unified properties from useSupabaseFavoritesV2
    rawFavorites: supabaseFavorites.favorites,
    favoritesCount: supabaseFavorites.favorites.length,
    toggleFavorite: supabaseFavorites.toggleFavorite,
    isFavoriteByChat: supabaseFavorites.isFavorite,
    renderKey: supabaseFavorites.renderKey
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    return { favorites: [], loading: false, addFavorite: async ()=>{}, removeFavorite: async ()=>{} };
  }
  return context;
};
