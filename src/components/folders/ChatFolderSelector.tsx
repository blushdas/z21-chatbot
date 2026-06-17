import React from 'react';
import { FolderIcon, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useFolderOperations } from '@/hooks/supabase/useFolderOperations';
import { useFolders } from '@/context/FolderContext';
import { useChatManagementContext } from '@/context/ChatManagementContext';

interface ChatFolderSelectorProps {
  chatId: string;
  currentFolderId?: string | null;
  onFolderChange?: (folderId: string | null) => void;
  trigger?: React.ReactNode;
}

const ChatFolderSelector: React.FC<ChatFolderSelectorProps> = ({
  chatId,
  currentFolderId,
  onFolderChange,
  trigger
}) => {
  const { moveChatToFolder } = useFolderOperations();
  const { folders } = useFolders();
  const { loadChats } = useChatManagementContext();

  const handleMoveToFolder = async (folderId: string | null) => {
    // Move chat immediately - optimistic update will be handled by the operation
    try {
      await moveChatToFolder(chatId, folderId);
      // Success handling is done in the operation itself
    } catch (error) {
      console.error('Error in handleMoveToFolder:', error);
      // Error handling and revert is done in the operation itself
    }
  };

  const defaultTrigger = (
    <Button variant="ghost" size="sm" className="h-8 px-2">
      <FolderIcon className="h-3 w-3 mr-1" />
      Move to project
    </Button>
  );

  // If no trigger is provided, render the content directly (for nested menus)
  if (!trigger) {
    return (
      <div className="py-1">
        <div
          onClick={() => handleMoveToFolder(null)}
          className="flex items-center justify-between px-3 py-2 text-sm text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] cursor-pointer"
        >
          <span>All Chats</span>
          {!currentFolderId && <Check className="h-3 w-3" />}
        </div>

        {folders.length > 0 && <div className="border-t border-[var(--chat-border)] my-1" />}

        {folders.map((folder) => (
          <div
            key={folder.id}
            onClick={() => handleMoveToFolder(folder.id)}
            className="flex items-center justify-between px-3 py-2 text-sm text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] cursor-pointer"
          >
            <div className="flex items-center">
              <FolderIcon className="h-3 w-3 mr-2" />
              <span className="truncate">{folder.title}</span>
            </div>
            {currentFolderId === folder.id && <Check className="h-3 w-3" />}
          </div>
        ))}
        
        {folders.length === 0 && (
          <div className="px-3 py-2 text-sm text-[var(--chat-muted)] italic">
            No folders created yet
          </div>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger || defaultTrigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="right" className="w-56 bg-[var(--chat-card)] border border-[var(--chat-border)] text-[var(--chat-text)] shadow-lg z-[9999]">
        <DropdownMenuItem
          onClick={() => handleMoveToFolder(null)}
          className="flex items-center justify-between"
        >
          <span>All Chats</span>
          {!currentFolderId && <Check className="h-3 w-3" />}
        </DropdownMenuItem>
        
        {folders.length > 0 && <DropdownMenuSeparator />}
        
        {folders.map((folder) => (
          <DropdownMenuItem
            key={folder.id}
            onClick={() => handleMoveToFolder(folder.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center">
              <FolderIcon className="h-3 w-3 mr-2" />
              <span className="truncate">{folder.title}</span>
            </div>
            {currentFolderId === folder.id && <Check className="h-3 w-3" />}
          </DropdownMenuItem>
        ))}
        
        {folders.length === 0 && (
          <DropdownMenuItem disabled>
            No folders created yet
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatFolderSelector;