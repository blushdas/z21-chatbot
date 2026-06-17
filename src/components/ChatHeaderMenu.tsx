import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, FolderIcon, Check, HelpCircle, MessageSquarePlus, BookMarked, Tag } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from '@/components/ui/dropdown-menu';
import { ChatExportButton } from '@/components/ChatExportButton';
import { useFolderOperations } from '@/hooks/supabase/useFolderOperations';
import { useFolders } from '@/context/FolderContext';
import { useChatManagementContext } from '@/context/ChatManagementContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import { MessageType, ResponseMode } from '@/components/ChatInterface';
import { Link } from 'react-router-dom';
import PromoteToKnowledgeDialog from '@/components/folders/PromoteToKnowledgeDialog';
import { useUserChatCategories } from '@/hooks/useUserChatCategories';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatHeaderMenuProps {
  chatId: string;
  chatTitle: string;
  currentFolderId?: string | null;
  chatCategory?: string | null;
  onRename: () => void;
  onDelete: () => void;
  onCategoryChange?: (category: string | null) => void;
  messages?: MessageType[];
  mode?: string;
  createdAt?: string;
  selectedMode?: string;
  selectedModel?: string;
}

const ChatHeaderMenu: React.FC<ChatHeaderMenuProps> = ({
  chatId,
  chatTitle,
  currentFolderId,
  chatCategory,
  onRename,
  onDelete,
  onCategoryChange,
  messages = [],
  mode = 'coach',
  createdAt,
  selectedMode,
  selectedModel
}) => {
  const { user, profile } = useAuth();
  const { moveChatToFolder } = useFolderOperations();
  const { folders } = useFolders();
  const { loadChats } = useChatManagementContext();
  const { categories: chatCategoriesList } = useUserChatCategories();
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [folderSubOpen, setFolderSubOpen] = useState(false);
  const [categorySubOpen, setCategorySubOpen] = useState(false);
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const lastBotMessage = [...messages].reverse().find(m => m.sender !== 'user');

  const closeAllMenus = () => {
    setFolderSubOpen(false);
    setCategorySubOpen(false);
    setMenuOpen(false);
  };

  const handleSetCategory = async (category: string | null) => {
    closeAllMenus();
    const { error } = await supabase.from('chats').update({ chat_category: category }).eq('id', chatId);
    if (error) { toast.error('Failed to set category'); return; }
    onCategoryChange?.(category);
  };

  const handleMoveToFolder = async (folderId: string | null) => {
    closeAllMenus();
    try {
      await moveChatToFolder(chatId, folderId);
      // Optimistic updates and error handling are handled in the operation
    } catch (error) {
      console.error('Error moving chat to folder:', error);
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${chatTitle}"?`)) {
      onDelete();
    }
  };

  if (!user?.id) return null;

  return (
    <>
    <div className="flex items-center gap-1 bg-[var(--chat-card)] border border-[var(--chat-border)] rounded-lg px-2 py-1.5">
      {/* Export Button - Standalone for easy access */}
      <ChatExportButton
        messages={messages}
        chatTitle={chatTitle}
        mode={mode}
        createdAt={createdAt || new Date().toISOString()}
        chatId={chatId}
        disabled={messages.length === 0}
        selectedMode={selectedMode}
        selectedModel={selectedModel}
        userName={profile?.name}
        userEmail={user?.email}
      />
      
      {/* More Options Menu */}
      <DropdownMenu open={menuOpen} onOpenChange={(o) => { setMenuOpen(o); if (!o) { setFolderSubOpen(false); setCategorySubOpen(false); } }}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-[var(--ui-icon)] hover:text-[var(--ui-icon-hover)] hover:bg-[var(--ui-bg-hover)]"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64 bg-[var(--chat-card)] border border-[var(--chat-border)] shadow-xl z-40 text-[var(--chat-text)]">
          <DropdownMenuItem onClick={onRename} className="text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] focus:bg-[var(--ui-bg-hover)]">
            <Edit className="mr-2 h-3 w-3" />
            Rename
          </DropdownMenuItem>
          
          <DropdownMenuSub open={folderSubOpen} onOpenChange={setFolderSubOpen}>
            <DropdownMenuSubTrigger
              onPointerDown={(e) => {
                if (e.pointerType !== 'mouse') {
                  e.preventDefault();
                  setFolderSubOpen((v) => !v);
                }
              }}
              onClick={(e) => e.preventDefault()}
            >
              <FolderIcon className="mr-2 h-3 w-3" />
              Move to project
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              {...(isMobile
                ? { side: 'bottom' as const, align: 'end' as const, sideOffset: 4, alignOffset: 0 }
                : {})}
              collisionPadding={8}
              className="w-56 max-w-[calc(100vw-2rem)] bg-[var(--chat-card)] border border-[var(--chat-border)] shadow-xl text-[var(--chat-text)]"
            >
              <DropdownMenuItem
                onClick={() => handleMoveToFolder(null)}
                className="flex items-center justify-between text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] focus:bg-[var(--ui-bg-hover)]"
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
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          {/* Set Category submenu hidden for now */}

          {currentFolderId && (
            <DropdownMenuItem
              onClick={() => setPromoteOpen(true)}
              className="text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] focus:bg-[var(--ui-bg-hover)]"
            >
              <BookMarked className="mr-2 h-3 w-3" />
              Promote to Project Knowledge Base
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem asChild>
            <Link to="/faq" className="flex items-center">
              <HelpCircle className="mr-2 h-3 w-3" />
              Help & FAQ
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem asChild>
            <Link to="/profile?tab=general-feedback" className="flex items-center">
              <MessageSquarePlus className="mr-2 h-3 w-3" />
              Provide General Feedback
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleDelete}
            className="text-red-400 hover:bg-[var(--ui-bg-hover)] focus:bg-[var(--ui-bg-hover)]"
          >
            <Trash2 className="mr-2 h-3 w-3" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    {currentFolderId && (
      <PromoteToKnowledgeDialog
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        folderId={currentFolderId}
        chatId={chatId}
        initialContent={lastBotMessage?.content ?? ''}
      />
    )}
    </>
  );
};

export default ChatHeaderMenu;