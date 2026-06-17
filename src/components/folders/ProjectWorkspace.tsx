import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  Clock,
  ChevronDown,
  ChevronRight,
  FileText,
  Pin,
  Layers,
  MessageSquare,
  Plus,
  Search,
  Settings as SettingsIcon,
  ExternalLink,
  Pencil,
  Check,
  X,
  FolderInput,
  PinOff,
  FolderMinus,
  Trash2,
  Activity,
  Share2,
  FolderLock,
  FolderUp,
  Link as LinkIcon,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ToastAction } from '@/components/ui/toast';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useFolderWorkspace } from '@/hooks/supabase/useFolderWorkspace';
import { useFolderInstructions } from '@/hooks/supabase/useFolderInstructions';
import { publishProjectChats } from '@/lib/projectChatsDebug';
import { useChatManagementContext } from '@/context/ChatManagementContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useFolderOperations } from '@/hooks/supabase/useFolderOperations';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import FolderDashboard from './FolderDashboard';
import ProjectMembersCard from './ProjectMembersCard';
import ProjectShareCard from './ProjectShareCard';
import FolderSources from './FolderSources';
import FolderMemory from './FolderMemory';
import FolderInstructions from './FolderInstructions';
import FolderQuickLinks from './FolderQuickLinks';
import ProjectDefaultsCard from './ProjectDefaultsCard';
import { Badge } from '@/components/ui/badge';

type Props = { folderId: string };

interface ProjectChatRow {
  id: string;
  title: string | null;
  updated_at: string;
  pinned: boolean | null;
  messages?: unknown[] | null;
}

function shortDate(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatActivity(e: { action: string; target_label: string | null; metadata: any }) {
  const label = e.target_label ? `“${e.target_label}”` : '';
  switch (e.action) {
    case 'chat_created': return `Created a new chat`;
    case 'chats_added': return `Added ${e.metadata?.count ?? ''} chat${e.metadata?.count === 1 ? '' : 's'} to the project`;
    case 'chat_removed': return `Removed ${label} from the project`;
    case 'chat_pinned': return `Pinned ${label}`;
    case 'chat_unpinned': return `Unpinned ${label}`;
    case 'title_renamed': return `Renamed project to ${label}`;
    case 'description_updated': return `Updated project description`;
    case 'defaults_updated': return `Updated default chat settings`;
    case 'member_added': return `Added member ${label}`;
    case 'member_removed': return `Removed member ${label}`;
    case 'member_role_changed': return `Changed member role: ${label}`;
    default: return `${e.action.replace(/_/g, ' ')} ${label}`.trim();
  }
}

const ComingSoonCard: React.FC<{
  icon: any;
  title: string;
  copy: string;
  bullets?: string[];
}> = ({ icon: Icon, title, copy, bullets }) => (
  <section className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-card)] p-10 text-center">
    <Badge variant="outline" className="border-brand-yellow/40 bg-brand-yellow/5 text-brand-yellow">
      Not available yet
    </Badge>
    <div className="rounded-full bg-[var(--chat-bg)] p-3">
      <Icon className="h-6 w-6 text-brand-yellow" />
    </div>
    <h3 className="font-heading text-xl font-semibold text-[var(--chat-text)]">{title}</h3>
    <p className="max-w-md text-sm text-[var(--chat-muted)]">{copy}</p>
    {bullets && bullets.length > 0 && (
      <ul className="mx-auto grid max-w-md gap-2 text-left text-sm text-[var(--chat-text)]">
        {bullets.map((b, i) => (
          <li
            key={i}
            className="flex items-start gap-2 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] px-3 py-2"
          >
            <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-yellow" />
            <span className="text-xs text-[var(--chat-muted)]">{b}</span>
          </li>
        ))}
      </ul>
    )}
    <p className="text-xs text-[var(--chat-muted)]">
      This feature is in development. You'll see it here as soon as it ships.
    </p>
  </section>
);

