import React, { useState, useEffect, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useChatSearch } from '@/hooks/useChatSearch';
import { useAdvancedChatFilters } from '@/hooks/useAdvancedChatFilters';
import AdvancedChatFilters from './AdvancedChatFilters';
import { highlightSearchTerm } from '@/utils/searchHighlight';
import { formatDistanceToNow } from 'date-fns';
import { EnhancedChatSearchResult } from '@/utils/chatSearch';

interface Chat {
  id: string;
  title: string;
  messages: any[];
  createdAt: number;
  updatedAt: number;
  isDraft: boolean;
  mode: string;
  pinned: boolean;
  isTypingTitle?: boolean;
  folder_id?: string | null;
}

interface ChatSearchModalProps {
  open: boolean;
  onClose: () => void;
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chat: Chat) => void;
}

const ChatSearchModal: React.FC<ChatSearchModalProps> = ({
  open,
  onClose,
  chats,
  currentChatId,
  onSelectChat
}) => {
  const isMobile = useIsMobile();
  
  // Advanced filtering integration
  const {
    filters,
    filteredChats,
    filterStats,
    updateFilters,
    updateSearchTerm: updateAdvancedSearchTerm,
    updateDateRange,
    applyDatePreset,
    toggleMode,
    toggleTopic,
    clearFilters,
    hasActiveFilters
  } = useAdvancedChatFilters(chats.map(chat => ({
    id: chat.id,
    title: chat.title,
    messages: chat.messages,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    isDraft: chat.isDraft,
    mode: chat.mode,
    pinned: chat.pinned,
    folder_id: chat.folder_id
  })));

  // Use filteredChats from advanced filters instead of basic search
  const filteredResults = useMemo(() => {
    return filteredChats.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [filteredChats]);

  // Group results by time periods
  const groupedResults = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const oneWeek = 7 * oneDay;
    const oneMonth = 30 * oneDay;

    const groups = {
      today: [] as EnhancedChatSearchResult[],
      previous7Days: [] as EnhancedChatSearchResult[],
      previous30Days: [] as EnhancedChatSearchResult[],
      older: [] as EnhancedChatSearchResult[]
    };

    filteredResults.forEach(chat => {
      const timeDiff = now - chat.updatedAt;
      
      if (timeDiff < oneDay) {
        groups.today.push(chat);
      } else if (timeDiff < oneWeek) {
        groups.previous7Days.push(chat);
      } else if (timeDiff < oneMonth) {
        groups.previous30Days.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return groups;
  }, [filteredResults]);

  // Clear filters when modal closes
  useEffect(() => {
    if (!open) {
      clearFilters();
    }
  }, [open, clearFilters]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, onClose]);

  const handleSelectChat = (chat: Chat) => {
    onSelectChat(chat);
    onClose();
  };

  const renderChatGroup = (title: string, chats: EnhancedChatSearchResult[]) => {
    if (chats.length === 0) return null;

    return (
      <div key={title} className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
          {title}
        </h3>
        <div className="space-y-1">
          {chats.map(chat => (
            <button
              key={chat.id}
              onClick={() => handleSelectChat(chat)}
              className={`w-full text-left p-3 rounded-lg transition-colors hover:bg-accent group ${
                chat.id === currentChatId ? 'bg-accent' : ''
              }`}
            >
              <div className="font-medium text-sm mb-1">
                {filters.searchTerm.trim() ? (
                  highlightSearchTerm(chat.title, filters.searchTerm, "bg-primary/20 text-primary")
                ) : (
                  chat.title
                )}
              </div>
              
              {/* Content snippets */}
              {filters.searchTerm.trim() && chat.contentSnippets && chat.contentSnippets.length > 0 && (
                <div className="text-xs text-muted-foreground/80 mb-2 leading-relaxed">
                  {chat.contentSnippets.slice(0, 1).map((snippet, index) => (
                    <div key={index} className="italic">
                      {highlightSearchTerm(snippet.content, filters.searchTerm, "bg-primary/15 text-primary/90 font-medium")}
                    </div>
                  ))}
                </div>
              )}
              
              <div className="text-xs text-muted-foreground">
                {(() => {
                  try {
                    const timestamp = chat.updatedAt || chat.createdAt || Date.now();
                    const date = new Date(timestamp);
                    if (isNaN(date.getTime())) {
                      return 'Unknown time';
                    }
                    return formatDistanceToNow(date, { addSuffix: true });
                  } catch (error) {
                    return 'Unknown time';
                  }
                })()}
                {chat.messages.length > 0 && (
                  <span className="ml-2">
                    {chat.messages.length} message{chat.messages.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "p-0 gap-0 z-[100] flex flex-col",
          isMobile 
            ? "fixed inset-0 w-screen h-[100dvh] max-w-none translate-x-0 translate-y-0 left-0 top-0 rounded-none m-0"
            : "max-w-2xl w-full h-[600px]"
        )}
        hideCloseButton={true}
      >
        {/* Header with search and filters */}
        <div className="border-b">
          <div className="flex items-center gap-3 p-4">
            <Search className="text-muted-foreground" size={20} />
            <Input
              placeholder="Search chats..."
              value={filters.searchTerm}
              onChange={(e) => updateAdvancedSearchTerm(e.target.value)}
              className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base"
              autoFocus
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X size={16} />
            </Button>
          </div>
          <AdvancedChatFilters
            filters={filters}
            filterStats={filterStats}
            onUpdateFilters={updateFilters}
            onUpdateSearchTerm={updateAdvancedSearchTerm}
            onApplyDatePreset={applyDatePreset}
            onToggleMode={toggleMode}
            onToggleTopic={toggleTopic}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Results */}
        <ScrollArea className="flex-1 p-4 overflow-y-auto">
          {filteredResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {filters.searchTerm.trim() || hasActiveFilters ? 'No chats found' : 'No chats available'}
            </div>
          ) : (
            <div>
              {renderChatGroup('Today', groupedResults.today)}
              {renderChatGroup('Previous 7 Days', groupedResults.previous7Days)}
              {renderChatGroup('Previous 30 Days', groupedResults.previous30Days)}
              {renderChatGroup('Older', groupedResults.older)}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ChatSearchModal;