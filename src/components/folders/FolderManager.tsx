import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Check, ChevronDown, ChevronRight, Edit, FolderIcon, Grid3x3, LayoutDashboard, MoreHorizontal, Palette, Plus, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Folder, useFolderOperations } from '@/hooks/supabase/useFolderOperations';
import { useFolders } from '@/context/FolderContext';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useChatManagementContext } from '@/context/ChatManagementContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ChatSidebarItem from '../sidebar/ChatSidebarItem';

// ChatGPT-style folder color palette. `null` = default (no color).
const FOLDER_COLORS: Array<{ value: string | null; label: string; swatch: string }> = [
  { value: null,      label: 'Default', swatch: 'transparent' },
  { value: '#ef4444', label: 'Red',     swatch: '#ef4444' },
  { value: '#f97316', label: 'Orange',  swatch: '#f97316' },
  { value: '#eab308', label: 'Yellow',  swatch: '#eab308' },
  { value: '#22c55e', label: 'Green',   swatch: '#22c55e' },
  { value: '#3b82f6', label: 'Blue',    swatch: '#3b82f6' },
  { value: '#a855f7', label: 'Purple',  swatch: '#a855f7' },
  { value: '#ec4899', label: 'Pink',    swatch: '#ec4899' },
];

type Chat = {
  id: string;
  title: string;
  messages: unknown[];
  createdAt: number;
  updatedAt: number;
  isDraft: boolean;
  mode: string;
  pinned: boolean;
  isTypingTitle?: boolean;
  folder_id?: string | null;
};

type FolderManagerProps = {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chat: Chat) => void;
  editingChatId: string | null;
  editedTitle: string;
  openMenuId: string | null;
  onStartEditing: (chat: Chat) => void;
  onSaveTitle: (chatId: string) => void;
  onCancelEdit: () => void;
  onEditTitleChange: (title: string) => void;
  onToggleMenu: (chatId: string, e: React.MouseEvent) => void;
  onTogglePin: (chatId: string, pinned: boolean) => void;
  onDeleteChat: (chatId: string) => void;
  isAuthenticated: boolean;
  activeChatRef?: React.RefObject<HTMLDivElement>;
};

