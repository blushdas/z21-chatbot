import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Eye, Search, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useBrand } from '@/context/BrandContext';
import ChatSidebarHeader from './sidebar/ChatSidebarHeader';
import ChatSidebarSection from './sidebar/ChatSidebarSection';
import ChatSidebarFooter from './sidebar/ChatSidebarFooter';
import FolderManager from './folders/FolderManager';
import ChatSearchModal from './ChatSearchModal';
// Canvases are chat-native; no global sidebar list.

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

interface ChatGPTSidebarProps {
  chats: Chat[];
  currentChatId: string | null;
  onNewChat: () => void;
  onSelectChat: (chat: Chat) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  onDeleteChat: (chatId: string) => void;
  onTogglePin: (chatId: string, pinned: boolean) => void;
  onLoadMore?: () => void; // Add load more functionality
  hasMore?: boolean; // Indicate if there are more chats to load
  isLoadingMore?: boolean; // Loading state for pagination
  isAuthenticated: boolean;
  isNewChatDisabled?: boolean;
  onCleanEmptyChats?: () => void; // Add cleanup function
  isLoadingChats?: boolean;
}

const ChatGPTSidebar: React.FC<ChatGPTSidebarProps> = ({ 
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onRenameChat,
  onDeleteChat,
  onTogglePin,
  onLoadMore,
  hasMore = false,
  isLoadingMore = false,
  isAuthenticated,
  isNewChatDisabled = false,
  onCleanEmptyChats,
  isLoadingChats = false,
}) => {
  const { user } = useAuth();
  const { brandText } = useBrand();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showScrollToActive, setShowScrollToActive] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const activeChatRef = useRef<HTMLDivElement | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);


  // Manual scroll to active chat - triggered by "Find Active" button only
  // Auto-scroll removed to prevent jarring zoom effect when selecting chats

  // Use all chats when not searching via modal
  const filteredChats = useMemo(() => {
    if (!isAuthenticated) return [];
    return chats;
  }, [chats, isAuthenticated]);

  // Check if active chat is visible to show/hide scroll button
  useEffect(() => {
    if (!currentChatId || !activeChatRef.current || !scrollAreaRef.current) {
      setShowScrollToActive(false);
      return;
    }

    const checkVisibility = () => {
      if (!activeChatRef.current || !scrollAreaRef.current) return;
      
      const activeChatRect = activeChatRef.current.getBoundingClientRect();
      const scrollAreaRect = scrollAreaRef.current.getBoundingClientRect();
      
      const isVisible = activeChatRect.top >= scrollAreaRect.top && 
                       activeChatRect.bottom <= scrollAreaRect.bottom;
      
      setShowScrollToActive(!isVisible && !!currentChatId);
    };

    checkVisibility();
    
    const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', checkVisibility);
      return () => scrollContainer.removeEventListener('scroll', checkVisibility);
    }
  }, [currentChatId, filteredChats.length]);

  // Handle keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToActiveChat = () => {
    if (activeChatRef.current) {
      activeChatRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  };

  // Separate pinned and unpinned chats (only those not in folders)
  const chatsNotInFolders = useMemo(() => 
    filteredChats.filter(chat => !chat.folder_id), 
    [filteredChats]
  );
  
  const pinnedChats = useMemo(() => 
    chatsNotInFolders.filter(chat => chat.pinned), 
    [chatsNotInFolders]
  );
  
  const unpinnedChats = useMemo(() => 
    chatsNotInFolders.filter(chat => !chat.pinned), 
    [chatsNotInFolders]
  );

  const startEditing = (chat: Chat) => {
    if (!isAuthenticated) return;
    setEditingChatId(chat.id);
    setEditedTitle(chat.title);
    setOpenMenuId(null);
  };

  const saveTitle = (chatId: string) => {
    if (!isAuthenticated) return;
    if (editedTitle.trim() && editedTitle.trim() !== '') {
      onRenameChat(chatId, editedTitle.trim());
    }
    setEditingChatId(null);
    setEditedTitle('');
  };

  const cancelEdit = () => {
    setEditingChatId(null);
    setEditedTitle('');
  };

  const handleDeleteChat = (chatId: string) => {
    if (!isAuthenticated) return;
    onDeleteChat(chatId);
    setOpenMenuId(null);
  };

  const toggleMenu = (chatId: string, e: React.MouseEvent) => {
    if (!isAuthenticated) return;
    e.stopPropagation();
    setOpenMenuId(openMenuId === chatId ? null : chatId);
  };


  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);


  return (
    <div className="w-[288px] h-full bg-[var(--chat-sidebar)] text-[var(--chat-text)] shadow-lg flex flex-col border-r border-[var(--chat-border)] relative z-50">
      <ChatSidebarHeader 
        isAuthenticated={isAuthenticated}
        onNewChat={onNewChat}
        isNewChatDisabled={isNewChatDisabled}
      />

      {/* Search Button */}
      {isAuthenticated && (
        <div className="px-4 pb-3">
          <button
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--chat-bg)] border border-[var(--chat-border)] text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:border-[var(--chat-border)] transition-colors text-sm"
            onClick={() => setIsSearchModalOpen(true)}
          >
            <Search size={14} />
            <span className="flex-1 text-left">Search chats...</span>
          </button>
        </div>
      )}

      {/* Unified Chat List */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {/* Scroll to Active Chat Button */}
        {showScrollToActive && currentChatId && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="secondary"
              size="sm"
              className="bg-brand-yellow/90 text-brand-blue hover:bg-brand-yellow shadow-lg"
              onClick={scrollToActiveChat}
            >
              <Eye size={14} className="mr-1" />
              Find Active
            </Button>
          </div>
        )}
        
        {!isAuthenticated ? (
          <div className="p-4 text-center text-[var(--chat-muted)] text-sm font-body">
            <p className="mb-2">{brandText('Welcome to Daryle AI!')}</p>
            <p className="text-xs">You can chat as a guest, but your conversations won't be saved.</p>
          </div>
        ) : isLoadingChats && filteredChats.length === 0 ? (
          <div className="p-6 flex flex-col items-center justify-center gap-2 text-[var(--chat-muted)]">
            <Loader2 className="h-4 w-4 animate-spin text-brand-yellow" />
            <span className="text-xs">Loading chats…</span>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-4 text-center text-[var(--chat-muted)] text-sm font-body">
            No saved chats yet
          </div>
        ) : (
          <ScrollArea className="h-full scrollbar-force-visible" ref={scrollAreaRef} type="always">
            <div className="p-2 space-y-4">
              {/* Folders Section */}
              <FolderManager
                chats={filteredChats}
                currentChatId={currentChatId}
                onSelectChat={onSelectChat}
                editingChatId={editingChatId}
                editedTitle={editedTitle}
                openMenuId={openMenuId}
                onStartEditing={startEditing}
                onSaveTitle={saveTitle}
                onCancelEdit={cancelEdit}
                onEditTitleChange={setEditedTitle}
                onToggleMenu={toggleMenu}
                onTogglePin={onTogglePin}
                onDeleteChat={handleDeleteChat}
                isAuthenticated={isAuthenticated}
                activeChatRef={activeChatRef}
              />

              {/* Pinned Chats Section */}
              {pinnedChats.length > 0 && (
                <ChatSidebarSection
                  title="Pinned"
                  icon=""
                  chats={pinnedChats}
                  currentChatId={currentChatId}
                  editingChatId={editingChatId}
                  editedTitle={editedTitle}
                  openMenuId={openMenuId}
                  onSelectChat={onSelectChat}
                  onStartEditing={startEditing}
                  onSaveTitle={saveTitle}
                  onCancelEdit={cancelEdit}
                  onEditTitleChange={setEditedTitle}
                  onToggleMenu={toggleMenu}
                  onTogglePin={onTogglePin}
                  onDeleteChat={handleDeleteChat}
                  searchTerm=""
                  isAuthenticated={isAuthenticated}
                  activeChatRef={activeChatRef}
                />
              )}

              {/* Unpinned Chats Section */}
              {unpinnedChats.length > 0 && (
                <ChatSidebarSection
                  title="Recent"
                  icon=""
                  chats={unpinnedChats}
                  currentChatId={currentChatId}
                  editingChatId={editingChatId}
                  editedTitle={editedTitle}
                  openMenuId={openMenuId}
                  onSelectChat={onSelectChat}
                  onStartEditing={startEditing}
                  onSaveTitle={saveTitle}
                  onCancelEdit={cancelEdit}
                  onEditTitleChange={setEditedTitle}
                  onToggleMenu={toggleMenu}
                  onTogglePin={onTogglePin}
                  onDeleteChat={handleDeleteChat}
                  searchTerm=""
                  isAuthenticated={isAuthenticated}
                  activeChatRef={activeChatRef}
                />
              )}
              
              {/* Load More Button */}
              {hasMore && onLoadMore && (
                <div className="px-2 pb-2">
                  <Button
                    onClick={onLoadMore}
                    disabled={isLoadingMore}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs bg-transparent border-[var(--chat-border)] text-[var(--chat-text)] hover:bg-[var(--chat-card)]"
                  >
                    {isLoadingMore ? 'Loading...' : `Load More Chats`}
                  </Button>
                </div>
              )}

              {/* Clean Empty Chats Button */}
              {isAuthenticated && onCleanEmptyChats && chats.some(c => c.messages.length === 0) && (
                <div className="px-2 pb-4">
                  <Button
                    onClick={onCleanEmptyChats}
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-brand-yellow/10"
                  >
                    🧹 Clean Empty Chats
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Sidebar Footer - Navigation Items */}
      {isAuthenticated && <ChatSidebarFooter />}

      {/* Search Modal */}
      <ChatSearchModal
        open={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={onSelectChat}
      />
    </div>
  );
};

export default ChatGPTSidebar;