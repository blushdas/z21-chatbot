import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/SupabaseAuthContext';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, ArrowUpRight, Clock, MessageSquare, Pencil, Check, X, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type CanvasRow = {
  id: string;
  chat_id: string | null;
  title: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  last_opened_at: string | null;
  content_plaintext: string | null;
};

type SortKey = 'updated_desc' | 'updated_asc' | 'created_desc' | 'created_asc' | 'title_asc' | 'title_desc';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'updated_desc', label: 'Recently updated' },
  { value: 'updated_asc', label: 'Oldest updated' },
  { value: 'created_desc', label: 'Newest created' },
  { value: 'created_asc', label: 'Oldest created' },
  { value: 'title_asc', label: 'Title A → Z' },
  { value: 'title_desc', label: 'Title Z → A' },
];

const CanvasesSection: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState<CanvasRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('updated_desc');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CanvasRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [chatFilter, setChatFilter] = useState<string>('all');
  const [chatTitles, setChatTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('canvases')
        .select('id, chat_id, title, status, created_at, updated_at, last_opened_at, content_plaintext')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1000);
      if (cancelled) return;
      if (error) console.error('Failed to load canvases:', error);
      setRows((data as CanvasRow[]) || []);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  // Fetch parent chat titles for the chat picker.
  useEffect(() => {
    if (!user?.id) return;
    const ids = Array.from(new Set(rows.map((r) => r.chat_id).filter((v): v is string => !!v)));
    if (ids.length === 0) { setChatTitles({}); return; }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('id, title')
        .in('id', ids);
      if (cancelled || error) return;
      const map: Record<string, string> = {};
      (data || []).forEach((c: { id: string; title: string | null }) => {
        map[c.id] = c.title || 'Untitled chat';
      });
      setChatTitles(map);
    })();
    return () => { cancelled = true; };
  }, [rows, user?.id]);

  const chatOptions = useMemo(() => {
    const counts = new Map<string, number>();
    let orphan = 0;
    rows.forEach((r) => {
      if (r.status === 'deleted' && !showDeleted) return;
      if (r.chat_id) counts.set(r.chat_id, (counts.get(r.chat_id) || 0) + 1);
      else orphan += 1;
    });
    const opts = Array.from(counts.entries())
      .map(([id, count]) => ({ id, label: chatTitles[id] || 'Untitled chat', count }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return { opts, orphan };
  }, [rows, chatTitles, showDeleted]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const base = showDeleted ? rows : rows.filter((r) => r.status !== 'deleted');
    const chatScoped = chatFilter === 'all'
      ? base
      : chatFilter === '__none__'
        ? base.filter((r) => !r.chat_id)
        : base.filter((r) => r.chat_id === chatFilter);
    const list = term
      ? chatScoped.filter((r) =>
          (r.title || '').toLowerCase().includes(term) ||
          (r.content_plaintext || '').toLowerCase().includes(term),
        )
      : chatScoped.slice();
    const cmp = (a: CanvasRow, b: CanvasRow) => {
      switch (sort) {
        case 'updated_asc': return +new Date(a.updated_at) - +new Date(b.updated_at);
        case 'created_desc': return +new Date(b.created_at) - +new Date(a.created_at);
        case 'created_asc': return +new Date(a.created_at) - +new Date(b.created_at);
        case 'title_asc': return (a.title || '').localeCompare(b.title || '');
        case 'title_desc': return (b.title || '').localeCompare(a.title || '');
        case 'updated_desc':
        default: return +new Date(b.updated_at) - +new Date(a.updated_at);
      }
    };
    return list.sort(cmp);
  }, [rows, search, sort, showDeleted, chatFilter]);

  const deletedCount = useMemo(() => rows.filter((r) => r.status === 'deleted').length, [rows]);

  const openCanvas = (c: CanvasRow) => {
    if (c.chat_id) {
      try { sessionStorage.removeItem(`canvasClosed:${c.chat_id}`); } catch {}
      navigate(`/chat/${c.chat_id}?canvas=${c.id}`);
    } else {
      navigate(`/canvas/${c.id}`);
    }
  };

  const startRename = (c: CanvasRow) => {
    setEditingId(c.id);
    setEditingTitle(c.title || '');
  };

  const cancelRename = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const saveRename = async (c: CanvasRow) => {
    const next = editingTitle.trim().slice(0, 200);
    if (!next || next === (c.title || '')) { cancelRename(); return; }
    setSavingId(c.id);
    const { error } = await supabase.from('canvases').update({ title: next }).eq('id', c.id);
    setSavingId(null);
    if (error) { toast.error('Failed to rename canvas'); return; }
    setRows((prev) => prev.map((r) => (r.id === c.id ? { ...r, title: next } : r)));
    cancelRename();
    toast.success('Canvas renamed');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    // Soft-delete so the canvas can still be recovered. Hidden from the list by default.
    const { error } = await supabase
      .from('canvases')
      .update({ status: 'deleted' })
      .eq('id', deleteTarget.id);
    setDeleting(false);
    if (error) { toast.error('Failed to delete canvas'); return; }
    setRows((prev) => prev.map((r) => (r.id === deleteTarget.id ? { ...r, status: 'deleted' } : r)));
    toast.success('Canvas moved to deleted. Toggle "Show deleted" to recover it.');
    setDeleteTarget(null);
  };

  const restoreCanvas = async (c: CanvasRow) => {
    const { error } = await supabase
      .from('canvases')
      .update({ status: 'active' })
      .eq('id', c.id);
    if (error) { toast.error('Failed to restore canvas'); return; }
    setRows((prev) => prev.map((r) => (r.id === c.id ? { ...r, status: 'active' } : r)));
    toast.success('Canvas restored');
  };

  return (
    <div className="rounded-2xl bg-[var(--chat-card)] border border-[var(--chat-border)] p-6 space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-[var(--chat-text)]">Canvas archive</h3>
          <p className="text-xs text-[var(--chat-muted)]">Every canvas you've ever created. Open one to jump back to its chat.</p>
        </div>
        <span className="text-[11px] text-[var(--chat-muted)]">{filtered.length} of {rows.length}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--chat-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search canvases by title or content..."
            className="pl-9 bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]"
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[200px] bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={chatFilter} onValueChange={setChatFilter}>
          <SelectTrigger className="w-[220px] bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]">
            <SelectValue placeholder="All chats" />
          </SelectTrigger>
          <SelectContent className="max-h-[320px]">
            <SelectItem value="all">All chats</SelectItem>
            {chatOptions.orphan > 0 && (
              <SelectItem value="__none__">No parent chat ({chatOptions.orphan})</SelectItem>
            )}
            {chatOptions.opts.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.label} ({o.count})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={() => setShowDeleted((v) => !v)}
          className={`px-3 h-9 rounded-md text-xs border transition-colors inline-flex items-center gap-1.5 ${
            showDeleted
              ? 'border-brand-yellow/40 bg-brand-yellow/10 text-brand-yellow'
              : 'border-[var(--chat-border)] bg-[var(--chat-bg)] text-[var(--chat-muted)] hover:text-[var(--chat-text)]'
          }`}
          title={showDeleted ? 'Hide deleted canvases' : 'Show deleted canvases'}
        >
          <Trash2 size={12} />
          {showDeleted ? 'Hide deleted' : 'Show deleted'}
          {deletedCount > 0 && (
            <span className="ml-1 px-1.5 py-px rounded bg-[var(--chat-card-2)] text-[10px] text-[var(--chat-muted)]">
              {deletedCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--chat-muted)]">Loading canvases…</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-[var(--chat-muted)] border border-dashed border-[var(--chat-border)] rounded-xl">
          {rows.length === 0 ? 'You have not created any canvases yet.' : 'No canvases match your search.'}
        </div>
      ) : (
        <ul className="divide-y divide-[var(--chat-border)] border border-[var(--chat-border)] rounded-xl overflow-hidden">
          {filtered.map((c) => {
            const preview = (c.content_plaintext || '').replace(/\s+/g, ' ').trim().slice(0, 140);
            return (
              <li key={c.id} className="p-4 hover:bg-[var(--ui-bg-hover)] transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-brand-yellow/15 border border-brand-yellow/30 flex items-center justify-center">
                    <FileText size={14} className="text-brand-yellow" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {editingId === c.id ? (
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <Input
                            autoFocus
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); void saveRename(c); }
                              else if (e.key === 'Escape') { e.preventDefault(); cancelRename(); }
                            }}
                            disabled={savingId === c.id}
                            maxLength={200}
                            className="h-8 text-sm bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)]"
                          />
                          <button
                            onClick={() => void saveRename(c)}
                            disabled={savingId === c.id || !editingTitle.trim()}
                            title="Save"
                            className="p-1.5 rounded-md text-brand-yellow hover:bg-brand-yellow/10 disabled:opacity-40"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={cancelRename}
                            disabled={savingId === c.id}
                            title="Cancel"
                            className="p-1.5 rounded-md text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => openCanvas(c)}
                            className="text-sm font-medium text-[var(--chat-text)] hover:text-brand-yellow text-left truncate"
                          >
                            {c.title || 'Untitled canvas'}
                          </button>
                          <button
                            onClick={() => startRename(c)}
                            title="Rename canvas"
                            className="p-1 rounded-md text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-card-2)]"
                          >
                            <Pencil size={12} />
                          </button>
                          {c.status && c.status !== 'active' && (
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-px rounded bg-[var(--chat-card-2)] text-[var(--chat-muted)] border border-[var(--chat-border)]">
                              {c.status}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    {preview && (
                      <p className="text-xs text-[var(--chat-muted)] mt-1 line-clamp-2">{preview}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-[var(--chat-muted)]">
                      <span className="inline-flex items-center gap-1"><Clock size={11} /> Updated {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}</span>
                      <span>Created {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {c.chat_id && (
                      <button
                        onClick={() => navigate(`/chat/${c.chat_id}`)}
                        title="Open chat"
                        className="px-2 py-1 rounded-md text-xs text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--chat-card-2)] inline-flex items-center gap-1"
                      >
                        <MessageSquare size={12} /> Chat
                      </button>
                    )}
                    <button
                      onClick={() => openCanvas(c)}
                      title="Open canvas"
                      className="px-2 py-1 rounded-md text-xs text-brand-yellow hover:bg-brand-yellow/10 inline-flex items-center gap-1"
                    >
                      Open <ArrowUpRight size={12} />
                    </button>
                    {c.status === 'deleted' ? (
                      <button
                        onClick={() => void restoreCanvas(c)}
                        title="Restore canvas"
                        className="px-2 py-1 rounded-md text-xs text-emerald-400 hover:bg-emerald-500/10"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => setDeleteTarget(c)}
                        title="Delete canvas"
                        className="p-1.5 rounded-md text-[var(--chat-muted)] hover:text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && !deleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this canvas?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.title || 'Untitled canvas'}" will be permanently removed. The chat that created it{deleteTarget?.chat_id ? ' will stay intact and remain available in your history' : ''}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); void confirmDelete(); }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? 'Deleting…' : 'Delete canvas'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CanvasesSection;