const ProjectWorkspace: React.FC<Props> = ({ folderId }) => {
  const navigate = useNavigate();
  const ws = useFolderWorkspace(folderId);
  const { instruction } = useFolderInstructions(folderId);
  const { createNewChat, deleteChat } = useChatManagementContext();
  const isMobile = useIsMobile();
  const { updateFolderTitle, moveChatToFolder } = useFolderOperations();
  const { user } = useAuth();
  const { toast } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const sectionParam = searchParams.get('section') || 'chats';
  const VALID_SECTIONS = ['chats','sources','memory','instructions','links','sharing','settings','skills','projectlinks'] as const;
  type Section = typeof VALID_SECTIONS[number];
  const section: Section = (VALID_SECTIONS as readonly string[]).includes(sectionParam) ? (sectionParam as Section) : 'chats';
  const setSection = (s: Section) => {
    const next = new URLSearchParams(searchParams);
    if (s === 'chats') next.delete('section'); else next.set('section', s);
    setSearchParams(next, { replace: true });
  };
  const [shareOpen, setShareOpen] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [allChats, setAllChats] = useState<ProjectChatRow[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [tab, setTab] = useState<'recent' | 'pinned'>('recent');
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [savingDesc, setSavingDesc] = useState(false);
  const [busyChatId, setBusyChatId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<
    | { kind: 'pin' | 'unpin' | 'remove' | 'delete'; chat: ProjectChatRow }
    | null
  >(null);
  const [activity, setActivity] = useState<Array<{
    id: string;
    action: string;
    target_label: string | null;
    metadata: any;
    created_at: string;
  }>>([]);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const [activityFilter, setActivityFilter] = useState<'all' | 'pins' | 'description' | 'chats'>('all');
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveSearch, setMoveSearch] = useState('');
  const [moveLoading, setMoveLoading] = useState(false);
  const [movingNow, setMovingNow] = useState(false);
  const [availableChats, setAvailableChats] = useState<ProjectChatRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  // Load full chat list for this project (workspace shows more than the 10-row preview).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setChatsLoading(true);
      let q = supabase
        .from('chats')
        .select('id, title, updated_at, pinned, messages, folder_id')
        .eq('folder_id', folderId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(200);
      if (user?.id) q = q.eq('user_id', user.id);
      const { data } = await q;
      if (cancelled) return;
      // Defensive client-side guard: only include rows that actually belong to this folder.
      const scoped = (data ?? []).filter((c: any) => c.folder_id === folderId) as ProjectChatRow[];
      setAllChats(scoped);
      setChatsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [folderId, user?.id, ws.recentChats.length, reloadKey]);

  // Load activity feed
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('folder_activity_events')
        .select('id, action, target_label, metadata, created_at')
        .eq('folder_id', folderId)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!cancelled) setActivity((data ?? []) as any);
    })();
    return () => { cancelled = true; };
  }, [folderId, reloadKey]);

  const logActivity = async (
    action: string,
    opts?: { target_type?: string; target_id?: string; target_label?: string | null; metadata?: any }
  ) => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('folder_activity_events')
      .insert({
        folder_id: folderId,
        user_id: user.id,
        action,
        target_type: opts?.target_type ?? null,
        target_id: opts?.target_id ?? null,
        target_label: opts?.target_label ?? null,
        metadata: opts?.metadata ?? {},
      })
      .select('id, action, target_label, metadata, created_at')
      .single();
    if (data) setActivity(prev => [data as any, ...prev].slice(0, 50));
  };

  // Load chats available to add (not already in this project) when dialog opens.
  useEffect(() => {
    if (!moveOpen || !user?.id) return;
    let cancelled = false;
    (async () => {
      setMoveLoading(true);
      const { data } = await supabase
        .from('chats')
        .select('id, title, updated_at, pinned, folder_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(300);
      if (cancelled) return;
      const rows = (data ?? []).filter((c: any) => c.folder_id !== folderId) as ProjectChatRow[];
      setAvailableChats(rows);
      setMoveLoading(false);
    })();
    return () => { cancelled = true; };
  }, [moveOpen, user?.id, folderId]);

  const filteredAvailable = useMemo(() => {
    const q = moveSearch.trim().toLowerCase();
    if (!q) return availableChats;
    return availableChats.filter(c => (c.title || 'Untitled Chat').toLowerCase().includes(q));
  }, [availableChats, moveSearch]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirmMove = async () => {
    if (selectedIds.size === 0 || movingNow) return;
    setMovingNow(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(ids.map(id => moveChatToFolder(id, folderId)));
      const ok = results.filter(Boolean).length;
      if (ok > 0) {
        toast({ title: 'Chats added', description: `${ok} chat${ok === 1 ? '' : 's'} added to this project.` });
        const movedTitles = availableChats
          .filter(c => selectedIds.has(c.id))
          .map(c => c.title || 'Untitled Chat');
        logActivity('chats_added', {
          target_type: 'chat',
          target_label: `${ok} chat${ok === 1 ? '' : 's'}`,
          metadata: { count: ok, titles: movedTitles.slice(0, 5) },
        });
      }
      setSelectedIds(new Set());
      setMoveOpen(false);
      setReloadKey(k => k + 1);
    } finally {
      setMovingNow(false);
    }
  };

  const beginEditTitle = () => {
    if (!ws.folder) return;
    setTitleDraft(ws.folder.title);
    setEditingTitle(true);
  };

  const saveTitle = async () => {
    if (!ws.folder) return;
    const next = titleDraft.trim();
    if (!next || next === ws.folder.title) {
      setEditingTitle(false);
      return;
    }
    setSavingTitle(true);
    const ok = await updateFolderTitle(folderId, next);
    setSavingTitle(false);
    if (ok) {
      logActivity('title_renamed', {
        target_type: 'folder',
        target_id: folderId,
        target_label: next,
        metadata: { from: ws.folder.title, to: next },
      });
      setEditingTitle(false);
    }
  };

  const beginEditDesc = () => {
    if (!ws.folder) return;
    setDescDraft(ws.folder.description ?? '');
    setEditingDesc(true);
  };

  const saveDesc = async () => {
    if (!ws.folder) return;
    const next = descDraft.trim();
    if (next === (ws.folder.description ?? '')) {
      setEditingDesc(false);
      return;
    }
    setSavingDesc(true);
    const { error } = await supabase
      .from('folders')
      .update({ description: next || null })
      .eq('id', folderId);
    setSavingDesc(false);
    if (error) {
      toast({ title: 'Could not update description', description: error.message, variant: 'destructive' });
      return;
    }
    setEditingDesc(false);
    logActivity('description_updated', {
      target_type: 'folder',
      target_id: folderId,
      target_label: next || '(cleared)',
    });
    setReloadKey(k => k + 1);
  };

  const setPin = async (chatId: string, pinned: boolean) => {
    const { error } = await supabase.from('chats').update({ pinned }).eq('id', chatId);
    return !error;
  };

  const performPin = async (chat: ProjectChatRow) => {
    const next = !chat.pinned;
    setBusyChatId(chat.id);
    const ok = await setPin(chat.id, next);
    setBusyChatId(null);
    if (!ok) {
      toast({ title: 'Could not update', variant: 'destructive' });
      return;
    }
    setAllChats(prev => prev.map(c => c.id === chat.id ? { ...c, pinned: next } : c));
    logActivity(next ? 'chat_pinned' : 'chat_unpinned', {
      target_type: 'chat',
      target_id: chat.id,
      target_label: chat.title || 'Untitled Chat',
    });
    toast({
      title: next ? 'Pinned' : 'Unpinned',
      description: chat.title || 'Untitled Chat',
      action: (
        <ToastAction
          altText="Undo"
          onClick={async () => {
            const reverted = await setPin(chat.id, !next);
            if (reverted) {
              setAllChats(prev => prev.map(c => c.id === chat.id ? { ...c, pinned: !next } : c));
              logActivity(!next ? 'chat_pinned' : 'chat_unpinned', {
                target_type: 'chat',
                target_id: chat.id,
                target_label: chat.title || 'Untitled Chat',
                metadata: { undo: true },
              });
            }
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  const performRemove = async (chat: ProjectChatRow) => {
    setBusyChatId(chat.id);
    const ok = await moveChatToFolder(chat.id, null);
    setBusyChatId(null);
    if (!ok) return;
    setAllChats(prev => prev.filter(c => c.id !== chat.id));
    logActivity('chat_removed', {
      target_type: 'chat',
      target_id: chat.id,
      target_label: chat.title || 'Untitled Chat',
    });
    toast({
      title: 'Removed from project',
      description: chat.title || 'Untitled Chat',
      action: (
        <ToastAction
          altText="Undo"
          onClick={async () => {
            const restored = await moveChatToFolder(chat.id, folderId);
            if (restored) {
              setAllChats(prev => [{ ...chat }, ...prev.filter(c => c.id !== chat.id)]);
              logActivity('chat_restored', {
                target_type: 'chat',
                target_id: chat.id,
                target_label: chat.title || 'Untitled Chat',
              });
            }
          }}
        >
          Undo
        </ToastAction>
      ),
    });
  };

  const togglePin = (chat: ProjectChatRow) => {
    setConfirm({ kind: chat.pinned ? 'unpin' : 'pin', chat });
  };

  const removeFromProject = (chat: ProjectChatRow) => {
    setConfirm({ kind: 'remove', chat });
  };

  const performDelete = async (chat: ProjectChatRow) => {
    setBusyChatId(chat.id);
    try {
      await deleteChat(chat.id);
      setAllChats(prev => prev.filter(c => c.id !== chat.id));
      logActivity('chat_removed', {
        target_type: 'chat',
        target_id: chat.id,
        target_label: chat.title || 'Untitled Chat',
      });
      toast({
        title: 'Chat deleted',
        description: chat.title || 'Untitled Chat',
      });
    } catch (e) {
      console.error('deleteChat failed', e);
      toast({ title: 'Could not delete chat', variant: 'destructive' as never });
    } finally {
      setBusyChatId(null);
    }
  };

  const deleteFromProject = (chat: ProjectChatRow) => {
    setConfirm({ kind: 'delete', chat });
  };

  const visibleChats = useMemo(() => {
    const isEmptyNewChat = (c: ProjectChatRow) => {
      const title = (c.title || '').trim().toLowerCase();
      const empty = !Array.isArray(c.messages) || c.messages.length === 0;
      return (title === '' || title === 'new chat') && empty;
    };
    return allChats.filter(c => !isEmptyNewChat(c));
  }, [allChats]);

  const filtered = useMemo(() => {
    const base = tab === 'pinned' ? visibleChats.filter(c => c.pinned) : visibleChats;
    const q = search.trim().toLowerCase();
    if (!q) return base;
    return base.filter(c => (c.title || 'Untitled Chat').toLowerCase().includes(q));
  }, [visibleChats, search, tab]);

  const pinnedCount = useMemo(() => visibleChats.filter(c => c.pinned).length, [visibleChats]);

  // Dev-only: publish the visible chat set for the consistency badge.
  useEffect(() => {
    publishProjectChats('workspace', folderId, visibleChats.map(c => c.id));
  }, [folderId, visibleChats]);
  const previewSources = ws.sources
    .filter(s => s.status === 'approved' || s.status === 'reviewed')
    .slice(0, 5);

  const handleNewChat = async () => {
    if (creating) return;
    const reusable = allChats.find(chat => {
      const title = chat.title?.trim().toLowerCase();
      return (!title || title === 'new chat') && Array.isArray(chat.messages) && chat.messages.length === 0;
    });

    if (reusable) {
      navigate(`/chat/${reusable.id}`);
      return;
    }

    setCreating(true);
    try {
      const { data: existingEmpty } = await supabase
        .from('chats')
        .select('id')
        .eq('folder_id', folderId)
        .eq('title', 'New Chat')
        .eq('messages', '[]')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingEmpty?.id) {
        navigate(`/chat/${existingEmpty.id}`);
        return;
      }

      const newId = await createNewChat('coach', { folderId });
      logActivity('chat_created', { target_type: 'chat', target_id: newId, target_label: 'New chat' });
      navigate(`/chat/${newId}`);
    } finally {
      setCreating(false);
    }
  };

  if (ws.isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--chat-bg)] text-sm text-[var(--chat-muted)]">
        Loading project…
      </div>
    );
  }

  if (!ws.folder) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 bg-[var(--chat-bg)] text-[var(--chat-text)]">
        <p className="text-sm text-[var(--chat-muted)]">Project not found.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}>
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to chats
        </Button>
      </div>
    );
  }

  const { folder } = ws;
  const sourceCount = ws.sources.length;
  const memoryCount = ws.memory.length;
  const hasInstructions = !!instruction?.content?.trim();
  const isOwner = !!user?.id && !!ws.folder && ws.folder.user_id === user.id;
  const memberCount = ws.members?.length ?? 0;
  const isSharedByMe = isOwner && memberCount > 0;
  const FolderHeadIcon = isOwner
    ? (isSharedByMe ? FolderUp : FolderLock)
    : FolderInput;
  const privacyLabel = isOwner ? (isSharedByMe ? 'Shared' : 'Private') : 'Shared with me';

  const SECTIONS: { key: typeof VALID_SECTIONS[number]; label: string; icon: any; soon?: boolean }[] = [
    { key: 'chats',        label: 'Overview',                icon: MessageSquare },
    { key: 'instructions', label: 'Instructions',            icon: FileText },
    { key: 'sources',      label: 'Project Knowledge Base',  icon: Layers },
    { key: 'memory',       label: 'Project Memory',          icon: Brain },
    { key: 'sharing',      label: 'Sharing',                 icon: Share2 },
    { key: 'links',        label: 'Quick Links',             icon: LinkIcon },
    { key: 'settings',     label: 'Settings',                icon: SettingsIcon },
  ];

  const COMING_SOON_ITEMS: { key: Section; label: string; icon: any }[] = [
    { key: 'skills',       label: 'Skills',         icon: Wand2 },
    { key: 'projectlinks', label: 'Project Links',  icon: Sparkles },
  ];
  const comingSoonActive = COMING_SOON_ITEMS.some(i => i.key === section);

  return (
    <div className="flex h-full flex-col bg-[var(--chat-bg)] font-body text-[var(--chat-text)]">
      {/* Header */}
      <div className="border-b border-[var(--chat-border)] bg-[var(--chat-header-bg)]">
        <div className="mx-auto max-w-5xl px-4 pt-3 sm:px-6 lg:px-10">
          <button
            type="button"
            onClick={() => {
              const latest = ws.recentChats?.[0];
              if (latest?.id) navigate(`/chat/${latest.id}`);
              else handleNewChat();
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)] transition-colors"
            title="Back to Project Chat"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Project Chat
          </button>
        </div>
        <div className="mx-auto flex max-w-5xl items-start gap-3 px-4 py-5 sm:px-6 lg:px-10">
          <FolderHeadIcon className="mt-1 h-6 w-6 flex-shrink-0 text-brand-yellow" />
          <div className="min-w-0 flex-1">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') saveTitle();
                    if (e.key === 'Escape') setEditingTitle(false);
                  }}
                  className="h-9 max-w-md font-heading text-xl font-bold text-[var(--chat-text)]"
                  disabled={savingTitle}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={saveTitle} disabled={savingTitle}>
                  <Check className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingTitle(false)} disabled={savingTitle}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={beginEditTitle}
                className="group flex items-center gap-2 text-left"
                title="Rename project"
              >
                <h1 className="truncate font-heading text-2xl font-bold leading-tight text-[var(--chat-text)]">
                  {folder.title}
                </h1>
                <Badge variant="outline" className="border-[var(--chat-border)] text-[10px] uppercase tracking-wide text-[var(--chat-muted)]">
                  {privacyLabel}
                </Badge>
                <Pencil className="h-3.5 w-3.5 flex-shrink-0 text-[var(--chat-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
              </button>
            )}
            {folder.description && (
              !editingDesc && (
                <button
                  type="button"
                  onClick={beginEditDesc}
                  className="group mt-1 flex w-full max-w-3xl items-start gap-2 text-left"
                  title="Edit description"
                >
                  <p className="line-clamp-2 flex-1 text-sm text-[var(--chat-muted)]">
                    {folder.description}
                  </p>
                  <Pencil className="mt-0.5 h-3 w-3 flex-shrink-0 text-[var(--chat-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              )
            )}
            {!folder.description && !editingDesc && (
              <button
                type="button"
                onClick={beginEditDesc}
                className="mt-1 text-xs italic text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
              >
                + Add a description
              </button>
            )}
            {editingDesc && (
              <div className="mt-2 max-w-3xl space-y-2">
                <Textarea
                  autoFocus
                  value={descDraft}
                  onChange={e => setDescDraft(e.target.value)}
                  placeholder="What is this project about?"
                  rows={2}
                  className="resize-none text-sm"
                  disabled={savingDesc}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveDesc} disabled={savingDesc} className="h-7">
                    {savingDesc ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingDesc(false)} disabled={savingDesc} className="h-7">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 h-9 w-9 text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)]"
            onClick={() => setShareOpen(true)}
            aria-label="Share project"
            title="Share project"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 h-9 w-9 text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)]"
            onClick={() => setSection('settings')}
            aria-label="Project settings"
            title="Project settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>
        </div>

        {/* Section nav */}
        <div className="mx-auto max-w-5xl px-2 sm:px-4 lg:px-8">
          <div className="flex gap-1 overflow-x-auto pb-2">
            {SECTIONS.map(s => {
              const Icon = s.icon;
              const active = section === s.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSection(s.key)}
                  className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-brand-blue text-brand-offwhite'
                      : 'text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)]'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {s.label}
                  {s.soon && (
                    <span className="rounded bg-[var(--chat-card)] px-1 text-[9px] uppercase tracking-wide text-[var(--chat-muted)]">Soon</span>
                  )}
                </button>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={
                    comingSoonActive
                      ? `Coming soon features — current: ${COMING_SOON_ITEMS.find(i => i.key === section)?.label}`
                      : `Coming soon features (${COMING_SOON_ITEMS.length} previews)`
                  }
                  className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--chat-header-bg)] ${
                    comingSoonActive
                      ? 'bg-brand-blue text-brand-offwhite'
                      : 'text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)]'
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Coming Soon</span>
                  <ChevronDown className="h-3 w-3" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="min-w-[200px]"
                aria-label="Coming soon feature previews"
              >
                {COMING_SOON_ITEMS.map(item => {
                  const Icon = item.icon;
                  const isCurrent = section === item.key;
                  return (
                    <DropdownMenuItem
                      key={item.key}
                      onSelect={() => setSection(item.key)}
                      aria-current={isCurrent ? 'page' : undefined}
                      className={`gap-2 text-xs ${isCurrent ? 'bg-[var(--ui-bg-hover)]' : ''}`}
                    >
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="flex-1">{item.label}</span>
                      <span className="rounded bg-[var(--chat-card)] px-1 text-[9px] uppercase tracking-wide text-[var(--chat-muted)]">
                        Soon
                      </span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-5 px-4 py-5 sm:px-6 lg:px-10">
          {section === 'chats' && (<>
          {/* Primary action */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button
              onClick={handleNewChat}
              disabled={creating}
              className="h-12 w-full justify-start gap-2 rounded-xl bg-brand-blue text-base font-medium text-brand-offwhite shadow-sm hover:bg-brand-blue/90 sm:w-auto sm:px-5"
            >
              <Plus className="h-4 w-4" />
              {creating ? 'Starting…' : 'New chat in this project'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setMoveOpen(true)}
              className="h-12 w-full justify-start gap-2 rounded-xl border-[var(--chat-border)] bg-[var(--chat-card)] text-sm font-medium text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] sm:w-auto sm:px-5"
            >
              <FolderInput className="h-4 w-4" />
              Add existing chats
            </Button>
          </div>

          {/* Context strip */}
          <div className="grid gap-3 sm:grid-cols-2">
            {/* Instructions card */}
            <div className="rounded-xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-3">
              <button
                type="button"
                onClick={() => setInstructionsExpanded(v => !v)}
                className="flex w-full items-center gap-2 text-left text-sm font-medium text-[var(--chat-text)]"
              >
                {instructionsExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                <FileText className="h-3.5 w-3.5 text-[var(--ui-icon)]" />
                Instructions
                <span className="ml-auto text-xs font-normal text-[var(--chat-muted)]">
                  {hasInstructions ? 'Active' : 'Not set'}
                </span>
              </button>
              {instructionsExpanded && (
                <div className="mt-2 border-t border-[var(--chat-border)] pt-2">
                  {hasInstructions ? (
                    <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--chat-muted)]">
                      {instruction!.content!.slice(0, 400)}
                      {instruction!.content!.length > 400 ? '…' : ''}
                    </p>
                  ) : (
                    <p className="text-xs text-[var(--chat-muted)]">No instructions yet.</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setSection('instructions')}
                    className="mt-2 text-xs font-medium text-brand-blue hover:underline dark:text-brand-yellow"
                  >
                    Edit instructions →
                  </button>
                </div>
              )}
            </div>

            {/* Sources card */}
            <div className="rounded-xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-3">
              <button
                type="button"
                onClick={() => setSourcesExpanded(v => !v)}
                className="flex w-full items-center gap-2 text-left text-sm font-medium text-[var(--chat-text)]"
              >
                {sourcesExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                <Layers className="h-3.5 w-3.5 text-[var(--ui-icon)]" />
                Project Knowledge Base
                <span className="ml-auto text-xs font-normal text-[var(--chat-muted)]">{sourceCount}</span>
              </button>
              {sourcesExpanded && (
                <div className="mt-2 border-t border-[var(--chat-border)] pt-2">
                  {previewSources.length === 0 ? (
                    <p className="text-xs text-[var(--chat-muted)]">No sources attached.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {previewSources.map(s => (
                        <li key={s.id} className="flex items-center gap-2 text-xs">
                          <Layers className="h-3 w-3 flex-shrink-0 text-[var(--ui-icon)]" />
                          <span className="min-w-0 flex-1 truncate text-[var(--chat-text)]">{s.title}</span>
                          {s.url && (
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="flex-shrink-0 text-[var(--chat-muted)] hover:text-brand-blue dark:hover:text-brand-yellow"
                              onClick={e => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => setSection('sources')}
                    className="mt-2 text-xs font-medium text-brand-blue hover:underline dark:text-brand-yellow"
                  >
                    Manage sources →
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Quick Links */}
          <section className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-4 shadow-sm shadow-black/5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-[var(--ui-icon)]" />
                <h2 className="font-heading text-lg font-semibold text-[var(--chat-text)]">Quick Links</h2>
                <span className="text-xs text-[var(--chat-muted)]">{ws.quickLinks.length}</span>
              </div>
              <button
                type="button"
                onClick={() => setSection('links')}
                className="text-xs font-medium text-brand-blue hover:underline dark:text-brand-yellow"
              >
                Manage →
              </button>
            </div>
            {ws.quickLinks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-bg)] px-4 py-6 text-center text-sm text-[var(--chat-muted)]">
                No quick links yet. Add bookmarks, dashboards, or task boards relevant to this project.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {ws.quickLinks.slice(0, 6).map(link => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex items-center gap-3 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg)] px-3 py-2 transition-colors hover:border-brand-yellow/30 hover:bg-[var(--ui-bg-hover)]"
                    >
                      <LinkIcon className="h-4 w-4 flex-shrink-0 text-[var(--ui-icon)]" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--chat-text)]">
                        {link.title}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-[var(--chat-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Chats */}
          <section className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-4 shadow-sm shadow-black/5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[var(--ui-icon)]" />
                <h2 className="font-heading text-lg font-semibold text-[var(--chat-text)]">Chats</h2>
                <span className="text-xs text-[var(--chat-muted)]">{visibleChats.length}</span>
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-bg)] p-0.5">
                <button
                  type="button"
                  onClick={() => setTab('recent')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    tab === 'recent'
                      ? 'bg-brand-blue text-brand-offwhite'
                      : 'text-[var(--chat-muted)] hover:text-[var(--chat-text)]'
                  }`}
                >
                  Recent
                </button>
                <button
                  type="button"
                  onClick={() => setTab('pinned')}
                  className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    tab === 'pinned'
                      ? 'bg-brand-blue text-brand-offwhite'
                      : 'text-[var(--chat-muted)] hover:text-[var(--chat-text)]'
                  }`}
                >
                  <Pin className="h-3 w-3" /> Pinned
                  <span className="opacity-70">({pinnedCount})</span>
                </button>
              </div>
            </div>

            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--chat-muted)]" />
              <Input
                placeholder="Search chats in this project…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-10 rounded-xl border-[var(--chat-border)] bg-[var(--chat-input-bg)] pl-9 text-[var(--chat-text)]"
              />
            </div>

            <div className="space-y-2">
              {chatsLoading && (
                <p className="rounded-xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-bg)] px-4 py-6 text-center text-sm text-[var(--chat-muted)]">
                  Loading chats…
                </p>
              )}
              {!chatsLoading && visibleChats.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-bg)] px-4 py-8 text-center text-sm text-[var(--chat-muted)]">
                  <p className="mb-3">No chats in this project yet.</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button size="sm" onClick={handleNewChat} disabled={creating}>
                      <Plus className="mr-1 h-3.5 w-3.5" /> Start the first chat
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setMoveOpen(true)}>
                      <FolderInput className="mr-1 h-3.5 w-3.5" /> Add existing chats
                    </Button>
                  </div>
                </div>
              )}
              {!chatsLoading && visibleChats.length > 0 && filtered.length === 0 && (
                <p className="rounded-xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-bg)] px-4 py-6 text-center text-sm text-[var(--chat-muted)]">
                  No chats match “{search}”.
                </p>
              )}
              {filtered.map(chat => (
                <div
                  key={chat.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/chat/${chat.id}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/chat/${chat.id}`); }}
                  className="group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg)] px-4 py-3 transition-colors hover:border-brand-yellow/30 hover:bg-[var(--ui-bg-hover)]"
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-[var(--ui-icon)]" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--chat-text)]">
                    {chat.title || 'Untitled Chat'}
                  </span>
                  {chat.pinned && (
                    <Pin className="h-3 w-3 flex-shrink-0 text-brand-yellow" />
                  )}
                  <span className="flex flex-shrink-0 items-center gap-1 text-xs text-[var(--chat-muted)]">
                    <Clock className="h-3.5 w-3.5" />
                    {shortDate(chat.updated_at) ?? 'Recent'}
                  </span>
                  <div className="flex flex-shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
                      onClick={(e) => { e.stopPropagation(); togglePin(chat); }}
                      disabled={busyChatId === chat.id}
                      title={chat.pinned ? 'Unpin' : 'Pin'}
                    >
                      {chat.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-[var(--chat-muted)] hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); removeFromProject(chat); }}
                      disabled={busyChatId === chat.id}
                      title="Remove from project"
                    >
                      <FolderMinus className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-[var(--chat-muted)] hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); deleteFromProject(chat); }}
                      disabled={busyChatId === chat.id}
                      title="Delete chat"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Activity feed */}
          <section className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-4 shadow-sm shadow-black/5">
            <button
              type="button"
              onClick={() => setActivityExpanded(v => !v)}
              className="flex w-full items-center gap-2 text-left"
            >
              {activityExpanded ? <ChevronDown className="h-4 w-4 text-[var(--ui-icon)]" /> : <ChevronRight className="h-4 w-4 text-[var(--ui-icon)]" />}
              <Activity className="h-4 w-4 text-[var(--ui-icon)]" />
              <h2 className="font-heading text-lg font-semibold text-[var(--chat-text)]">Activity</h2>
              <span className="ml-auto text-xs text-[var(--chat-muted)]">{activity.length} recent</span>
            </button>
            {activityExpanded && (
              <div className="mt-3 border-t border-[var(--chat-border)] pt-3">
                {(() => {
                  const FILTERS: { key: typeof activityFilter; label: string; actions: string[] | null }[] = [
                    { key: 'all', label: 'All', actions: null },
                    { key: 'pins', label: 'Pins', actions: ['chat_pinned', 'chat_unpinned'] },
                    { key: 'description', label: 'Description', actions: ['description_updated', 'title_renamed', 'defaults_updated'] },
                    { key: 'chats', label: 'Chats', actions: ['chat_created', 'chats_added', 'chat_removed', 'chat_restored'] },
                  ];
                  const current = FILTERS.find(f => f.key === activityFilter)!;
                  const filtered = current.actions
                    ? activity.filter(e => current.actions!.includes(e.action))
                    : activity;
                  return (
                    <>
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {FILTERS.map(f => {
                          const active = f.key === activityFilter;
                          return (
                            <button
                              key={f.key}
                              type="button"
                              onClick={() => setActivityFilter(f.key)}
                              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                                active
                                  ? 'bg-brand-blue text-white dark:bg-brand-yellow dark:text-black'
                                  : 'bg-[var(--chat-bg)] text-[var(--chat-muted)] hover:text-[var(--chat-text)]'
                              }`}
                            >
                              {f.label}
                            </button>
                          );
                        })}
                      </div>
                      {filtered.length === 0 ? (
                  <p className="py-4 text-center text-xs text-[var(--chat-muted)]">
                          {activity.length === 0
                            ? 'No activity yet. Actions you take here will show up.'
                            : 'No activity matches this filter.'}
                  </p>
                ) : (
                  <ul className="space-y-2">
                          {filtered.map(e => (
                      <li key={e.id} className="flex items-start gap-2 text-xs">
                        <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-blue/60 dark:bg-brand-yellow/70" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[var(--chat-text)]">
                            {formatActivity(e)}
                          </p>
                          <p className="text-[10px] text-[var(--chat-muted)]">
                            {new Date(e.created_at).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                    </>
                  );
                })()}
              </div>
            )}
          </section>
          </>)}

          {section === 'sources' && (
            <FolderSources
              folderId={folderId}
              sources={ws.sources}
              onAdd={ws.addSource}
              onDelete={ws.deleteSource}
              onUpdateStatus={ws.updateSourceStatus}
            />
          )}

          {section === 'memory' && (
            <FolderMemory
              memory={ws.memory}
              onAdd={ws.addMemory}
              onUpdate={ws.updateMemory}
              onUpdateStatus={ws.updateMemoryStatus}
              onDelete={ws.deleteMemory}
            />
          )}

          {section === 'instructions' && (
            <FolderInstructions folderId={folderId} />
          )}

          {section === 'links' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-card)] px-3 py-2 text-xs text-[var(--chat-muted)]">
                <LinkIcon className="h-3.5 w-3.5" />
                Quick Links are shortcuts only — Daryle does not read, ingest, or cite them.
              </div>
              <FolderQuickLinks
                quickLinks={ws.quickLinks}
                onAdd={ws.addQuickLink}
                onUpdate={ws.updateQuickLink}
                onDelete={ws.deleteQuickLink}
              />
            </div>
          )}

          {section === 'sharing' && (
            <div className="space-y-5">
              <ProjectMembersCard
                folderId={folderId}
                isOwner={isOwner}
                onActivity={(action, label) => logActivity(action, { target_type: 'member', target_label: label })}
              />
              <ProjectShareCard
                folderId={folderId}
                isOwner={isOwner}
                onActivity={(action, label) => logActivity(action, { target_type: 'invite', target_label: label })}
              />
            </div>
          )}

          {section === 'skills' && (
            <ComingSoonCard
              icon={Wand2}
              title="Project Skills"
              copy="Add specialized AI workflows scoped to this project — proposal writing, research, developer briefs, and more."
              bullets={[
                'Reusable workflows tuned for this project',
                'Drop-in templates for proposals, research, and briefs',
                'Triggered from the chat composer with one click',
              ]}
            />
          )}

          {section === 'settings' && (
            <ProjectDefaultsCard
              folderId={folderId}
              isOwner={isOwner}
              onSaved={() => logActivity('defaults_updated', { target_type: 'folder', target_id: folderId })}
            />
          )}

          {section === 'projectlinks' && (
            <ComingSoonCard
              icon={Sparkles}
              title="Project Links"
              copy="Connect this project to related tools and workspaces like Monday, Drive, Box, or your CRM so context flows in automatically."
              bullets={[
                'Two-way connections to your existing tools',
                'Pull live context from Drive, Box, Monday, CRMs',
                'Keep project data synced without manual uploads',
              ]}
            />
          )}
        </div>
      </div>

      {/* Settings slide-over (wraps existing FolderDashboard) */}
      <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={
            isMobile
              ? 'h-[92vh] w-full overflow-y-auto p-0 sm:max-w-none'
              : 'w-full overflow-y-auto p-0 sm:max-w-3xl'
          }
        >
          <FolderDashboard folderId={folderId} />
        </SheetContent>
      </Sheet>

      {/* Share slide-over */}
      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={
            isMobile
              ? 'h-[80vh] w-full overflow-y-auto p-4 sm:max-w-none'
              : 'w-full overflow-y-auto p-6 sm:max-w-lg'
          }
        >
          <h2 className="mb-4 font-heading text-lg font-semibold text-[var(--chat-text)]">Share project</h2>
          <div className="space-y-5">
            <ProjectMembersCard
              folderId={folderId}
              isOwner={isOwner}
              onActivity={(action, label) => logActivity(action, { target_type: 'member', target_label: label })}
            />
            <ProjectShareCard
              folderId={folderId}
              isOwner={isOwner}
              onActivity={(action, label) => logActivity(action, { target_type: 'invite', target_label: label })}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Move existing chats dialog */}
      <Dialog open={moveOpen} onOpenChange={(o) => { setMoveOpen(o); if (!o) { setSelectedIds(new Set()); setMoveSearch(''); } }}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden p-0">
          <DialogHeader className="border-b border-[var(--chat-border)] px-5 pb-3 pt-5">
            <DialogTitle className="font-heading text-lg">Add chats to “{folder.title}”</DialogTitle>
          </DialogHeader>
          <div className="px-5 pt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--chat-muted)]" />
              <Input
                placeholder="Search your chats…"
                value={moveSearch}
                onChange={e => setMoveSearch(e.target.value)}
                className="h-10 rounded-lg pl-9"
              />
            </div>
          </div>
          <div className="max-h-[50vh] overflow-y-auto px-5 py-3">
            {moveLoading && (
              <p className="py-6 text-center text-sm text-[var(--chat-muted)]">Loading…</p>
            )}
            {!moveLoading && filteredAvailable.length === 0 && (
              <p className="py-6 text-center text-sm text-[var(--chat-muted)]">
                {availableChats.length === 0 ? 'No other chats available.' : 'No matches.'}
              </p>
            )}
            <ul className="space-y-1">
              {filteredAvailable.map(chat => {
                const selected = selectedIds.has(chat.id);
                return (
                  <li key={chat.id}>
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        selected
                          ? 'border-brand-blue/40 bg-brand-blue/5'
                          : 'border-[var(--chat-border)] hover:bg-[var(--ui-bg-hover)]'
                      }`}
                    >
                      <Checkbox checked={selected} onCheckedChange={() => toggleSelect(chat.id)} />
                      <MessageSquare className="h-4 w-4 flex-shrink-0 text-[var(--ui-icon)]" />
                      <span className="min-w-0 flex-1 truncate text-[var(--chat-text)]">
                        {chat.title || 'Untitled Chat'}
                      </span>
                      <span className="flex-shrink-0 text-xs text-[var(--chat-muted)]">
                        {shortDate(chat.updated_at) ?? ''}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
          <DialogFooter className="border-t border-[var(--chat-border)] px-5 py-3">
            <div className="mr-auto text-xs text-[var(--chat-muted)]">
              {selectedIds.size} selected
            </div>
            <Button variant="ghost" onClick={() => setMoveOpen(false)} disabled={movingNow}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMove} disabled={selectedIds.size === 0 || movingNow}>
              {movingNow ? 'Adding…' : `Add ${selectedIds.size || ''}`.trim()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirm} onOpenChange={(o) => { if (!o) setConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirm?.kind === 'delete'
                ? 'Delete this chat?'
                : confirm?.kind === 'remove'
                ? 'Remove chat from project?'
                : confirm?.kind === 'pin'
                ? 'Pin this chat?'
                : 'Unpin this chat?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === 'delete'
                ? `"${confirm.chat.title || 'Untitled Chat'}" will be permanently deleted, including its messages. This cannot be undone.`
                : confirm?.kind === 'remove'
                ? `"${confirm.chat.title || 'Untitled Chat'}" will be moved out of this project. You can undo this right after.`
                : confirm?.kind === 'pin'
                ? `"${confirm.chat.title || 'Untitled Chat'}" will be pinned to the top of this project.`
                : `"${confirm?.chat.title || 'Untitled Chat'}" will be unpinned.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirm?.kind === 'remove' || confirm?.kind === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={() => {
                if (!confirm) return;
                const c = confirm;
                setConfirm(null);
                if (c.kind === 'delete') performDelete(c.chat);
                else if (c.kind === 'remove') performRemove(c.chat);
                else performPin(c.chat);
              }}
            >
              {confirm?.kind === 'delete' ? 'Delete' : confirm?.kind === 'remove' ? 'Remove' : confirm?.kind === 'pin' ? 'Pin' : 'Unpin'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectWorkspace;