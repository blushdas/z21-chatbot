import React, { useEffect, useMemo, useState } from 'react';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { X, Search, FileText, Maximize2, Minimize2, Clock, MessageSquare, List as ListIcon, ArrowUpDown, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

type CanvasRow = {
  id: string;
  chat_id: string | null;
  title: string | null;
  updated_at: string;
  created_at: string;
  last_opened_at: string | null;
};

type SortKey = 'updated_desc' | 'created_desc' | 'title_asc';
type ViewMode = 'flat' | 'by_chat';

// Module-level cache so chat titles persist across drawer open/close and
// view-mode toggles within the same page session.
const chatTitleCache = new Map<string, string>();

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const CanvasesDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [rows, setRows] = useState<CanvasRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(() => sessionStorage.getItem('canvasesDrawer:search') || '');
  const [sort, setSort] = useState<SortKey>(() => (sessionStorage.getItem('canvasesDrawer:sort') as SortKey) || 'updated_desc');
  const [viewMode, setViewMode] = useState<ViewMode>(() => (sessionStorage.getItem('canvasesDrawer:view') as ViewMode) || 'flat');
  const [chatTitles, setChatTitles] = useState<Record<string, string>>(() => Object.fromEntries(chatTitleCache));
  const [chatFilter, setChatFilter] = useState<string | null>(() => {
    try {
      return localStorage.getItem('canvasesDrawer:chatFilter')
        || sessionStorage.getItem('canvasesDrawer:chatFilter')
        || null;
    } catch {
      return null;
    }
  });
  const [chatPickerOpen, setChatPickerOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => { sessionStorage.setItem('canvasesDrawer:search', search); }, [search]);
  useEffect(() => { sessionStorage.setItem('canvasesDrawer:sort', sort); }, [sort]);
  useEffect(() => { sessionStorage.setItem('canvasesDrawer:view', viewMode); }, [viewMode]);
  useEffect(() => {
    try {
      if (chatFilter) {
        localStorage.setItem('canvasesDrawer:chatFilter', chatFilter);
        sessionStorage.setItem('canvasesDrawer:chatFilter', chatFilter);
      } else {
        localStorage.removeItem('canvasesDrawer:chatFilter');
        sessionStorage.removeItem('canvasesDrawer:chatFilter');
      }
    } catch {}
  }, [chatFilter]);

  useEffect(() => {
    if (!isOpen || !user?.id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('canvases')
        .select('id, chat_id, title, updated_at, created_at, last_opened_at')
        .eq('owner_id', user.id)
        .neq('status', 'deleted')
        .order('updated_at', { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) console.error('CanvasesDrawer load error', error);
      setRows((data as CanvasRow[]) || []);
      setLoading(false);
      const allIds = Array.from(new Set(((data as CanvasRow[]) || []).map(r => r.chat_id).filter(Boolean))) as string[];
      const missing = allIds.filter(id => !chatTitleCache.has(id));
      if (missing.length) {
        const { data: chats } = await supabase
          .from('chats')
          .select('id, title')
          .in('id', missing);
        if (cancelled) return;
        (chats as Array<{ id: string; title: string | null }> | null)?.forEach(c => {
          chatTitleCache.set(c.id, c.title || 'Untitled chat');
        });
      }
      if (!cancelled) {
        setChatTitles(Object.fromEntries(chatTitleCache));
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, user?.id]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = rows.filter(r => {
      if (chatFilter && r.chat_id !== chatFilter) return false;
      if (!q) return true;
      const inTitle = (r.title || '').toLowerCase().includes(q);
      const inChat = r.chat_id ? (chatTitles[r.chat_id] || '').toLowerCase().includes(q) : false;
      return inTitle || inChat;
    });
    arr = [...arr].sort((a, b) => {
      if (sort === 'title_asc') return (a.title || '').localeCompare(b.title || '');
      if (sort === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return arr;
  }, [rows, search, sort, chatFilter, chatTitles]);

  const chatOptions = useMemo(() => {
    const ids = Array.from(new Set(rows.map(r => r.chat_id).filter(Boolean))) as string[];
    return ids
      .map(id => ({ id, title: chatTitles[id] || 'Untitled chat' }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [rows, chatTitles]);

  const compareBySort = useMemo(() => (a: CanvasRow, b: CanvasRow) => {
    if (sort === 'title_asc') return (a.title || '').localeCompare(b.title || '');
    if (sort === 'created_desc') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  }, [sort]);

  const groupedByChat = useMemo(() => {
    const groups = filtered.reduce<Record<string, CanvasRow[]>>((acc, r) => {
      const key = r.chat_id || '__none__';
      (acc[key] ||= []).push(r);
      return acc;
    }, {});
    // Sort items within each group by the selected criteria
    Object.values(groups).forEach(items => items.sort(compareBySort));
    // Order chat groups by their top-ranked item under the selected sort
    const entries = Object.entries(groups).sort(([, a], [, b]) => compareBySort(a[0], b[0]));
    return entries;
  }, [filtered, compareBySort]);

  const openCanvas = (row: CanvasRow) => {
    onClose();
    if (row.chat_id) navigate(`/chat/${row.chat_id}?canvas=${row.id}`);
    else navigate(`/canvas/${row.id}`);
  };

  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-brand-blue" />
          <h2 className="text-xl font-semibold text-brand-blue">Canvases</h2>
          <span className="text-sm text-[var(--chat-muted)] bg-[var(--ui-bg-hover)] dark:bg-gray-800 px-2 py-1 rounded-full">
            {rows.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setExpanded(v => !v)}
              aria-label={expanded ? 'Collapse panel' : 'Expand panel'}
              className="rounded-full hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-800"
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--chat-muted)]" />
          <Input
            placeholder="Search canvases..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger
            className="w-[180px] border-brand-blue/40 bg-brand-blue/5 text-brand-blue ring-1 ring-brand-blue/20"
            aria-label={`Sort: ${sort === 'updated_desc' ? 'Recently updated' : sort === 'created_desc' ? 'Newest created' : 'Title A → Z'}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="z-[60010]">
            {([
              ['updated_desc', 'Recently updated'],
              ['created_desc', 'Newest created'],
              ['title_asc', 'Title A → Z'],
            ] as const).map(([value, label]) => (
              <SelectItem
                key={value}
                value={value}
                className={sort === value ? 'bg-brand-blue/10 font-medium text-brand-blue' : ''}
              >
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Popover open={chatPickerOpen} onOpenChange={setChatPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 w-[200px] justify-between font-normal"
              aria-label="Filter by chat"
            >
              <span className="flex items-center gap-1.5 truncate">
                <MessageSquare className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {chatFilter ? (chatTitles[chatFilter] || 'Selected chat') : 'All chats'}
                </span>
              </span>
              <ChevronsUpDown className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0 z-[60010]" align="end">
            <Command>
              <CommandInput placeholder="Search chats..." />
              <CommandList>
                <CommandEmpty>No chats found</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__all__"
                    onSelect={() => { setChatFilter(null); setChatPickerOpen(false); }}
                  >
                    <Check className={`mr-2 h-4 w-4 ${chatFilter === null ? 'opacity-100' : 'opacity-0'}`} />
                    All chats
                  </CommandItem>
                  {chatOptions.map(opt => (
                    <CommandItem
                      key={opt.id}
                      value={`${opt.title} ${opt.id}`}
                      onSelect={() => { setChatFilter(opt.id); setChatPickerOpen(false); }}
                    >
                      <Check className={`mr-2 h-4 w-4 ${chatFilter === opt.id ? 'opacity-100' : 'opacity-0'}`} />
                      <span className="truncate">{opt.title}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="flex items-center rounded-md border border-[var(--chat-border)] dark:border-gray-800 overflow-hidden">
          <Button
            type="button"
            variant={viewMode === 'flat' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-none h-9 px-2"
            onClick={() => setViewMode('flat')}
            aria-label="Flat view"
            title="Flat view"
          >
            <ListIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant={viewMode === 'by_chat' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-none h-9 px-2"
            onClick={() => setViewMode('by_chat')}
            aria-label="Group by chat"
            title="Group by chat"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-1.5 text-[11px] text-[var(--chat-muted)]">
        <ArrowUpDown className="h-3 w-3" />
        <span>Sorted by</span>
        <span className="rounded-full bg-brand-blue/10 px-2 py-0.5 font-medium text-brand-blue">
          {sort === 'updated_desc' ? 'Recently updated' : sort === 'created_desc' ? 'Newest created' : 'Title A → Z'}
        </span>
        <span className="text-[var(--chat-muted)]">·</span>
        <span>{viewMode === 'by_chat' ? 'Grouped by chat' : 'Flat list'}</span>
        <span className="text-[var(--chat-muted)]">·</span>
        <span>{filtered.length} {filtered.length === 1 ? 'canvas' : 'canvases'}</span>
      </div>

      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-[var(--chat-muted)] text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="mx-auto mb-3 h-10 w-10 text-[var(--chat-muted)]" />
            <h3 className="text-lg font-medium mb-1 text-brand-blue">No canvases yet</h3>
            <p className="text-[var(--chat-muted)] mb-4">Open a chat and create a canvas to see it here</p>
            <Button onClick={onClose} variant="outline">Start a conversation</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-[var(--chat-muted)]">
            <p className="mb-4">No canvases match your search</p>
            <Button onClick={() => setSearch('')} variant="outline" size="sm">Clear search</Button>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-220px)]">
            {viewMode === 'by_chat' ? (
              <div className="space-y-5 pr-4 pb-8">
                {groupedByChat.map(([chatId, items]) => (
                  <div key={chatId}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <MessageSquare className="h-3.5 w-3.5 text-[var(--chat-muted)]" />
                      <button
                        type="button"
                        className="text-xs font-semibold uppercase tracking-wide text-[var(--chat-text-secondary)] hover:text-brand-yellow truncate"
                        onClick={() => {
                          if (chatId === '__none__') return;
                          onClose();
                          navigate(`/chat/${chatId}`);
                        }}
                      >
                        {chatId === '__none__' ? 'No chat' : (chatTitles[chatId] || 'Loading…')}
                      </button>
                      <span className="text-[11px] text-[var(--chat-muted)]">({items.length})</span>
                    </div>
                    <div
                      className={
                        expanded
                          ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3'
                          : 'space-y-2'
                      }
                    >
                      {items.map(row => (
                        <button
                          key={row.id}
                          type="button"
                          onClick={() => openCanvas(row)}
                          className="group w-full text-left rounded-lg border border-[var(--chat-border)] dark:border-gray-800 bg-[var(--chat-card)] dark:bg-gray-900 hover:border-brand-yellow hover:shadow-sm transition-all p-3"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-brand-blue/10 text-brand-blue">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-medium text-brand-blue group-hover:underline">
                                {row.title || 'Untitled canvas'}
                              </h4>
                              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--chat-muted)]">
                                <Clock className="h-3 w-3" />
                                Updated {formatDistanceToNow(new Date(row.updated_at), { addSuffix: true })}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
            <div
              className={
                expanded
                  ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pr-4 pb-8'
                  : 'space-y-2 pr-4 pb-8'
              }
            >
              {filtered.map(row => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => openCanvas(row)}
                  className="group w-full text-left rounded-lg border border-[var(--chat-border)] dark:border-gray-800 bg-[var(--chat-card)] dark:bg-gray-900 hover:border-brand-yellow hover:shadow-sm transition-all p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-brand-blue/10 text-brand-blue">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-brand-blue group-hover:underline">
                        {row.title || 'Untitled canvas'}
                      </h4>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[var(--chat-muted)]">
                        <Clock className="h-3 w-3" />
                        Updated {formatDistanceToNow(new Date(row.updated_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            )}
          </ScrollArea>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="px-4 pt-4 pb-6 max-w-md mx-auto h-[85vh] rounded-t-lg">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className={`${expanded ? 'w-[66vw] sm:!max-w-[66vw]' : 'w-[42rem] sm:!max-w-[42rem]'} !max-w-[95vw] p-8 overflow-hidden flex flex-col z-[60000] transition-[width] duration-200`}
        hideCloseButton
      >
        {content}
      </SheetContent>
    </Sheet>
  );
};

export default CanvasesDrawer;