const FolderManager: React.FC<FolderManagerProps> = ({
  chats,
  currentChatId,
  onSelectChat,
  editingChatId,
  editedTitle,
  openMenuId,
  onStartEditing,
  onSaveTitle,
  onCancelEdit,
  onEditTitleChange,
  onToggleMenu,
  onTogglePin,
  onDeleteChat,
  isAuthenticated,
  activeChatRef,
}) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { createNewChat } = useChatManagementContext();
  const [openingFolderId, setOpeningFolderId] = useState<string | null>(null);
  const { createFolder, updateFolderTitle, deleteFolder, updateFolderColor } = useFolderOperations();
  const {
    folders,
    toggleFolderExpanded,
    isFolderExpanded,
    addFolder,
    updateFolder,
    removeFolder,
    loadFolders,
  } = useFolders();

  const [newFolderName, setNewFolderName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const chatsInFolders = folders.reduce((acc, folder) => {
    acc[folder.id] = chats.filter(chat => chat.folder_id === folder.id);
    return acc;
  }, {} as Record<string, Chat[]>);

  const pinnedFolders = folders.filter(folder => folder.is_pinned);
  const regularFolders = folders.filter(folder => !folder.is_pinned);

  const openFolderAsNewChat = async (folder: Folder) => {
    if (openingFolderId) return;
    const existing = chatsInFolders[folder.id] || [];
    // Reuse an existing empty "New Chat" in this folder instead of creating
    // duplicates every time the folder title is clicked.
    const reusable = existing.find(
      (c) => !c.title || c.title.trim() === '' || c.title.trim().toLowerCase() === 'new chat'
    );
    if (reusable) {
      navigate(`/chat/${reusable.id}`);
      return;
    }
    setOpeningFolderId(folder.id);
    try {
      const newId = await createNewChat('coach', { folderId: folder.id });
      navigate(`/chat/${newId}`);
    } catch (e) {
      console.error('openFolderAsNewChat error', e);
      // Fallback: open the project dashboard if chat creation fails.
      navigate(`/folder/${folder.id}`);
    } finally {
      setOpeningFolderId(null);
    }
  };

  const handleCreateFolder = async () => {
    const title = newFolderName.trim();
    if (!title || !user?.id) return;

    const tempFolder: Folder = {
      id: `temp-${Date.now()}`,
      title,
      user_id: user.id,
      is_pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    addFolder(tempFolder);
    setNewFolderName('');
    setIsCreateDialogOpen(false);

    const folder = await createFolder(title);
    removeFolder(tempFolder.id);
    if (folder) addFolder(folder);
  };

  const handleStartEdit = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingTitle(folder.title);
  };

  const handleSaveEdit = async () => {
    if (!editingFolderId || !editingTitle.trim()) return;
    const nextTitle = editingTitle.trim();
    updateFolder(editingFolderId, { title: nextTitle });
    setEditingFolderId(null);
    setEditingTitle('');
    await updateFolderTitle(editingFolderId, nextTitle);
  };

  const handleCancelEdit = () => {
    setEditingFolderId(null);
    setEditingTitle('');
  };

  const handleDeleteFolder = async (folderId: string) => {
    const folderToDelete = folders.find(f => f.id === folderId);
    if (folderToDelete) removeFolder(folderId);

    const success = await deleteFolder(folderId);
    if (!success && folderToDelete) addFolder(folderToDelete);
  };

  const handleSetColor = async (folder: Folder, color: string | null) => {
    const prev = folder.color ?? null;
    updateFolder(folder.id, { color });
    const ok = await updateFolderColor(folder.id, color);
    if (!ok) updateFolder(folder.id, { color: prev });
  };

  const handleTogglePinned = async (folder: Folder) => {
    if (!user?.id) return;
    const nextPinned = !folder.is_pinned;
    updateFolder(folder.id, { is_pinned: nextPinned });

    const { error } = await supabase
      .from('folders')
      .update({ is_pinned: nextPinned })
      .eq('id', folder.id)
      .eq('user_id', user.id);

    if (error) {
      updateFolder(folder.id, { is_pinned: folder.is_pinned });
      toast.error('Failed to update pinned folder');
      return;
    }

    await loadFolders();
  };

  const renderChatList = (folder: Folder) => {
    if (!isFolderExpanded(folder.id)) return null;
    const folderChats = chatsInFolders[folder.id] ?? [];

    return (
      <div className="ml-4 mt-1 space-y-1 border-l border-[var(--chat-border)] pl-2">
        {folderChats.map(chat => (
          <ChatSidebarItem
            key={chat.id}
            chat={chat}
            isCurrentChat={chat.id === currentChatId}
            isEditing={editingChatId === chat.id}
            editedTitle={editedTitle}
            openMenuId={openMenuId}
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
        {folderChats.length === 0 && (
          <div className="px-3 py-2 text-xs text-[var(--chat-muted)]">
            No chats in this project
          </div>
        )}
      </div>
    );
  };

  const renderFolderRow = (folder: Folder) => {
    const expanded = isFolderExpanded(folder.id);
    const chatCount = chatsInFolders[folder.id]?.length ?? 0;
    const currentChat = currentChatId ? chats.find(c => c.id === currentChatId) : null;
    const isActive =
      location.pathname === `/folder/${folder.id}` ||
      (currentChat?.folder_id === folder.id);

    return (
      <div key={folder.id} className="space-y-1">
        <div
          className={`group relative flex items-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${
            isActive
              ? 'bg-brand-yellow/15 text-[var(--chat-text)] ring-1 ring-brand-yellow/40 shadow-sm'
              : 'text-[var(--chat-text)] hover:bg-[var(--chat-card)]'
          }`}
        >
          {isActive && (
            <span
              aria-hidden
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-yellow"
            />
          )}
          <button
            type="button"
            onClick={() => toggleFolderExpanded(folder.id)}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-[var(--ui-icon)] hover:bg-[var(--ui-bg-hover)] hover:text-[var(--ui-icon-hover)]"
            aria-label={expanded ? `Collapse ${folder.title}` : `Expand ${folder.title}`}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => openFolderAsNewChat(folder)}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md hover:bg-[var(--ui-bg-hover)]"
            aria-label={`Open ${folder.title}`}
            disabled={openingFolderId === folder.id}
          >
            <FolderIcon
              className={`h-4 w-4 ${
                folder.color ? '' : isActive ? 'text-brand-yellow' : 'text-[var(--ui-icon)]'
              }`}
              style={folder.color ? { color: folder.color, fill: folder.color } : undefined}
            />
          </button>

          {editingFolderId === folder.id ? (
            <Input
              value={editingTitle}
              onChange={e => setEditingTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveEdit();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              onBlur={handleSaveEdit}
              className="h-7 min-w-0 flex-1 border-brand-yellow/40 bg-[var(--chat-input-bg)] px-2 text-sm text-[var(--chat-text)]"
              aria-label="Folder title"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => openFolderAsNewChat(folder)}
              onDoubleClick={e => { e.stopPropagation(); e.preventDefault(); handleStartEdit(folder); }}
              className="min-w-0 flex-1 truncate text-left text-sm font-medium hover:text-[var(--chat-text)] disabled:opacity-60"
              title={`New chat in ${folder.title}`}
              disabled={openingFolderId === folder.id}
            >
              {folder.title}
            </button>
          )}

          <span className="rounded-full px-1.5 text-[11px] text-[var(--chat-muted)]">{chatCount}</span>

          <Button
            variant="ghost"
            size="icon"
            className={`h-6 w-6 flex-shrink-0 rounded-md transition-opacity ${folder.is_pinned || isActive ? 'opacity-100 text-brand-yellow' : 'opacity-0 text-[var(--chat-muted)] group-hover:opacity-100'} hover:bg-[var(--ui-bg-hover)] hover:text-brand-yellow`}
            onClick={() => handleTogglePinned(folder)}
            aria-label={folder.is_pinned ? `Unpin ${folder.title}` : `Pin ${folder.title}`}
          >
            <Star className="h-3.5 w-3.5" fill={folder.is_pinned ? 'currentColor' : 'none'} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 rounded-md text-[var(--chat-muted)] opacity-0 transition-opacity hover:bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)] group-hover:opacity-100"
                aria-label={`Open menu for ${folder.title}`}
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[var(--chat-border)] bg-[var(--chat-card)] text-[var(--chat-text)]">
              <DropdownMenuItem asChild>
                <Link to={`/folder/${folder.id}`} className="flex items-center">
                  <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                  Open project
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTogglePinned(folder)}>
                <Star className="mr-2 h-3.5 w-3.5" fill={folder.is_pinned ? 'currentColor' : 'none'} />
                {folder.is_pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStartEdit(folder)}>
                <Edit className="mr-2 h-3.5 w-3.5" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-[var(--chat-text)]">
                  <Palette className="mr-2 h-3.5 w-3.5" />
                  Color
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="min-w-0 border-[var(--chat-border)] bg-[var(--chat-card)] p-2">
                    <div className="grid grid-cols-4 gap-1.5">
                      {FOLDER_COLORS.map(c => {
                        const selected = (folder.color ?? null) === c.value;
                        return (
                          <button
                            key={c.label}
                            type="button"
                            onClick={() => handleSetColor(folder, c.value)}
                            title={c.label}
                            aria-label={`Set color: ${c.label}`}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border transition-transform hover:scale-110 ${
                              selected ? 'border-white ring-2 ring-white/80' : 'border-transparent'
                            } ${c.value === null ? 'bg-[var(--chat-input-bg)]' : ''}`}
                            style={c.value ? { backgroundColor: c.swatch } : undefined}
                          >
                            {selected && c.value === null && (
                              <Check className="h-3.5 w-3.5 text-[var(--chat-text)]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-red-500 focus:text-red-500">
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-[var(--chat-border)] bg-[var(--chat-card)] text-[var(--chat-text)]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete project?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[var(--chat-muted)]">
                      Chats in {folder.title} will move back to All Chats.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteFolder(folder.id)} className="bg-red-500 text-white hover:bg-red-600">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {renderChatList(folder)}
      </div>
    );
  };

  if (!user?.id) return null;

  return (
    <div className="space-y-3" data-tour="projects">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--chat-muted)]">
            Projects
          </span>
          <Link
            to="/projects"
            className={`text-[11px] font-medium transition-colors ${
              location.pathname === '/projects'
                ? 'text-brand-blue'
                : 'text-[var(--chat-muted)] hover:text-[var(--chat-text)]'
            }`}
          >
            View all
          </Link>
        </div>
        <span className="text-[11px] text-[var(--chat-muted)]">{folders.length}</span>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center gap-2 rounded-lg px-3 text-left text-sm text-[var(--chat-muted)] transition-colors hover:bg-[var(--chat-card)] hover:text-[var(--chat-text)]"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
        </DialogTrigger>
        <DialogContent className="border-[var(--chat-border)] bg-[var(--chat-card)] text-[var(--chat-text)]">
          <DialogHeader>
            <DialogTitle>Create project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <Input
              aria-label="Project name"
              placeholder="Project name"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); }}
              className="bg-[var(--chat-input-bg)] text-[var(--chat-text)]"
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90">
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {folders.length === 0 ? (
        <p className="px-3 py-2 text-xs text-[var(--chat-muted)]">No projects yet</p>
      ) : (
        <div className="space-y-3">
          {pinnedFolders.length > 0 && (
            <div className="space-y-1">
              <p className="px-2 text-[11px] font-medium text-[var(--chat-muted)]">Pinned</p>
              {pinnedFolders.map(renderFolderRow)}
            </div>
          )}
          {regularFolders.length > 0 && (
            <div className="space-y-1">
              {pinnedFolders.length > 0 && <p className="px-2 text-[11px] font-medium text-[var(--chat-muted)]">All projects</p>}
              {regularFolders.map(renderFolderRow)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FolderManager;
