
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pin, MessageSquare, MoreVertical, FolderIcon, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cleanTitle } from '@/utils/titleUtils';
import { useFolderOperations } from '@/hooks/supabase/useFolderOperations';
import { useFolders } from '@/context/FolderContext';
import { format, isToday, isYesterday } from 'date-fns';

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
  shouldAnimateTitle?: boolean;
  folder_id?: string | null;
  isNew?: boolean; // Flag for fade-in animation
}

interface ChatSidebarItemProps {
  chat: Chat;
  isCurrentChat: boolean;
  isEditing: boolean;
  editedTitle: string;
  openMenuId: string | null;
  searchTerm?: string;
  onSelect: (chat: Chat) => void;
  onEdit: (chat: Chat) => void;
  onSaveEdit: (chatId: string) => void;
  onCancelEdit: () => void;
  onEditTitleChange: (title: string) => void;
  onToggleMenu: (chatId: string, e: React.MouseEvent) => void;
  onTogglePin: (chatId: string, pinned: boolean) => void;
  onDelete: (chatId: string) => void;
  isAuthenticated: boolean;
  innerRef?: React.RefObject<HTMLDivElement>;
}

const ChatSidebarItem: React.FC<ChatSidebarItemProps> = ({
  chat,
  isCurrentChat,
  isEditing,
  editedTitle,
  openMenuId,
  onSelect,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onEditTitleChange,
  onToggleMenu,
  onTogglePin,
  onDelete,
  
  isAuthenticated,
  innerRef
}) => {
  const [showFolderMenu, setShowFolderMenu] = useState(false);
  const folderMenuRef = useRef<HTMLDivElement>(null);
  const { moveChatToFolder } = useFolderOperations();
  const { folders } = useFolders();
  
  const prevTitleRef = useRef<string>(chat.title);
  const hasAnimatedRef = useRef<boolean>(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Trigger animation ONLY ONCE when transitioning from "New Chat" to RAG title
  useEffect(() => {
    const prevTitle = prevTitleRef.current;
    const currentTitle = chat.title;
    
    // Only animate if:
    // 1. We haven't animated yet for this chat
    // 2. Previous title was "New Chat" (or empty on first render)
    // 3. Current title is NOT "New Chat" and is valid
    if (
      !hasAnimatedRef.current &&
      (prevTitle === "New Chat" || prevTitle === "") &&
      currentTitle !== "New Chat" &&
      currentTitle.length > 0
    ) {
      console.log(`🎬 ONE-TIME title animation: "New Chat" → "${currentTitle}"`);
      setShouldAnimate(true);
      hasAnimatedRef.current = true;
      
      // Reset animation state after it completes
      const timer = setTimeout(() => setShouldAnimate(false), 600);
      return () => clearTimeout(timer);
    }
    
    prevTitleRef.current = currentTitle;
  }, [chat.title]);

  // Close folder menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (folderMenuRef.current && !folderMenuRef.current.contains(event.target as Node)) {
        setShowFolderMenu(false);
      }
    };

    if (showFolderMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFolderMenu]);

  const handleMoveToFolder = async (folderId: string | null) => {
    setShowFolderMenu(false);
    // Close the parent row dropdown too
    onToggleMenu(chat.id, { stopPropagation: () => {}, preventDefault: () => {} } as any);
    try {
      await moveChatToFolder(chat.id, folderId);
      // Real-time updates are handled automatically by the custom events
    } catch (error) {
      console.error('Error moving chat to folder:', error);
    }
  };
  const displayTitle = cleanTitle(chat.title) || 'New Chat';
  const showMenu = openMenuId === chat.id;

  // FIXED: Prevent automatic editing state for typing titles
  const shouldShowTypingEffect = chat.isTypingTitle && !isEditing;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSaveEdit(chat.id);
    } else if (e.key === 'Escape') {
      onCancelEdit();
    }
  };

  const formatChatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return format(date, 'MMM d');
  };

  const previewText = (() => {
    if (chat.messages.length === 0) return '';
    const last = chat.messages[chat.messages.length - 1];
    const raw = typeof last === 'string' ? last : (last?.content ?? '');
    if (typeof raw !== 'string') return '';
    // Strip common markdown so the one-line preview reads as plain text.
    const stripped = raw
      .replace(/```[\s\S]*?```/g, ' ')            // fenced code blocks
      .replace(/`([^`]+)`/g, '$1')                 // inline code
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')        // images
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')     // links → label
      .replace(/^\s{0,3}>+\s?/gm, '')              // blockquotes
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')          // headings
      .replace(/^\s*[-*+]\s+/gm, '')               // bullets
      .replace(/^\s*\d+\.\s+/gm, '')               // ordered lists
      .replace(/(\*\*|__)(.*?)\1/g, '$2')          // bold
      .replace(/(\*|_)(.*?)\1/g, '$2')             // italic
      .replace(/~~(.*?)~~/g, '$1')                 // strikethrough
      .replace(/\s+/g, ' ')                        // collapse whitespace
      .trim();
    return stripped.slice(0, 80);
  })();

  return (
    <div
      ref={isCurrentChat ? innerRef : undefined}
      className={`group px-3 py-2.5 cursor-pointer rounded-lg transition-all duration-200 ${
        isCurrentChat
          ? 'bg-brand-yellow/15 text-[var(--chat-text)]'
          : 'hover:bg-[var(--chat-card)] text-[var(--chat-text)]'
      } ${chat.isDraft ? 'opacity-50' : ''} ${chat.isNew ? 'animate-fade-in' : ''}`}
    >
      {/* Title row */}
      <div
        className="flex items-center gap-1.5 min-w-0"
        onClick={() => { if (!isEditing) onSelect(chat); }}
      >
        {chat.pinned
          ? <Pin size={11} className="flex-shrink-0 text-brand-yellow" />
          : <MessageSquare size={11} className="flex-shrink-0 text-[var(--chat-muted)]" />
        }

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editedTitle}
              onChange={(e) => onEditTitleChange(e.target.value)}
              onBlur={() => onSaveEdit(chat.id)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-brand-yellow/50 text-[var(--chat-text)] text-sm px-1 py-0 h-6 focus:border-brand-yellow"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : shouldShowTypingEffect ? (
            <span className="animate-pulse text-[var(--chat-muted)] tracking-wider text-xs">●●●</span>
          ) : (
            <span
              className={`text-sm font-medium truncate block ${
                shouldAnimate || chat.shouldAnimateTitle ? 'animate-fade-in' : ''
              }`}
              title={displayTitle}
            >
              {displayTitle}
            </span>
          )}
        </div>

        {!isEditing && !shouldShowTypingEffect && (
          <span className="flex-shrink-0 text-[11px] text-[var(--chat-muted)] ml-auto pl-1">
            {formatChatTimestamp(chat.updatedAt)}
          </span>
        )}

        {!isEditing && !shouldShowTypingEffect && isAuthenticated && (
          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 h-5 w-5 p-0 hover:bg-[var(--chat-card-2)] text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
              onClick={(e) => onToggleMenu(chat.id, e)}
            >
              <MoreVertical size={12} />
            </Button>

            {showMenu && (
              <div
                className="absolute right-0 top-6 w-48 bg-[var(--chat-card)] border border-[var(--chat-border)] rounded-lg shadow-xl z-20"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => onTogglePin(chat.id, !chat.pinned)}
                  className="block w-full px-3 py-2 text-sm text-[var(--chat-text)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-card-2)] text-left rounded-t-lg"
                >
                  {chat.pinned ? 'Unpin' : 'Pin to Top'}
                </button>
                <button
                  onClick={() => onEdit(chat)}
                  className="block w-full px-3 py-2 text-sm text-[var(--chat-text)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-card-2)] text-left"
                >
                  Rename
                </button>
                <div className="relative" ref={folderMenuRef}>
                  <button
                    onClick={() => setShowFolderMenu(!showFolderMenu)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm text-[var(--chat-text)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-card-2)] text-left"
                  >
                    <div className="flex items-center">
                      <FolderIcon className="mr-2 h-3 w-3" />
                      <span>Move to project</span>
                    </div>
                    <ChevronRight className="h-3 w-3" />
                  </button>

                  {showFolderMenu &&
                    createPortal(
                      <div className="fixed inset-0 z-[9999]" onClick={() => setShowFolderMenu(false)}>
                        <div
                          className="absolute w-56 bg-[var(--chat-card)] border border-[var(--chat-border)] rounded-lg shadow-xl"
                          style={{
                            left: `${(folderMenuRef.current?.getBoundingClientRect().right || 0) + 8}px`,
                            top: `${folderMenuRef.current?.getBoundingClientRect().top || 0}px`
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="py-1 max-h-64 overflow-y-auto">
                            <button
                              onClick={() => handleMoveToFolder(null)}
                              className="flex w-full items-center justify-between px-3 py-2 text-sm text-[var(--chat-text)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]"
                            >
                              <span>All Chats</span>
                              {!chat.folder_id && <Check className="h-3 w-3 text-brand-yellow" />}
                            </button>
                            {folders.length > 0 && <div className="border-t border-[var(--chat-border)] my-1" />}
                            {folders.map((folder) => (
                              <button
                                key={folder.id}
                                onClick={() => handleMoveToFolder(folder.id)}
                                className="flex w-full items-center justify-between px-3 py-2 text-sm text-[var(--chat-text)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]"
                              >
                                <div className="flex items-center">
                                  <FolderIcon className="h-3 w-3 mr-2" />
                                  <span className="truncate">{folder.title}</span>
                                </div>
                                {chat.folder_id === folder.id && <Check className="h-3 w-3 text-brand-yellow" />}
                              </button>
                            ))}
                            {folders.length === 0 && (
                              <div className="px-3 py-2 text-sm text-[var(--chat-muted)] italic">
                                No folders yet
                              </div>
                            )}
                          </div>
                        </div>
                      </div>,
                      document.body
                    )
                  }
                </div>
                <button
                  onClick={() => onDelete(chat.id)}
                  className="block w-full px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[var(--ui-bg-hover)] text-left rounded-b-lg"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview text */}
      {!isEditing && !shouldShowTypingEffect && previewText && (
        <p
          className="text-[12px] text-[var(--chat-muted)] truncate mt-0.5 pl-4 leading-tight"
          onClick={() => onSelect(chat)}
        >
          {previewText}
        </p>
      )}
    </div>
  );
};

export default ChatSidebarItem;
