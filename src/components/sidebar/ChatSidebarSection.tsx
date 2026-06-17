
import React, { useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatSidebarItem from './ChatSidebarItem';

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
  // Enhanced search result properties
  matchScore?: number;
  matchReasons?: string[];
  searchMetadata?: any;
}

interface ChatSidebarSectionProps {
  title: string;
  chats: Chat[];
  currentChatId: string | null;
  editingChatId: string | null;
  editedTitle: string;
  openMenuId: string | null;
  onSelectChat: (chat: Chat) => void;
  onStartEditing: (chat: Chat) => void;
  onSaveTitle: (chatId: string) => void;
  onCancelEdit: () => void;
  onEditTitleChange: (title: string) => void;
  onToggleMenu: (chatId: string, e: React.MouseEvent) => void;
  onTogglePin: (chatId: string, pinned: boolean) => void;
  onDeleteChat: (chatId: string) => void;
  searchTerm?: string;
  isAuthenticated: boolean;
  icon?: string;
  emptyMessage?: string;
  activeChatRef?: React.RefObject<HTMLDivElement>;
}

const ChatSidebarSection: React.FC<ChatSidebarSectionProps> = ({
  title,
  chats,
  currentChatId,
  editingChatId,
  editedTitle,
  openMenuId,
  onSelectChat,
  onStartEditing,
  onSaveTitle,
  onCancelEdit,
  onEditTitleChange,
  onToggleMenu,
  onTogglePin,
  onDeleteChat,
  searchTerm = '',
  isAuthenticated,
  icon = "",
  emptyMessage,
  activeChatRef
}) => {
  if (!isAuthenticated) return null;

  return (
    <div>
      <div
        className="px-2 py-1.5 text-[11px] text-[var(--chat-muted)] uppercase tracking-widest font-heading font-medium"
        data-tour={title === 'Pinned' ? 'pinned-chats' : undefined}
      >
        {title}
      </div>
      {chats.length === 0 && emptyMessage ? (
        <p className="text-xs text-[var(--chat-muted)] px-2 italic mb-4">{emptyMessage}</p>
      ) : (
        <div className="space-y-0.5">
          {chats.map((chat) => (
            <ChatSidebarItem
              key={chat.id}
              chat={chat}
              isCurrentChat={chat.id === currentChatId}
              isEditing={editingChatId === chat.id}
              editedTitle={editedTitle}
              openMenuId={openMenuId}
              searchTerm={searchTerm}
              onSelect={onSelectChat}
              onEdit={onStartEditing}
              onSaveEdit={onSaveTitle}
              onCancelEdit={onCancelEdit}
              onEditTitleChange={onEditTitleChange}
              onToggleMenu={onToggleMenu}
              onTogglePin={onTogglePin}
              onDelete={onDeleteChat}
              isAuthenticated={isAuthenticated}
              innerRef={chat.id === currentChatId ? activeChatRef : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatSidebarSection;
