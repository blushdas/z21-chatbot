import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Star, Search, ArrowUpRight, X } from 'lucide-react';
import { SidebarProvider } from '@/hooks/useSidebarState';
import { SourceDrawerProvider } from '@/hooks/useSourceDrawer';
import { SourceComparisonProvider } from '@/hooks/useSourceComparison';
import { AppReadyProvider } from '@/context/AppReadyContext';
import SavedChatsSidebar from '@/components/SavedChatsSidebar';
import MobileSidebarDrawer from '@/components/MobileSidebarDrawer';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { cleanTitle } from '@/utils/titleUtils';

type SortKey = 'recently_favorited' | 'recently_updated';

const FavoritesContent: React.FC = () => {
  const { isOpen } = useSidebarState();
  const { user } = useAuth();
  const { rawFavorites, loading, removeFavorite } = useFavorites();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('recently_favorited');

  const items = useMemo(() => {
    const rows = rawFavorites.map((fav) => ({
      favId: fav.id,
      chatId: fav.chat_id,
      messageIndex: fav.message_index,
      title: fav.title || cleanTitle(fav.chat_title || '') || 'Favorited message',
      preview: (fav.content || '').replace(/\s+/g, ' ').trim().slice(0, 180),
      chatTitle: cleanTitle(fav.chat_title || '') || 'Chat',
      updatedAt: new Date(fav.chat_created_at || fav.created_at).getTime(),
      favoritedAt: new Date(fav.created_at).getTime(),
    }));

    const filtered = search.trim()
      ? rows.filter((r) => {
          const q = search.toLowerCase();
          return r.title.toLowerCase().includes(q)
            || r.preview.toLowerCase().includes(q)
            || r.chatTitle.toLowerCase().includes(q);
        })
      : rows;

    const sorted = [...filtered].sort((a, b) =>
      sort === 'recently_favorited' ? b.favoritedAt - a.favoritedAt : b.updatedAt - a.updatedAt,
    );
    return sorted;
  }, [rawFavorites, search, sort]);

  return (
    <div className="relative flex h-screen-safe no-bounce">
      <div className="flex w-full h-full">
        <MobileSidebarDrawer
          onResumeChat={(chat) => navigate(`/chat/${chat.id}`)}
          onStartNewChat={() => navigate('/chat')}
        />
        <div
          className={`hidden sm:block h-full overflow-hidden ${
            user ? (isOpen ? 'w-[288px] shrink-0' : 'w-0 shrink') : 'w-[288px] shrink-0'
          }`}
          aria-hidden={user ? !isOpen : false}
        >
          <SavedChatsSidebar
            onResumeChat={(chat) => navigate(`/chat/${chat.id}`)}
            onStartNewChat={() => navigate('/chat')}
          />
        </div>

        <div className="flex flex-col min-h-0 min-w-0 flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl px-4 sm:px-8 py-8">
              <header className="mb-6 flex items-center gap-3">
                <Star className="h-7 w-7 text-brand-yellow" fill="currentColor" />
                <div>
                  <h1 className="text-2xl font-semibold text-[var(--chat-text)]">Favorites</h1>
                  <p className="text-sm text-[var(--chat-muted)]">
                    Quickly access individual messages you've saved.
                  </p>
                </div>
              </header>

              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--chat-muted)]" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search favorites..."
                    className="pl-9 bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]"
                  />
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-[var(--chat-border)] bg-[var(--chat-card)] p-1">
                  <button
                    type="button"
                    onClick={() => setSort('recently_favorited')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                      sort === 'recently_favorited'
                        ? 'bg-brand-yellow text-brand-blue'
                        : 'text-[var(--chat-muted)] hover:text-[var(--chat-text)]'
                    }`}
                  >
                    Recently favorited
                  </button>
                  <button
                    type="button"
                    onClick={() => setSort('recently_updated')}
                    className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                      sort === 'recently_updated'
                        ? 'bg-brand-yellow text-brand-blue'
                        : 'text-[var(--chat-muted)] hover:text-[var(--chat-text)]'
                    }`}
                  >
                    Recent chat activity
                  </button>
                </div>
              </div>

              {loading && rawFavorites.length === 0 ? (
                <div className="py-16 text-center text-sm text-[var(--chat-muted)]">Loading…</div>
              ) : items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-card)] p-10 text-center">
                  <Star className="mx-auto mb-3 h-8 w-8 text-[var(--chat-muted)]" />
                  <h2 className="text-lg font-semibold text-[var(--chat-text)]">No favorites yet</h2>
                  <p className="mt-1 text-sm text-[var(--chat-muted)]">
                    Star a message inside any chat to keep it easy to find.
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <Button asChild variant="default" className="bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90">
                      <Link to="/chat">Browse recent chats</Link>
                    </Button>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li
                      key={item.favId}
                      className="group flex items-start gap-3 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-card)] px-4 py-3 transition-colors hover:bg-[var(--ui-bg-hover)]"
                    >
                      <Star className="mt-1 h-4 w-4 flex-shrink-0 text-brand-yellow" fill="currentColor" />
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => navigate(`/chat/${item.chatId}#msg-${item.messageIndex}`)}
                      >
                        <div className="truncate text-sm font-medium text-[var(--chat-text)]">
                          {item.title}
                        </div>
                        {item.preview && (
                          <div className="mt-0.5 line-clamp-2 text-xs text-[var(--chat-muted)]">
                            {item.preview}
                          </div>
                        )}
                        <div className="mt-0.5 text-[11px] text-[var(--chat-muted)]">
                          From “{item.chatTitle}” · favorited {format(new Date(item.favoritedAt), 'MMM d, yyyy')}
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
                        onClick={() => navigate(`/chat/${item.chatId}#msg-${item.messageIndex}`)}
                      >
                        Open <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-[var(--chat-muted)] hover:text-red-400"
                        title="Remove from Favorites (won't delete the message)"
                        onClick={() => removeFavorite(item.favId)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FavoritesPage: React.FC = () => {
  return (
    <SourceDrawerProvider>
      <SourceComparisonProvider>
        <SidebarProvider>
          <AppReadyProvider>
            <FavoritesContent />
          </AppReadyProvider>
        </SidebarProvider>
      </SourceComparisonProvider>
    </SourceDrawerProvider>
  );
};

export default FavoritesPage;
