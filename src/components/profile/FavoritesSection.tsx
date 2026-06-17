
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search } from 'lucide-react';
import { useFavorites } from '@/context/FavoritesContext';
import FavoriteCard from '@/components/favorites/FavoriteCard';
import { Button } from '@/components/ui/button';

const FavoritesSection: React.FC = () => {
  const { favorites, filterFavorites } = useFavorites();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Filter favorites based on search term
  const filteredFavorites = filterFavorites(undefined, undefined, sortOrder).filter(fav => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const title = (fav.title || '').toLowerCase();
    const content = fav.message.content.toLowerCase();
    
    return title.includes(searchLower) || content.includes(searchLower);
  });

  const handleClearSearch = () => {
    setSearchTerm("");
  };
  
  return (
    <div className="rounded-2xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-brand-yellow">★</span>
        <h3 className="text-base font-semibold text-[var(--chat-text)]">My Favorites</h3>
        <span className="text-sm text-[var(--chat-muted)]">({favorites.length} total)</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--chat-muted)]" />
        <Input
          placeholder="Search favorites..."
          className="pl-9 bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] focus-visible:border-brand-yellow/50"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-4xl">★</span>
          <p className="text-[var(--chat-muted)] mt-3">No favorites saved yet</p>
          <p className="text-[var(--chat-muted)] text-sm mt-1">Star messages in chat to save them here</p>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-[var(--chat-muted)] mb-3">No favorites match your search</p>
          <Button onClick={handleClearSearch} variant="ghost" size="sm" className="text-[var(--chat-muted)] hover:text-[var(--chat-text)] border border-[var(--chat-border)]">
            Clear search
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-3 pr-2">
            {filteredFavorites.map(favorite => (
              <FavoriteCard key={favorite.id} favorite={favorite} searchTerm={searchTerm} />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default FavoritesSection;
