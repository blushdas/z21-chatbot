import React, { useMemo, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChatGPTSidebar from './ChatGPTSidebar';
import { useChatManagementContext } from '@/context/ChatManagementContext';
import { ChatMode } from '@/components/ChatInterface';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useSidebarState } from '@/hooks/useSidebarState';
import { SourceComparisonProvider } from '@/hooks/useSourceComparison';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

interface SavedChatsSidebarProps {
  onResumeChat: (chat: any) => void;
  onStartNewChat: () => void;
}

const SavedChatsSidebar: React.FC<SavedChatsSidebarProps> = ({ 
  onResumeChat, 
  onStartNewChat 
}) => {
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const { user } = useAuth();
  const navigate = useNavigate();
  const { chatId } = useParams<{ chatId: string }>();
  const { shouldCreateNewChatOnLoad, setShouldCreateNewChatOnLoad, closeSidebar } = useSidebarState();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { 
    savedChats, 
    setSavedChats,
    currentChatId, 
    createNewChat,
    findOrCreateEmptyChat,
    resumeChat,
    updateChatTitle,
    deleteChat,
    togglePinStatus,
    loadChats,
    isAuthenticated,
    initialized,
    loadChatsPage,
    getTotalCount // ✅ Get count function for accurate pagination
  } = useChatManagementContext();

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const CHATS_PER_PAGE = 50;

  // Compute hasMore based on accurate count
  const hasMore = useMemo(() => {
    return savedChats.length < totalCount;
  }, [savedChats.length, totalCount]);

  // Fetch total count on initialization (efficient query - only counts, no data)
  useEffect(() => {
    if (isAuthenticated && initialized && getTotalCount) {
      getTotalCount().then(count => {
        console.log(`📊 Total chats available: ${count}`);
        setTotalCount(count);
      });
    }
  }, [isAuthenticated, initialized, getTotalCount]);

  // Listen for title saves (fallback when real-time is down)
  useEffect(() => {
    const handleTitleSaved = (event: CustomEvent) => {
      const { chatId, title, updatedAt } = event.detail;
      console.log('📢 Title saved event received:', { chatId, title });
      
      // ✅ Update title without re-sorting or changing updated_at
      setSavedChats(prev => 
        prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, title, isTypingTitle: false }
            : chat
        )
      );
    };

    window.addEventListener('chatTitleSaved', handleTitleSaved as EventListener);
    
    return () => {
      window.removeEventListener('chatTitleSaved', handleTitleSaved as EventListener);
    };
  }, [setSavedChats]);

  // Listen for optimistic folder updates for instant UI changes
  useEffect(() => {
    const handleOptimisticUpdate = (event: CustomEvent) => {
      const { chatId, folderId } = event.detail;
      
      
      // Update local state immediately using the saved chats setter
      // ✅ Don't update updated_at - viewing action shouldn't change sort order
      setSavedChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId 
            ? { ...chat, folder_id: folderId }
            : chat
        )
      );
    };

    const handleRevertUpdate = (event: CustomEvent) => {
      const { chatId, originalFolderId } = event.detail;
      
      
      // Revert local state
      setSavedChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId 
            ? { ...chat, folder_id: originalFolderId }
            : chat
        )
      );
    };

    window.addEventListener('chatFolderOptimistic', handleOptimisticUpdate as EventListener);
    window.addEventListener('chatFolderRevert', handleRevertUpdate as EventListener);
    const handleRealtimeConfirmed = (event: CustomEvent) => {
      const { chatId, folderId } = event.detail;
      
      setSavedChats(prevChats => prevChats.map(chat => chat.id === chatId ? { ...chat, folder_id: folderId } : chat));
    };
    window.addEventListener('chatFolderUpdated', handleRealtimeConfirmed as EventListener);

    return () => {
      window.removeEventListener('chatFolderOptimistic', handleOptimisticUpdate as EventListener);
      window.removeEventListener('chatFolderRevert', handleRevertUpdate as EventListener);
      window.removeEventListener('chatFolderUpdated', handleRealtimeConfirmed as EventListener);
    };
  }, [setSavedChats]);

  // Keep totalCount in sync with the actual list length to avoid stale pagination after realtime inserts handled centrally
  useEffect(() => {
    if (savedChats.length > totalCount) {
      setTotalCount(savedChats.length);
    }
  }, [savedChats.length, totalCount]);

  // NOTE: Sidebar highlighting uses URL (chatId from useParams) as source of truth
  // resumeChat is called ONLY by ChatInterface when resumedChatId changes
  // This prevents duplicate calls causing multiple load transitions

  // Auto-create new chat on first load if no chats exist
  useEffect(() => {
    if (
      initialized &&
      isAuthenticated &&
      savedChats.length === 0 &&
      !currentChatId &&
      shouldCreateNewChatOnLoad
    ) {
      setShouldCreateNewChatOnLoad(false);
      handleNewChat();
    }
  }, [
    initialized,
    isAuthenticated,
    savedChats.length,
    currentChatId,
    shouldCreateNewChatOnLoad,
    setShouldCreateNewChatOnLoad
  ]);


  // ENHANCED: Show chats with messages OR brand new empty chats
  const formattedChats = useMemo(() => {
    if (!isAuthenticated) return [];
    
    // Filter to show chats with content OR brand new chats (no messages yet)
    const chatsWithContent = savedChats.filter(chat => {
      const messages = chat.messages || [];
      const hasUserMessage = messages.some(m => m.sender === 'user');
      const hasBotMessage = messages.some(m => m.sender === 'daryle');
      
      // Show chat if:
      // 1. It has both user and bot messages (active conversation)
      // 2. It has NO messages at all (brand new chat waiting for first message)
      // 3. It has only user messages (bot response may still be streaming/saving)
      return (hasUserMessage && hasBotMessage) || messages.length === 0 || hasUserMessage;
    });
    
    const formatted = chatsWithContent.map(chat => {
      const isNewChat = Date.now() - new Date(chat.created_at).getTime() < 3000; // New if created in last 3 seconds
      
      return {
        id: chat.id,
        title: chat.title,
        messages: chat.messages,
        createdAt: chat.created_at ? new Date(chat.created_at).getTime() : Date.now(),
        timestamp: new Date(chat.created_at || Date.now()),
        isDraft: false,
        mode: chat.mode as ChatMode,
        pinned: chat.pinned || false,
        folder_id: chat.folder_id,
        updatedAt: chat.updated_at ? new Date(chat.updated_at).getTime() : Date.now(),
        isNew: isNewChat, // Flag for fade-in animation
        isTypingTitle: (chat as any).isTypingTitle || false
      };
    });

    return formatted;
  }, [savedChats, isAuthenticated]);

  // Calculate displayedCurrentChatId with REAL-TIME URL sync (URL is source of truth)
  const displayedCurrentChatId = useMemo(() => {
    if (!isAuthenticated) return null;
    
    // CRITICAL: URL parameter is ALWAYS the source of truth for sidebar highlighting
    // This ensures real-time visual feedback when navigating between chats
    const activeId = chatId || currentChatId;
    
    console.log('🎯 SIDEBAR HIGHLIGHT: Active chat determined', {
      urlChatId: chatId,
      contextChatId: currentChatId,
      selectedForHighlight: activeId,
      source: chatId ? 'URL (real-time)' : 'Context (fallback)'
    });
    
    return activeId || null;
  }, [chatId, currentChatId, isAuthenticated]);

  // Define functions after all hooks but before early return
  const handleNewChat = async () => {
    if (!isAuthenticated || isCreatingChat) return;
    
    // New Chat from the sidebar always starts OUTSIDE any project. Only reuse
    // empty chats that aren't inside a folder.
    const existingEmptyChat = savedChats.find(chat =>
      Array.isArray(chat.messages) && chat.messages.length === 0 && !chat.folder_id
    );
    
    if (existingEmptyChat) {
      // Already on this empty chat - don't re-navigate
      if (existingEmptyChat.id === chatId) {
        console.log('🚫 Already on empty chat, ignoring New Chat click');
        return;
      }
      console.log('♻️ Empty chat already exists, navigating to:', existingEmptyChat.id);
      navigate(`/chat/${existingEmptyChat.id}`, { replace: true });
      onStartNewChat();
      return;
    }
    
    setIsCreatingChat(true);
    
    try {
      // Create new chat since no empty chat exists
      const newChatId = await findOrCreateEmptyChat('coach', false);
      
      if (newChatId) {
        // Update total count after creating new chat
        setTotalCount((prev) => prev + 1);
        
        // Navigate to the new chat URL - this will trigger the necessary updates
        navigate(`/chat/${newChatId}`, { replace: true });
        
        // Notify parent component about the new chat
        onStartNewChat();
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleSelectChat = (chat: any) => {
    console.log('🖱️ Chat clicked:', {
      chatId: chat.id,
      chatTitle: chat.title,
      isAuthenticated,
      currentChatId,
      urlChatId: chatId
    });
    
    if (!isAuthenticated) {
      console.log('🚫 Not authenticated - ignoring click');
      return;
    }

    // Compare with URL chatId for tight coupling (URL is source of truth)
    const activeChat = chatId || currentChatId;
    if (chat.id === activeChat) {
      console.log('🚫 Already on this chat - ignoring click');
      return;
    }
    
    console.log('✅ REAL-TIME NAVIGATION: Switching to chat:', chat.id);
    
    // CRITICAL: Navigate ONLY - ChatInterface's useEffect will handle resumeChat
    // This prevents duplicate resumeChat calls causing multiple load transitions
    navigate(`/chat/${chat.id}`, { replace: true });
    
    // Close mobile drawer after selection so user sees the chat immediately
    if (isMobile) {
      closeSidebar();
    }
  };

  const handleLoadMore = async () => {
    if (!isAuthenticated || !loadChatsPage) return;

    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const offset = nextPage * CHATS_PER_PAGE;

      const more = await loadChatsPage(CHATS_PER_PAGE, offset);

      if (more && more.length > 0) {
        setSavedChats((prev) => {
          const existing = new Set(prev.map((c) => c.id));
          const appended = more.filter((c) => !existing.has(c.id));
          return [...prev, ...appended];
        });
        setCurrentPage(nextPage);
        // hasMore is now computed from totalCount, no need to set it here
      }
    } catch (error) {
      console.error('Error loading more chats:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!isAuthenticated) return;
    
    await updateChatTitle(chatId, newTitle);
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!isAuthenticated) return;
    
    await deleteChat(chatId);
    
    // Update total count after deletion
    setTotalCount(prev => Math.max(0, prev - 1));
    
    // If we're deleting the current chat, start a new one
    if (chatId === currentChatId) {
      await handleNewChat();
    }
  };

  const handleTogglePin = async (chatId: string, pinned: boolean) => {
    if (!isAuthenticated) return;
    
    await togglePinStatus(chatId, pinned);
  };

  const handleCleanEmptyChats = async () => {
    if (!isAuthenticated) return;

    const emptyChats = savedChats.filter(chat => 
      Array.isArray(chat.messages) && chat.messages.length === 0
    );

    if (emptyChats.length === 0) {
      toast({
        title: "No empty chats",
        description: "You don't have any empty chats to clean up",
      });
      return;
    }

    try {
      // Delete all empty chats
      await Promise.all(emptyChats.map(chat => deleteChat(chat.id)));
      
      // Update total count
      setTotalCount(prev => Math.max(0, prev - emptyChats.length));
      
      toast({
        title: "Cleaned up empty chats",
        description: `Deleted ${emptyChats.length} empty chat${emptyChats.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('Error cleaning empty chats:', error);
      toast({
        title: "Error",
        description: "Failed to clean up empty chats",
        variant: "destructive",
      });
    }
  };

  // Compute if "New Chat" button should be disabled
  // Disable ONLY if: not authenticated, creating chat, OR user is already ON an empty chat
  // that is OUTSIDE any project. Empty chats inside a project should NOT disable the
  // sidebar's New Chat button — clicking it spawns a fresh chat outside the project.
  const currentChatIsEmpty = savedChats.some(chat =>
    chat.id === chatId &&
    Array.isArray(chat.messages) && chat.messages.length === 0 &&
    !chat.folder_id
  );
  const isNewChatDisabled = !isAuthenticated || isCreatingChat || currentChatIsEmpty;
  
  // Always render the sidebar, but with different content based on auth status
  return (
    <SourceComparisonProvider>
      <ChatGPTSidebar
        chats={isAuthenticated ? formattedChats : []}
        currentChatId={displayedCurrentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onTogglePin={handleTogglePin}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        isLoadingMore={isLoadingMore}
        isAuthenticated={isAuthenticated}
        isNewChatDisabled={isNewChatDisabled}
        onCleanEmptyChats={handleCleanEmptyChats}
        isLoadingChats={!initialized}
      />
    </SourceComparisonProvider>
  );
};

export default SavedChatsSidebar;