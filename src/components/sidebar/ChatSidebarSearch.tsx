
import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchStats {
  totalResults: number;
  hasSearch: boolean;
  searchTerm: string;
}

interface ChatSidebarSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  isAuthenticated: boolean;
  searchStats?: SearchStats;
  onClearSearch?: () => void;
  isSearching?: boolean;
}

const ChatSidebarSearch: React.FC<ChatSidebarSearchProps> = ({
  searchTerm,
  onSearchChange,
  isAuthenticated,
  searchStats,
  onClearSearch,
  isSearching = false
}) => {
  if (!isAuthenticated) return null;

  return (
    <div className="p-4 border-b border-brand-yellow/30">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--ui-icon)]" size={16} />
        <Input
          placeholder="Search chats..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9 text-sm bg-brand-blue/50 border-brand-yellow/30 text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] focus:border-brand-yellow"
        />
        {searchTerm && onClearSearch && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSearch}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-[var(--ui-icon)] hover:text-[var(--ui-icon-hover)] hover:bg-brand-blue/50"
          >
            <X size={12} />
          </Button>
        )}
      </div>
      
      {/* Search Stats */}
      {searchStats && searchStats.hasSearch && (
        <div className="mt-2 text-xs text-[var(--chat-muted)]">
          {isSearching ? (
            <span>Searching...</span>
          ) : (
            <span>
              Found {searchStats.totalResults} chat{searchStats.totalResults !== 1 ? 's' : ''} 
              {searchStats.searchTerm && ` matching "${searchStats.searchTerm}"`}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatSidebarSearch;
