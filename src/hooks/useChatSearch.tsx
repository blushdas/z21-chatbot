import { useState, useMemo, useCallback, useEffect } from 'react';
import { searchChats, EnhancedChatSearchResult, generateChatSearchMetadata } from '@/utils/chatSearch';

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

interface SearchOptions {
  includeContent?: boolean;
  includeKeywords?: boolean;
  includeTopics?: boolean;
  includeMetadata?: boolean;
  minScore?: number;
}

export const useChatSearch = (chats: Chat[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOptions] = useState<SearchOptions>({
    includeContent: true,
    includeKeywords: true,
    includeTopics: true,
    includeMetadata: true,
    minScore: 0 // Allow all matches
  });

  // Debounced search implementation
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // Fix debouncing with proper cleanup
  const updateSearchTerm = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  // Use useEffect for proper debouncing with cleanup
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150); // Faster debounce for better UX
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const searchResults = useMemo((): EnhancedChatSearchResult[] => {
    if (!debouncedSearchTerm.trim()) {
      // Return all chats as enhanced results with no search metadata
      return chats.map(chat => {
        const searchMetadata = generateChatSearchMetadata({
          ...chat,
          timestamp: new Date(chat.createdAt),
          summary: []
        });
        
        return {
          ...chat,
          timestamp: new Date(chat.createdAt),
          summary: [],
          searchMetadata,
          matchScore: 1,
          matchReasons: [],
          contentSnippets: [],
          updatedAt: chat.updatedAt
        };
      });
    }

    // Convert Chat format to SavedChat format for search
    const savedChats = chats.map(chat => ({
      ...chat,
      timestamp: new Date(chat.createdAt),
      summary: []
    }));

    return searchChats(savedChats, debouncedSearchTerm, searchOptions);
  }, [chats, debouncedSearchTerm, searchOptions]);

  const searchStats = useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return {
        totalResults: chats.length,
        hasSearch: false,
        searchTerm: ''
      };
    }

    return {
      totalResults: searchResults.length,
      hasSearch: true,
      searchTerm: debouncedSearchTerm
    };
  }, [searchResults.length, debouncedSearchTerm, chats.length]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, []);

  return {
    searchTerm,
    updateSearchTerm,
    searchResults,
    searchStats,
    clearSearch,
    isSearching: searchTerm !== debouncedSearchTerm
  };
};