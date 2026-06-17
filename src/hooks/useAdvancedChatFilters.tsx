import { useState, useMemo, useCallback } from 'react';
import { ChatFilters, DEFAULT_FILTERS, FilterStats, FilterOption, DateRange } from '@/types/chatFilters';
import { EnhancedChatSearchResult, generateChatSearchMetadata } from '@/utils/chatSearch';

interface Chat {
  id: string;
  title: string;
  messages: any[];
  createdAt: number;
  updatedAt: number;
  isDraft: boolean;
  mode: string;
  pinned: boolean;
  folder_id?: string | null;
}

export const useAdvancedChatFilters = (chats: Chat[]) => {
  const [filters, setFilters] = useState<ChatFilters>(DEFAULT_FILTERS);

  // Generate filter statistics
  const filterStats = useMemo((): FilterStats => {
    const topics = new Set<string>();
    const modes = new Map<string, number>();
    let earliest = new Date();
    let latest = new Date(0);

    chats.forEach(chat => {
      // Track modes
      const currentCount = modes.get(chat.mode) || 0;
      modes.set(chat.mode, currentCount + 1);

      // Extract topics
      const metadata = generateChatSearchMetadata({
        ...chat,
        timestamp: new Date(chat.createdAt),
        summary: []
      });
      metadata.topics.forEach(topic => topics.add(topic));

      // Track date ranges
      const chatDate = new Date(chat.createdAt);
      if (chatDate < earliest) earliest = chatDate;
      if (chatDate > latest) latest = chatDate;
    });

    const availableTopics: FilterOption[] = Array.from(topics).map(topic => ({
      value: topic,
      label: topic.charAt(0).toUpperCase() + topic.slice(1),
      count: chats.filter(chat => {
        const metadata = generateChatSearchMetadata({
          ...chat,
          timestamp: new Date(chat.createdAt),
          summary: []
        });
        return metadata.topics.includes(topic);
      }).length
    }));

    const availableModes: FilterOption[] = Array.from(modes.entries()).map(([mode, count]) => ({
      value: mode,
      label: mode.charAt(0).toUpperCase() + mode.slice(1),
      count
    }));

    return {
      totalChats: chats.length,
      filteredChats: 0, // Will be calculated after filtering
      availableTopics: availableTopics.sort((a, b) => (b.count || 0) - (a.count || 0)),
      availableModes: availableModes.sort((a, b) => (b.count || 0) - (a.count || 0)),
      dateRanges: {
        earliest: chats.length > 0 ? earliest : new Date(),
        latest: chats.length > 0 ? latest : new Date()
      }
    };
  }, [chats]);

  // Apply date preset to filters
  const applyDatePreset = useCallback((preset: string) => {
    const now = new Date();
    let start: Date | undefined;
    let end: Date | undefined;

    switch (preset) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'yesterday':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'thisWeek':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        start = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate());
        end = new Date();
        break;
      case 'thisMonth':
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date();
        break;
      case 'lastMonth':
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'last3Months':
        start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        end = new Date();
        break;
      case 'last6Months':
        start = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        end = new Date();
        break;
      case 'thisYear':
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date();
        break;
    }

    setFilters(prev => ({
      ...prev,
      datePreset: preset === 'custom' ? undefined : preset as any,
      dateRange: { start, end }
    }));
  }, []);

  // Filter and sort chats
  const filteredChats = useMemo((): EnhancedChatSearchResult[] => {
    let filtered = chats.map(chat => ({
      ...chat,
      timestamp: new Date(chat.createdAt),
      summary: [],
      searchMetadata: generateChatSearchMetadata({
        ...chat,
        timestamp: new Date(chat.createdAt),
        summary: []
      }),
      matchScore: 0,
      matchReasons: [],
      contentSnippets: [],
      updatedAt: chat.updatedAt,
      createdAt: chat.createdAt
    }));

    // Apply search filter
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(chat => {
        return (
          chat.title.toLowerCase().includes(searchLower) ||
          chat.messages.some(msg => msg.content.toLowerCase().includes(searchLower)) ||
          chat.searchMetadata.keywords.some(keyword => keyword.includes(searchLower)) ||
          chat.searchMetadata.topics.some(topic => topic.includes(searchLower))
        );
      });
    }

    // Apply date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      filtered = filtered.filter(chat => {
        const chatDate = new Date(chat.createdAt);
        if (filters.dateRange.start && chatDate < filters.dateRange.start) return false;
        if (filters.dateRange.end && chatDate > filters.dateRange.end) return false;
        return true;
      });
    }

    // Apply mode filter
    if (filters.modes.length > 0) {
      filtered = filtered.filter(chat => filters.modes.includes(chat.mode));
    }

    // Apply message count filter
    if (filters.messageCountRange.min !== undefined || filters.messageCountRange.max !== undefined) {
      filtered = filtered.filter(chat => {
        const count = chat.messages.length;
        if (filters.messageCountRange.min !== undefined && count < filters.messageCountRange.min) return false;
        if (filters.messageCountRange.max !== undefined && count > filters.messageCountRange.max) return false;
        return true;
      });
    }

    // Apply character count filter
    if (filters.characterCountRange.min !== undefined || filters.characterCountRange.max !== undefined) {
      filtered = filtered.filter(chat => {
        const totalChars = chat.messages.reduce((sum, msg) => sum + msg.content.length, 0);
        if (filters.characterCountRange.min !== undefined && totalChars < filters.characterCountRange.min) return false;
        if (filters.characterCountRange.max !== undefined && totalChars > filters.characterCountRange.max) return false;
        return true;
      });
    }

    // Apply topic filter
    if (filters.topics.length > 0) {
      filtered = filtered.filter(chat => 
        filters.topics.some(topic => chat.searchMetadata.topics.includes(topic))
      );
    }

    // Apply additional filters
    if (filters.hasLongMessages !== undefined) {
      filtered = filtered.filter(chat => chat.searchMetadata.hasLongMessages === filters.hasLongMessages);
    }

    if (filters.isPinned !== undefined) {
      filtered = filtered.filter(chat => chat.pinned === filters.isPinned);
    }

    if (filters.isDraft !== undefined) {
      filtered = filtered.filter(chat => chat.isDraft === filters.isDraft);
    }

    if (filters.hasFolder !== undefined) {
      filtered = filtered.filter(chat => 
        filters.hasFolder ? !!chat.folder_id : !chat.folder_id
      );
    }

    if (filters.folderId) {
      filtered = filtered.filter(chat => chat.folder_id === filters.folderId);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'relevance':
          comparison = b.matchScore - a.matchScore;
          break;
        case 'date':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'lastUpdated':
          comparison = a.updatedAt - b.updatedAt;
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'messageCount':
          comparison = a.messages.length - b.messages.length;
          break;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [chats, filters]);

  // Update filter functions
  const updateFilters = useCallback((newFilters: Partial<ChatFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const updateSearchTerm = useCallback((searchTerm: string) => {
    updateFilters({ searchTerm });
  }, [updateFilters]);

  const updateDateRange = useCallback((dateRange: DateRange) => {
    setFilters(prev => ({
      ...prev,
      dateRange,
      datePreset: undefined // Clear preset when manually setting range
    }));
  }, []);

  const toggleMode = useCallback((mode: string) => {
    setFilters(prev => ({
      ...prev,
      modes: prev.modes.includes(mode)
        ? prev.modes.filter(m => m !== mode)
        : [...prev.modes, mode]
    }));
  }, []);

  const toggleTopic = useCallback((topic: string) => {
    setFilters(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm.trim() !== '' ||
      filters.dateRange.start !== undefined ||
      filters.dateRange.end !== undefined ||
      filters.modes.length > 0 ||
      filters.messageCountRange.min !== undefined ||
      filters.messageCountRange.max !== undefined ||
      filters.characterCountRange.min !== undefined ||
      filters.characterCountRange.max !== undefined ||
      filters.topics.length > 0 ||
      filters.hasLongMessages !== undefined ||
      filters.isPinned !== undefined ||
      filters.isDraft !== undefined ||
      filters.hasFolder !== undefined ||
      !!filters.folderId
    );
  }, [filters]);

  return {
    filters,
    filteredChats,
    filterStats: {
      ...filterStats,
      filteredChats: filteredChats.length
    },
    updateFilters,
    updateSearchTerm,
    updateDateRange,
    applyDatePreset,
    toggleMode,
    toggleTopic,
    clearFilters,
    hasActiveFilters
  };
};