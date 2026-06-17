
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { MessageType, ChatMode } from '@/components/ChatInterface';
import { useToast } from '@/hooks/use-toast';

export interface SupabaseFavoriteItem {
  id: string;
  user_id: string;
  message_id: string;
  message_content: string;
  message_mode: string | null;
  message_timestamp: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface FavoriteItem {
  id: string;
  message: MessageType;
  addedAt: Date;
  tags: string[];
}

export const useSupabaseFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Load favorites from Supabase
  const loadFavorites = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading favorites:', error);
        return;
      }

      // Convert Supabase format to local format
      const convertedFavorites: FavoriteItem[] = data.map((item: SupabaseFavoriteItem) => ({
        id: item.message_id,
        message: {
          id: item.message_id,
          sender: 'daryle',
          content: item.message_content,
          timestamp: new Date(item.message_timestamp),
          mode: (item.message_mode || 'coach') as ChatMode
        },
        addedAt: new Date(item.created_at),
        tags: item.tags || []
      }));

      setFavorites(convertedFavorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add favorite to Supabase
  const addFavorite = async (message: MessageType) => {
    if (!user || !message.id) {
      console.error('Cannot favorite without user or message ID');
      return false;
    }

    // Check if already favorited
    if (favorites.some(fav => fav.id === message.id)) {
      return false;
    }

    try {
      const tags = generateTags(message);
      
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          message_id: message.id,
          message_content: message.content,
          message_mode: message.mode || null,
          message_timestamp: message.timestamp.toISOString(),
          tags
        });

      if (error) {
        console.error('Error adding favorite:', error);
        toast({
          title: "Error",
          description: "Failed to add favorite. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Add to local state
      const newFavorite: FavoriteItem = {
        id: message.id,
        message,
        addedAt: new Date(),
        tags
      };
      
      setFavorites(prev => [newFavorite, ...prev]);
      
      toast({
        title: "Added to Favorites",
        description: "This response has been saved to your favorites.",
        duration: 3000,
      });
      
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  };

  // Remove favorite from Supabase
  const removeFavorite = async (messageId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('message_id', messageId);

      if (error) {
        console.error('Error removing favorite:', error);
        toast({
          title: "Error",
          description: "Failed to remove favorite. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Remove from local state
      setFavorites(prev => prev.filter(fav => fav.id !== messageId));
      
      toast({
        title: "Removed from Favorites",
        description: "This response has been removed from your favorites.",
        duration: 3000,
      });
      
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  };

  // Check if message is favorited
  const isFavorite = (messageId: string) => {
    return favorites.some(fav => fav.id === messageId);
  };

  // Filter favorites
  const filterFavorites = (mode?: string, tag?: string, sortBy: 'newest' | 'oldest' = 'newest') => {
    let filtered = [...favorites];
    
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

  // Generate tags based on message content and mode
  const generateTags = (message: MessageType): string[] => {
    const tags: string[] = [];
    
    // Add mode as a tag
    if (message.mode) {
      tags.push(message.mode);
    }
    
    // Add additional tags based on content keywords
    const content = message.content.toLowerCase();
    if (content.includes('leadership') || content.includes('lead')) {
      tags.push('Leadership');
    }
    if (content.includes('family') || content.includes('legacy')) {
      tags.push('Family');
    }
    if (content.includes('invest') || content.includes('financial')) {
      tags.push('Investment');
    }
    if (content.includes('mission') || content.includes('purpose')) {
      tags.push('Mission');
    }
    if (content.includes('communication') || content.includes('conversation')) {
      tags.push('Communication');
    }
    if (content.includes('stewardship') || content.includes('responsib')) {
      tags.push('Stewardship');
    }
    if (content.includes('values') || content.includes('principle')) {
      tags.push('Values');
    }
    
    return [...new Set(tags)]; // Remove duplicates
  };

  // Load favorites when user changes
  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
    }
  }, [user]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    filterFavorites,
    loadFavorites
  };
};
