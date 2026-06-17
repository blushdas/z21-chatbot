
import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FavoritesDrawer from './FavoritesDrawer';
import { useFavorites } from '@/context/FavoritesContext';

const FavoritesButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { favoritesCount, favorites, rawFavorites, renderKey } = useFavorites();
  
  
  // Use the actual favorites array length as the most reliable count
  const actualCount = favorites.length;
  
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        data-tour="favorites"
        className="flex items-center gap-1.5 text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-700"
        onClick={() => setIsOpen(true)}
        key={`favorites-btn-${renderKey}`} // Use context renderKey for consistent updates
      >
        <Star size={16} className={actualCount > 0 ? "text-brand-gold fill-brand-gold" : ""} />
        <span className="hidden sm:inline">Favorites</span>
        {actualCount > 0 && (
          <span className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 text-xs rounded-full px-1.5 py-0.5 min-w-5 text-center">
            {actualCount}
          </span>
        )}
      </Button>
      
      <FavoritesDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onResumeChat={(chat) => {
          // Handle chat resumption logic here if needed
        }}
        key={`drawer-${renderKey}`} // Use context renderKey for consistent drawer updates
      />
    </>
  );
};

export default FavoritesButton;
