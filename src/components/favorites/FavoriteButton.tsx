
import React from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavorites } from '@/context/FavoritesContext';
import { useAuth } from '@/context/SupabaseAuthContext';

interface FavoriteButtonProps {
  chatId: string;
  messageIndex: number;
  messageContent: string;
  messageRole: string;
  title?: string;
  className?: string;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  chatId,
  messageIndex,
  messageContent,
  messageRole,
  title,
  className = ""
}) => {
  const { user } = useAuth();
  const { isFavoriteByChat, toggleFavorite, renderKey } = useFavorites();
  
  // Don't show favorite button for guests
  if (!user) {
    return null;
  }
  
  const isCurrentlyFavorited = isFavoriteByChat(chatId, messageIndex);
  
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Call toggle with immediate UI feedback via context
    const success = await toggleFavorite(chatId, messageIndex, messageContent, messageRole, title);
  };


  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggleFavorite}
      className={`h-8 w-8 p-0 hover:bg-yellow-100 transition-colors ${className}`}
      title={isCurrentlyFavorited ? "Remove from favorites" : "Add to favorites"}
      key={`fav-btn-${chatId}-${messageIndex}-${renderKey}`} // Force re-render using context renderKey
    >
      <Star 
        size={14} 
        className={isCurrentlyFavorited 
          ? "text-yellow-500 fill-yellow-500 transition-colors" 
          : "text-[var(--chat-muted)] hover:text-yellow-500 transition-colors"
        } 
      />
    </Button>
  );
};

export default FavoriteButton;
