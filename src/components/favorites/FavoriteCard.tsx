
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FavoriteItem, useFavorites } from '@/context/FavoritesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, MessageCircle, Trash2, Pencil, Check, X, MessagesSquare } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { HighlightText } from '@/utils/searchHighlight';
import { supabase } from '@/integrations/supabase/client';
import { parseMarkdownBold } from '@/utils/markdownParser';

interface FavoriteCardProps {
  favorite: FavoriteItem;
  onClose?: () => void;
  onViewInChat?: (favorite: FavoriteItem) => void;
  searchTerm?: string;
}

const FavoriteCard: React.FC<FavoriteCardProps> = ({ favorite, onClose, onViewInChat, searchTerm = '' }) => {
  const { removeFavorite, rawFavorites, updateFavoriteTitle } = useFavorites();
  const navigate = useNavigate();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(favorite.title || 'Untitled Favorite');
  
  const formattedDate = formatDate(favorite.addedAt);
  const rawFavorite = rawFavorites.find(fav => fav.id === favorite.id);
  const chatTitle = rawFavorite?.chat_title || 'Untitled chat';

  const handleCopy = () => {
    navigator.clipboard.writeText(favorite.message.content);
    toast({
      title: "Copied to clipboard",
      duration: 2000,
    });
  };

  const handleUnfavorite = () => {
    removeFavorite(favorite.id);
    toast({
      title: "Removed from favorites",
      description: "This response has been removed from your favorites.",
      duration: 2000,
    });
  };

  const handleSaveTitle = async () => {
    if (editedTitle.trim() === '') {
      toast({
        title: "Invalid title",
        description: "Title cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    const success = await updateFavoriteTitle(favorite.id, editedTitle.trim());
    if (success) {
      setIsEditingTitle(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedTitle(favorite.title || 'Untitled Favorite');
    setIsEditingTitle(false);
  };

  const handleViewInChat = async () => {
    // Find the raw favorite record to get chat_id
    const rawFavorite = rawFavorites.find(fav => fav.id === favorite.id);
    
    if (!rawFavorite) {
      toast({
        title: "Error",
        description: "Could not find chat information for this favorite.",
        variant: "destructive",
      });
      return;
    }
    
    // Close the favorites drawer/modal if onClose is provided
    if (onClose) {
      onClose();
    }
    
    // Navigate directly to the chat using React Router
    navigate(`/chat/${rawFavorite.chat_id}`);
  };

  const formatMessageContent = (content: string) => {
    return <div className="prose max-w-none whitespace-pre-wrap">{parseMarkdownBold(content)}</div>;
  };

  // Show truncated content with consistent length
  const truncatedContent = favorite.message.content.length > 300 
    ? favorite.message.content.substring(0, 300) + '...' 
    : favorite.message.content;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="p-4 bg-muted/50">
        <div className="flex flex-col gap-1">
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                className="h-8 text-base font-medium"
                aria-label="Edit favorite title"
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleSaveTitle} aria-label="Save title">
                <Check size={16} />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={handleCancelEdit} aria-label="Cancel rename">
                <X size={16} />
              </Button>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-foreground break-words leading-tight flex-1">
                <HighlightText
                  text={favorite.title || 'Untitled Favorite'}
                  searchTerm={searchTerm}
                />
              </h3>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setEditedTitle(favorite.title || 'Untitled Favorite');
                  setIsEditingTitle(true);
                }}
                aria-label="Rename favorite"
                title="Rename favorite (does not rename the chat)"
              >
                <Pencil size={14} />
              </Button>
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            {formattedDate}
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <MessagesSquare size={12} className="shrink-0" />
            <span className="truncate">From: <span className="font-medium text-foreground/80">{chatTitle}</span></span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 font-serif">
        <div className="text-foreground/90 leading-relaxed max-h-72 overflow-hidden relative">
          {parseMarkdownBold(favorite.message.content)}
          {favorite.message.content.length > 400 && (
            <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          )}
        </div>
        <div className="mt-3 flex justify-center">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={handleViewInChat}
          >
            <MessageCircle size={14} className="mr-1" />
            <span>View in Chat</span>
          </Button>
        </div>
      </CardContent>
      
      <CardFooter className="p-6 bg-muted/50">
        <div className="flex gap-3 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center justify-center gap-2 flex-1" 
            onClick={handleCopy}
          >
            <Copy size={16} />
            <span>Copy</span>
          </Button>
          
          <Button 
            variant="outline"
            size="sm"
            className={cn(
              "flex items-center justify-center gap-2 flex-1 text-red-600 border-red-200 bg-red-50 hover:text-red-700",
              "dark:text-red-400 dark:border-red-900/50 dark:bg-red-900/20",
              "hover:bg-red-100 dark:hover:bg-red-900/30"
            )}
            onClick={handleUnfavorite}
          >
            <Trash2 size={16} />
            <span>Remove</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default FavoriteCard;
