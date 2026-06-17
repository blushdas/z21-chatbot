
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FeedbackEntry {
  id: string;
  user_id: string | null;
  chat_id: string | null;
  message_id: string;
  role: string | null;
  original_message: string | null;
  edited_message: string | null;
  length_preference: string | null;
  rating: string | null;
  comment: string | null;
  created_at: string;
  profiles: {
    name: string | null;
    id: string;
  } | null;
}

export const useFeedbackDashboard = () => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number | 'unlimited'>(() => {
    const saved = localStorage.getItem('feedbackItemsPerPage');
    return saved ? (saved === 'unlimited' ? 'unlimited' : parseInt(saved)) : 100;
  });

  // Fetch feedback data from Supabase
  const { data: feedbackData = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-feedback'],
    retry: 1,
    queryFn: async () => {
      const { data: feedback, error: feedbackError } = await supabase
        .from('feedback_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (feedbackError) throw feedbackError;

      const userIds = [...new Set(feedback?.map(f => f.user_id).filter(Boolean))] as string[];
      
      let profiles: { id: string; name: string | null }[] = [];
      if (userIds.length > 0) {
        // Use profiles_public view to avoid exposing sensitive columns
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles_public')
          .select('id, name')
          .in('id', userIds);

        if (profilesError) throw profilesError;
        profiles = profilesData || [];
      }

      const profileLookup = Object.fromEntries(
        profiles.map(p => [p.id, p])
      );

      const feedbackWithProfiles: FeedbackEntry[] = (feedback || []).map(f => ({
        ...f,
        profiles: f.user_id ? profileLookup[f.user_id] || null : null
      }));

      // Recover missing message content from chats (for older feedback entries)
      const feedbackNeedingRecovery = feedbackWithProfiles.filter(
        f => !f.original_message && f.chat_id && f.message_id
      );

      if (feedbackNeedingRecovery.length > 0) {
        // Batch fetch all required chats
        const uniqueChatIds = [...new Set(feedbackNeedingRecovery.map(f => f.chat_id).filter(Boolean))] as string[];
        
        const { data: chatsData, error: chatsError } = await supabase
          .from('chats')
          .select('id, messages')
          .in('id', uniqueChatIds);

        if (!chatsError && chatsData) {
          const chatLookup = Object.fromEntries(
            chatsData.map(chat => [chat.id, chat])
          );

          // Map recovered content back to feedback entries
          const feedbackWithRecoveredMessages = feedbackWithProfiles.map(entry => {
            if (!entry.original_message && entry.chat_id && entry.message_id) {
              const chat = chatLookup[entry.chat_id];
              if (chat?.messages) {
                const matchingMessage = (chat.messages as any[]).find(
                  (m: any) => m.id === entry.message_id
                );
                if (matchingMessage) {
                  return {
                    ...entry,
                    original_message: matchingMessage.content || matchingMessage.text || null,
                    role: entry.role || (matchingMessage.sender === 'user' ? 'user' : 'bot')
                  };
                }
              }
            }
            return entry;
          });

          return feedbackWithRecoveredMessages;
        }
      }

      return feedbackWithProfiles;
    },
  });

  // Category filtering logic - updated to properly handle edit feedback
  const categorizedFeedback = useMemo(() => {
    return feedbackData.filter(item => {
      switch (activeTab) {
        case 'rewrite':
          // Include items with edited_message OR items that have detailed ratings in comments
          return item.edited_message || (item.comment && item.comment.includes('Length:') && item.comment.includes('Accuracy:'));
        case 'positive': 
          return item.rating === 'thumbs_up';
        case 'negative':
          return item.rating === 'thumbs_down';
        case 'comment':
          // Comments without edits, but exclude rating-only comments from edit modal
          return item.comment && !item.edited_message && !item.comment.includes('Length:');
        default:
          return true;
      }
    });
  }, [feedbackData, activeTab]);

  // Search and sort filtering
  const allFilteredFeedback = useMemo(() => {
    let filtered = categorizedFeedback.filter(item => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      const userName = item.profiles?.name || 'Anonymous';
      return (
        userName.toLowerCase().includes(searchLower) ||
        (item.original_message && item.original_message.toLowerCase().includes(searchLower)) ||
        (item.edited_message && item.edited_message.toLowerCase().includes(searchLower)) ||
        (item.comment && item.comment.toLowerCase().includes(searchLower)) ||
        (item.role && item.role.toLowerCase().includes(searchLower)) ||
        (item.message_id && item.message_id.toLowerCase().includes(searchLower))
      );
    });

    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'category':
          const getCategoryOrder = (item: FeedbackEntry) => {
            if (item.rating === 'thumbs_down') return 0;
            if (item.rating === 'thumbs_up') return 1;
            if (item.edited_message) return 2;
            if (item.comment && !item.edited_message) return 3;
            return 4;
          };
          comparison = getCategoryOrder(a) - getCategoryOrder(b);
          break;
        case 'user':
          const userA = a.profiles?.name || 'Anonymous';
          const userB = b.profiles?.name || 'Anonymous';
          if (userA === 'Anonymous' && userB !== 'Anonymous') return 1;
          if (userA !== 'Anonymous' && userB === 'Anonymous') return -1;
          comparison = userA.localeCompare(userB);
          break;
        case 'rating':
          const getRatingOrder = (rating: string | null) => {
            if (rating === 'thumbs_down') return 0;
            if (rating === 'thumbs_up') return 1;
            return 2;
          };
          comparison = getRatingOrder(a.rating) - getRatingOrder(b.rating);
          break;
        case 'originalMessage':
          const messageA = a.original_message || '';
          const messageB = b.original_message || '';
          comparison = messageA.localeCompare(messageB);
          break;
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'chat':
          const hasChat = (item: FeedbackEntry) => item.chat_id ? 0 : 1;
          comparison = hasChat(a) - hasChat(b);
          if (comparison === 0) {
            comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
          break;
        default:
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [categorizedFeedback, searchTerm, sortBy, sortDirection]);

  // Pagination logic
  const paginationData = useMemo(() => {
    const totalItems = allFilteredFeedback.length;
    
    if (itemsPerPage === 'unlimited') {
      return {
        paginatedData: allFilteredFeedback,
        totalPages: 1,
        startIndex: 0,
        endIndex: totalItems
      };
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedData = allFilteredFeedback.slice(startIndex, endIndex);

    return {
      paginatedData,
      totalPages,
      startIndex,
      endIndex
    };
  }, [allFilteredFeedback, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, categorizedFeedback]);

  // Save itemsPerPage to localStorage
  React.useEffect(() => {
    localStorage.setItem('feedbackItemsPerPage', itemsPerPage.toString());
  }, [itemsPerPage]);

  // Reset page if current page exceeds total pages
  React.useEffect(() => {
    if (currentPage > paginationData.totalPages && paginationData.totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, paginationData.totalPages]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number | 'unlimited') => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // Metrics calculation - updated to properly count edit feedback
  const metrics = useMemo(() => {
    return {
      total: feedbackData.length,
      thumbsUp: feedbackData.filter(item => item.rating === 'thumbs_up').length,
      thumbsDown: feedbackData.filter(item => item.rating === 'thumbs_down').length,
      edits: feedbackData.filter(item => 
        item.edited_message || (item.comment && item.comment.includes('Length:') && item.comment.includes('Accuracy:'))
      ).length,
      comments: feedbackData.filter(item => 
        item.comment && !item.edited_message && !item.comment.includes('Length:')
      ).length,
    };
  }, [feedbackData]);

  // Tab counts - updated to properly count edit feedback
  const tabCounts = useMemo(() => {
    return {
      all: feedbackData.length,
      rewrite: feedbackData.filter(item => 
        item.edited_message || (item.comment && item.comment.includes('Length:') && item.comment.includes('Accuracy:'))
      ).length,
      positive: feedbackData.filter(item => item.rating === 'thumbs_up').length,
      negative: feedbackData.filter(item => item.rating === 'thumbs_down').length,
      comment: feedbackData.filter(item => 
        item.comment && !item.edited_message && !item.comment.includes('Length:')
      ).length,
    };
  }, [feedbackData]);

  const exportCSV = () => {
    const csvContent = [
      ['Date', 'User', 'Category', 'Original Message', 'Edited Message', 'Rating', 'Comment', 'Length Preference'].join(','),
      ...allFilteredFeedback.map(item => [
        new Date(item.created_at).toLocaleDateString(),
        item.profiles?.name || 'Anonymous',
        getCategoryName(item),
        item.original_message || '',
        item.edited_message || '',
        item.rating || '',
        item.comment || '',
        item.length_preference || ''
      ].map(field => `"${field.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCategoryName = (item: FeedbackEntry) => {
    if (item.edited_message || (item.comment && item.comment.includes('Length:') && item.comment.includes('Accuracy:'))) {
      return 'Rewrite';
    }
    if (item.rating === 'thumbs_up') return 'Positive';
    if (item.rating === 'thumbs_down') return 'Negative';
    if (item.comment && !item.edited_message && !item.comment.includes('Length:')) return 'Comment';
    return 'Other';
  };

  return {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    handleSort,
    isLoading,
    isError,
    error: error as Error | null,
    refetch,
    metrics,
    tabCounts,
    filteredFeedback: paginationData.paginatedData,
    allFilteredFeedback,
    currentPage,
    totalPages: paginationData.totalPages,
    itemsPerPage,
    totalItems: allFilteredFeedback.length,
    startIndex: paginationData.startIndex,
    endIndex: paginationData.endIndex,
    handlePageChange,
    handleItemsPerPageChange,
    exportCSV
  };
};
