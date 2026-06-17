import React, { useState, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { X, Search, Star, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useFavorites } from "@/context/FavoritesContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import FavoriteCard from "./FavoriteCard";

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeChat?: (chat: any) => void;
}

const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({ isOpen, onClose, onResumeChat }) => {
  const { favorites, filterFavorites, rawFavorites, favoritesCount, renderKey } = useFavorites();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expanded, setExpanded] = useState(false);
  
  // Use actual favorites length as the most reliable count
  const actualCount = favorites.length;
  
  // Filter favorites based on search term
  const filteredFavorites = filterFavorites(undefined, undefined, sortOrder).filter(fav => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const title = (fav.title || '').toLowerCase();
    const content = fav.message.content.toLowerCase();
    
    return title.includes(searchLower) || content.includes(searchLower);
  });
  
  const handleClearFilters = () => {
    setSearchTerm("");
  };

  const handleViewInChat = async (favorite: any) => {
    // Find the raw favorite to get chat_id
    const rawFavorite = rawFavorites.find(fav => fav.id === favorite.id);
    if (rawFavorite && onResumeChat) {
      // Create a chat object for the resume function
      const chatToResume = {
        id: rawFavorite.chat_id,
        highlightMessageIndex: rawFavorite.message_index
      };
      onResumeChat(chatToResume);
      onClose();
    } else {
      // Navigate to the chat using the proper route
      navigate(`/chat/${rawFavorite?.chat_id || ''}`);
      onClose();
    }
  };

  const handleManageFavorites = () => {
    onClose();
    // Navigate to the dedicated favorites route
    navigate('/profile/favorites');
  };
  
  const renderContent = () => (
    <div className="flex flex-col h-full" key={`drawer-content-${renderKey}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Star className="h-6 w-6 text-brand-gold fill-current" />
          <h2 className="text-xl font-semibold text-brand-blue">Favorites</h2>
          <span className="text-sm text-[var(--chat-muted)] bg-[var(--ui-bg-hover)] dark:bg-gray-800 px-2 py-1 rounded-full">
            {actualCount}
          </span>
        </div>
        <div className="flex items-center gap-1">
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
            className="rounded-full hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-800"
          >
            {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="rounded-full hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
        </div>
      </div>
      
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--chat-muted)]" />
          <Input 
            placeholder="Search favorites..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        {actualCount === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-2 text-brand-gold">⭐</div>
            <h3 className="text-lg font-medium mb-1 text-brand-blue">No favorites saved yet</h3>
            <p className="text-[var(--chat-muted)] mb-4">Star messages in chat to save them here</p>
            <Button onClick={onClose} variant="outline">Start a conversation</Button>
          </div>
        ) : filteredFavorites.length === 0 ? (
          <div className="text-center py-12 text-[var(--chat-muted)]">
            <p className="mb-4">No favorites match your search</p>
            <Button onClick={handleClearFilters} variant="outline" size="sm">Clear search</Button>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-220px)]">
            <div
              className={
                expanded
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pr-4 pb-8'
                  : 'space-y-6 pr-4 pb-8'
              }
              key={`favorites-list-${renderKey}`}
            >
              {filteredFavorites.map(favorite => (
                <FavoriteCard 
                  key={`${favorite.id}-${renderKey}`} 
                  favorite={favorite} 
                  onClose={onClose}
                  onViewInChat={handleViewInChat}
                  searchTerm={searchTerm}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t dark:border-gray-800 text-center">
        <Button 
          variant="ghost"
          onClick={handleManageFavorites}
          className="text-sm text-brand-blue hover:underline p-0 h-auto font-normal"
        >
          Manage all favorites in My Profile
        </Button>
      </div>
    </div>
  );
  
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="px-4 pt-4 pb-6 max-w-md mx-auto h-[85vh] rounded-t-lg">
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className={`${expanded ? 'w-[66vw] sm:!max-w-[66vw]' : 'w-[42rem] sm:!max-w-[42rem]'} !max-w-[95vw] p-8 overflow-hidden flex flex-col z-[60000] transition-[width] duration-200`}
        hideCloseButton={true}
      >
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
};

export default FavoritesDrawer;