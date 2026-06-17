import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, MessageSquare, Link2, FileText, BookOpen, Users, ChevronRight } from 'lucide-react';
import { useFolders } from '@/context/FolderContext';
import { useChatManagement } from '@/hooks/useChatManagement';
import { useFolderWorkspace } from '@/hooks/supabase/useFolderWorkspace';
import { useFolderInstructions } from '@/hooks/supabase/useFolderInstructions';
import { publishProjectChats } from '@/lib/projectChatsDebug';

interface ProjectNewChatHeroProps {
  folderId: string;
  currentChatId?: string | null;
  inputSlot: React.ReactNode;
}

const ProjectNewChatHero: React.FC<ProjectNewChatHeroProps> = ({
  folderId,
  currentChatId,
  inputSlot,
}) => {
  const navigate = useNavigate();
  const { folders } = useFolders();
  const { savedChats } = useChatManagement();
  const ws = useFolderWorkspace(folderId);
  const { instruction, isLoading: instructionsLoading } = useFolderInstructions(folderId);
  const wsLoading = ws.isLoading;

  const folder = folders.find(f => f.id === folderId);

  const recentChats = React.useMemo(() => {
    return savedChats
      .filter(c => c.folder_id === folderId)
      .filter(c => c.id !== currentChatId)
      .filter(c => {
        const title = (c.title || '').trim().toLowerCase();
        const empty = !Array.isArray(c.messages) || c.messages.length === 0;
        return !((title === '' || title === 'new chat') && empty);
      })
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 20);
  }, [savedChats, folderId, currentChatId]);

  // Dev-only: publish the full visible set (including currentChat) so the
  // consistency badge can compare with the workspace view.
  const visibleAll = React.useMemo(() => {
    return savedChats
      .filter(c => c.folder_id === folderId)
      .filter(c => {
        const title = (c.title || '').trim().toLowerCase();
        const empty = !Array.isArray(c.messages) || c.messages.length === 0;
        return !((title === '' || title === 'new chat') && empty);
      });
  }, [savedChats, folderId]);

  React.useEffect(() => {
    publishProjectChats('hero', folderId, visibleAll.map(c => c.id));
  }, [folderId, visibleAll]);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const gotoSection = (section: string) => navigate(`/folder/${folderId}?section=${section}`);

  const approvedSources = ws.sources
    .filter(s => s.status === 'approved' || s.status === 'reviewed')
    .slice(0, 5);
  const memberCount = ws.members.length;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto bg-[var(--chat-bg)]">
      <div className="w-full max-w-6xl mx-auto px-6 py-10 pt-20 flex flex-col">
        {/* Project title */}
        <div className="flex items-center gap-3 mb-8">
          <span className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-brand-yellow/15 text-brand-yellow">
            <FolderOpen size={20} />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-[var(--chat-muted)]">Project</div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--chat-text)] truncate">
              {folder?.title ?? 'Project'}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: 2/3 — input + chats */}
          <div className="md:col-span-2 min-w-0">
            <div className="mb-10">{inputSlot}</div>

            <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--chat-text)]">Chats in this project</h2>
            {folder && (
              <button
                onClick={() => navigate(`/folder/${folder.id}`)}
                className="text-xs text-[var(--chat-muted)] hover:text-[var(--chat-text)] transition-colors"
              >
                Open Project Workspace & Settings →
              </button>
            )}
          </div>

          {recentChats.length === 0 ? (
            <div className="text-sm text-[var(--chat-muted)] py-6 text-center border border-dashed border-[var(--chat-border)] rounded-lg">
              No chats yet in this project. Start one above.
            </div>
          ) : (
            <ul className="divide-y divide-[var(--chat-border)] border border-[var(--chat-border)] rounded-lg overflow-hidden bg-[var(--chat-card)]">
              {recentChats.map(chat => {
                const preview = chat.messages?.find(m => m.sender === 'user')?.content
                  ?? chat.messages?.[0]?.content
                  ?? '';
                return (
                  <li key={chat.id}>
                    <button
                      onClick={() => navigate(`/chat/${chat.id}`, { replace: true })}
                      className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[var(--chat-card-2)] transition-colors"
                    >
                      <MessageSquare size={15} className="mt-0.5 text-[var(--chat-muted)] flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-[var(--chat-text)] truncate">
                            {chat.title || 'New Conversation'}
                          </span>
                          <span className="text-[11px] text-[var(--chat-muted)] flex-shrink-0">
                            {formatDate(chat.updatedAt)}
                          </span>
                        </div>
                        {preview && (
                          <p className="text-xs text-[var(--chat-muted)] truncate mt-0.5">
                            {preview.replace(/\s+/g, ' ').slice(0, 140)}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
            </div>
          </div>

          {/* Right: 1/3 — project context cards */}
          <aside className="md:col-span-1 space-y-4">
            {/* Quick Links */}
            <SidebarCard
              icon={<Link2 size={14} />}
              title="Quick Links"
              count={ws.quickLinks.length}
              cta="Show all quick links"
              onCta={() => gotoSection('links')}
              empty="No quick links yet — add bookmarks, docs, or references your team should keep handy."
              isEmpty={ws.quickLinks.length === 0}
              isLoading={wsLoading}
              skeletonLines={4}
            >
              <ul className="space-y-1.5">
                {ws.quickLinks.slice(0, 5).map(link => (
                  <li key={link.id} className="truncate">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[var(--chat-text)] hover:text-brand-yellow truncate inline-block max-w-full"
                      title={link.title}
                    >
                      • {link.title}
                    </a>
                  </li>
                ))}
              </ul>
            </SidebarCard>

            {/* Instructions */}
            <SidebarCard
              icon={<FileText size={14} />}
              title="Instructions"
              cta={instruction?.content ? 'Edit instructions' : 'Add instructions'}
              onCta={() => gotoSection('instructions')}
              empty="No instructions yet — tell the AI how to behave in this project (tone, focus, do/don'ts)."
              isEmpty={!instruction?.content?.trim()}
              isLoading={instructionsLoading}
              skeletonLines={3}
            >
              <p className="text-xs text-[var(--chat-muted)] line-clamp-5 whitespace-pre-wrap">
                {instruction?.content?.slice(0, 320)}
                {instruction && instruction.content.length > 320 ? '…' : ''}
              </p>
            </SidebarCard>

            {/* Project Knowledge Base */}
            <SidebarCard
              icon={<BookOpen size={14} />}
              title="Project Knowledge Base"
              count={ws.sources.length}
              cta="Manage knowledge base"
              onCta={() => gotoSection('sources')}
              empty="No knowledge files yet — upload PDFs, docs, or notes the AI should reference."
              isEmpty={approvedSources.length === 0}
              isLoading={wsLoading}
              skeletonLines={4}
            >
              <ul className="space-y-1.5">
                {approvedSources.map(s => (
                  <li key={s.id} className="truncate text-xs text-[var(--chat-text)]" title={s.title}>
                    • {s.title}
                  </li>
                ))}
              </ul>
            </SidebarCard>

            {/* Sharing */}
            <SidebarCard
              icon={<Users size={14} />}
              title="Sharing"
              count={memberCount}
              cta="Manage sharing"
              onCta={() => gotoSection('sharing')}
              empty="Only you have access."
              isEmpty={memberCount === 0}
              isLoading={wsLoading}
              skeletonLines={2}
            >
              <p className="text-xs text-[var(--chat-muted)]">
                {memberCount} {memberCount === 1 ? 'member' : 'members'} with access.
              </p>
            </SidebarCard>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default ProjectNewChatHero;

interface SidebarCardProps {
  icon: React.ReactNode;
  title: string;
  count?: number;
  cta: string;
  onCta: () => void;
  empty: string;
  isEmpty: boolean;
  children?: React.ReactNode;
  isLoading?: boolean;
  skeletonLines?: number;
}

const SidebarCard: React.FC<SidebarCardProps> = ({ icon, title, count, cta, onCta, empty, isEmpty, children, isLoading, skeletonLines = 3 }) => (
  <section className="rounded-xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-4 shadow-sm shadow-black/5">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2 text-[var(--chat-text)]">
        <span className="text-[var(--chat-muted)]">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
        {typeof count === 'number' && !isLoading && (
          <span className="text-[11px] text-[var(--chat-muted)]">{count}</span>
        )}
        {isLoading && (
          <span className="h-3 w-6 rounded bg-[var(--chat-card-2)] animate-pulse" />
        )}
      </div>
    </div>
    <div className="mb-3 min-h-[1.5rem]">
      {isLoading ? (
        <div className="space-y-1.5" role="status" aria-label="Loading">
          {Array.from({ length: skeletonLines }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded bg-[var(--chat-card-2)] animate-pulse"
              style={{ width: `${90 - i * 12}%` }}
            />
          ))}
        </div>
      ) : isEmpty ? (
        <p className="text-xs text-[var(--chat-muted)] leading-relaxed">{empty}</p>
      ) : (
        children
      )}
    </div>
    <button
      type="button"
      onClick={onCta}
      disabled={isLoading}
      className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:text-brand-yellow transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {cta}
      <ChevronRight size={12} />
    </button>
  </section>
);