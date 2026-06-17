import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart2,
  BookMarked,
  BookOpen,
  Brain,
  Clock,
  ExternalLink,
  Layers,
  Link as LinkIcon,
  MessageSquare,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import FolderInstructions from './FolderInstructions';
import FolderSources from './FolderSources';
import FolderMemory from './FolderMemory';
import FolderQuickLinks from './FolderQuickLinks';
import FolderKnowledge from './FolderKnowledge';
import FolderPermissions from './FolderPermissions';
import { useFolderWorkspace } from '@/hooks/supabase/useFolderWorkspace';
import { useFolderInstructions } from '@/hooks/supabase/useFolderInstructions';
import { useUserChatCategories } from '@/hooks/useUserChatCategories';

const STATUS_CLASSES: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25',
  paused: 'bg-brand-yellow/10 text-brand-yellow border-brand-yellow/30',
  archived: 'bg-[var(--chat-card)] text-[var(--chat-muted)] border-[var(--chat-border)]',
};

const SOURCE_STATUS_CLASSES: Record<string, string> = {
  approved: 'text-emerald-500 border-emerald-500/25 bg-emerald-500/10',
  reviewed: 'text-sky-500 border-sky-500/25 bg-sky-500/10',
  processing: 'text-indigo-500 border-indigo-500/25 bg-indigo-500/10',
  error: 'text-red-500 border-red-500/25 bg-red-500/10',
};

const VISIBILITY_LABELS: Record<string, string> = {
  private: 'Private',
  shared: 'Shared',
  admin_only: 'Admin Only',
  demo_only: 'Demo',
  archived: 'Archived',
};

const TABS = [
  { value: 'overview', label: 'Overview', icon: BarChart2 },
  { value: 'instructions', label: 'Instructions', icon: Settings },
  { value: 'sources', label: 'Sources', icon: Layers },
  { value: 'memory', label: 'Memory', icon: Brain },
  { value: 'knowledge', label: 'Knowledge', icon: BookMarked },
  { value: 'links', label: 'Quick Links', icon: LinkIcon },
  { value: 'members', label: 'Members', icon: Users },
];

type Props = {
  folderId: string;
};

// categoryLabel uses the user's custom list resolved inside the component.

function abbreviateId(id: string) {
  if (id.length <= 12) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function shortDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function compactLabel(value: string) {
  return value.replace(/_/g, ' ');
}

const FolderDashboard: React.FC<Props> = ({ folderId }) => {
  const navigate = useNavigate();
  const ws = useFolderWorkspace(folderId);
  const { instruction, isLoading: instructionsLoading } = useFolderInstructions(folderId);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [chatCategoryFilter, setChatCategoryFilter] = useState('all');
  const [chatSearch, setChatSearch] = useState('');
  const { categories: chatCategoriesList } = useUserChatCategories();
  const categoryLabel = (cat: string | null) =>
    chatCategoriesList.find(c => c.value === cat)?.label ?? null;

  if (ws.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center bg-[var(--chat-bg)] text-sm text-[var(--chat-muted)]">
        Loading project...
      </div>
    );
  }

  if (!ws.folder) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4 bg-[var(--chat-bg)] text-[var(--chat-text)]">
        <p className="text-sm text-[var(--chat-muted)]">Project not found.</p>
        <Button variant="ghost" size="sm" onClick={() => navigate('/chat')}>
          <ArrowLeft className="mr-1 h-3 w-3" /> Back to chats
        </Button>
      </div>
    );
  }

  const { folder } = ws;
  const openQuestions = ws.memory.filter(m => m.category === 'open_question' && m.status !== 'archived');
  const activeMemory = ws.memory.filter(m => (m.status ?? 'active') === 'active');
  const keySources = ws.sources.filter(source => source.status === 'approved').slice(0, 4);
  const approvedKnowledge = ws.knowledge.filter(item => item.status === 'approved').slice(0, 4);
  const recentDecisions = ws.knowledge.filter(item => item.type === 'decision').slice(0, 3);
  const filteredChats = ws.recentChats.filter(chat => {
    const matchesCategory = chatCategoryFilter === 'all' || chat.chat_category === chatCategoryFilter;
    const query = chatSearch.trim().toLowerCase();
    const matchesSearch = !query || (chat.title || 'Untitled Chat').toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const handleTitleSave = async () => {
    if (!titleDraft.trim()) return;
    await ws.updateFolder({ title: titleDraft.trim() });
    setEditingTitle(false);
  };

  const handleDescSave = async () => {
    await ws.updateFolder({ description: descDraft.trim() || null });
    setEditingDesc(false);
  };

  return (
    <div className="flex h-full flex-col bg-[var(--chat-bg)] font-body text-[var(--chat-text)]">
      <div className="border-b border-[var(--chat-border)] bg-[var(--chat-header-bg)]">
        <div className="mx-auto flex max-w-7xl items-start gap-4 px-6 py-6 lg:px-10">
          <Button
            variant="ghost"
            size="icon"
            className="mt-1 h-8 w-8 text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)]"
            onClick={() => navigate('/chat')}
            aria-label="Back to chats"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1 space-y-3">
            {editingTitle ? (
              <Input
                value={titleDraft}
                onChange={e => setTitleDraft(e.target.value)}
                autoFocus
                onBlur={handleTitleSave}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
                className="h-10 max-w-xl bg-[var(--chat-input-bg)] text-2xl font-semibold text-[var(--chat-text)]"
              />
            ) : (
              <button
                type="button"
                className="block max-w-xl truncate text-left font-heading text-2xl font-bold leading-tight text-[var(--chat-text)] hover:text-brand-blue dark:hover:text-brand-yellow"
                onClick={() => { setEditingTitle(true); setTitleDraft(folder.title); }}
              >
                {folder.title}
              </button>
            )}

            {editingDesc ? (
              <Textarea
                value={descDraft}
                onChange={e => setDescDraft(e.target.value)}
                autoFocus
                placeholder="Add a short project description"
                onBlur={handleDescSave}
                className="min-h-[72px] max-w-3xl resize-none bg-[var(--chat-input-bg)] text-sm text-[var(--chat-text)]"
              />
            ) : (
              <button
                type="button"
                className="block max-w-3xl truncate text-left text-base text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
                onClick={() => { setEditingDesc(true); setDescDraft(folder.description ?? ''); }}
              >
                {folder.description || 'Add a description...'}
              </button>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <Select value={folder.status} onValueChange={status => ws.updateFolder({ status })}>
                <SelectTrigger className={`h-8 w-[132px] rounded-lg border px-3 text-sm font-medium capitalize ${STATUS_CLASSES[folder.status] ?? STATUS_CLASSES.archived}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[var(--chat-border)] bg-[var(--chat-card)] text-[var(--chat-text)]">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <span className="rounded-full border border-[var(--chat-border)] bg-[var(--chat-bg)] px-3 py-1 text-sm font-medium text-[var(--chat-muted)]">
                {VISIBILITY_LABELS[folder.visibility] ?? folder.visibility}
              </span>
              {folder.tags?.slice(0, 3).map(tag => (
                <span key={tag} className="rounded-full bg-[var(--chat-bg)] px-2.5 py-1 text-xs text-[var(--chat-muted)]">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-4 pt-1 text-sm text-[var(--chat-muted)] sm:flex">
            <span className="flex items-center gap-1.5"><MessageSquare className="h-4 w-4" />{ws.recentChats.length}</span>
            <span className="flex items-center gap-1.5"><Layers className="h-4 w-4" />{ws.sources.length}</span>
            <span className="flex items-center gap-1.5"><Brain className="h-4 w-4" />{ws.memory.length}</span>
            <span className="flex items-center gap-1.5"><BookMarked className="h-4 w-4" />{ws.knowledge.length}</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-[var(--chat-border)] bg-[var(--chat-bg)]">
          <div className="mx-auto max-w-7xl overflow-x-auto px-6 lg:px-10">
            <TabsList className="h-auto justify-start gap-2 rounded-none bg-transparent py-3">
              {TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="h-9 rounded-lg px-3 text-sm font-medium text-[var(--chat-muted)] data-[state=active]:bg-[var(--chat-card)] data-[state=active]:text-[var(--chat-text)] data-[state=active]:shadow-none"
                  >
                    <Icon className="mr-1.5 h-4 w-4" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-6 lg:px-10">
            <TabsContent value="overview" className="mt-0 space-y-6">
              <section className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-4 shadow-sm shadow-black/5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[var(--ui-icon)]" />
                    <h2 className="font-heading text-lg font-semibold text-[var(--chat-text)]">Continue</h2>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-sm text-[var(--chat-muted)] hover:text-[var(--chat-text)]" onClick={() => navigate('/chat')}>
                    + New Chat
                  </Button>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 rounded-lg px-3 text-sm ${chatCategoryFilter === 'all' ? 'bg-brand-blue text-brand-offwhite hover:bg-brand-blue/90 hover:text-brand-offwhite' : 'border border-[var(--chat-border)] bg-[var(--chat-bg)] text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]'}`}
                    onClick={() => setChatCategoryFilter('all')}
                  >
                    All
                  </Button>
                  {chatCategoriesList.map(category => (
                    <Button
                      key={category.value}
                      variant="ghost"
                      size="sm"
                      className={`h-8 rounded-lg px-3 text-sm ${chatCategoryFilter === category.value ? 'bg-brand-blue text-brand-offwhite hover:bg-brand-blue/90 hover:text-brand-offwhite' : 'border border-[var(--chat-border)] bg-[var(--chat-bg)] text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]'}`}
                      onClick={() => setChatCategoryFilter(category.value)}
                    >
                      {category.label === 'Admin / Governance' ? 'Admin' : category.label}
                    </Button>
                  ))}
                </div>

                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--chat-muted)]" />
                  <Input
                    placeholder="Search chats..."
                    value={chatSearch}
                    onChange={e => setChatSearch(e.target.value)}
                    className="h-11 rounded-xl border-[var(--chat-border)] bg-[var(--chat-input-bg)] pl-9 text-[var(--chat-text)]"
                  />
                </div>

                <div className="space-y-2">
                  {ws.recentChats.length === 0 && (
                    <p className="rounded-xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-bg)] px-4 py-6 text-sm text-[var(--chat-muted)]">
                      No chats in this project yet. Start one from chat and attach it here.
                    </p>
                  )}
                  {ws.recentChats.length > 0 && filteredChats.length === 0 && (
                    <p className="rounded-xl border border-dashed border-[var(--chat-border)] bg-[var(--chat-bg)] px-4 py-6 text-sm text-[var(--chat-muted)]">
                      No chats match this filter.
                    </p>
                  )}
                  {filteredChats.slice(0, 6).map(chat => (
                    <button
                      key={chat.id}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg)] px-4 py-3 text-left transition-colors hover:border-brand-yellow/30 hover:bg-[var(--ui-bg-hover)]"
                      onClick={() => navigate(`/chat/${chat.id}`)}
                    >
                      <MessageSquare className="h-4 w-4 flex-shrink-0 text-[var(--ui-icon)]" />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--chat-text)]">{chat.title || 'Untitled Chat'}</span>
                      {chat.chat_category && <span className="hidden text-xs text-[var(--chat-muted)] sm:inline">{categoryLabel(chat.chat_category)}</span>}
                      <span className="flex items-center gap-1 text-xs text-[var(--chat-muted)]"><Clock className="h-3.5 w-3.5" />{shortDate(chat.updated_at) ?? 'Recent'}</span>
                    </button>
                  ))}
                </div>
              </section>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                <section className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-4 shadow-sm shadow-black/5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-[var(--ui-icon)]" />
                      <h2 className="font-heading text-lg font-semibold text-[var(--chat-text)]">Project context</h2>
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 text-sm text-[var(--chat-muted)]" onClick={() => setActiveTab('instructions')}>
                      Edit
                    </Button>
                  </div>

                  <div className="divide-y divide-[var(--chat-border)] rounded-xl border border-[var(--chat-border)] bg-[var(--chat-bg)]">
                    <div className="p-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--chat-muted)]">Instructions</p>
                      <p className="font-mono text-sm leading-relaxed text-[var(--chat-muted)]">
                        {instructionsLoading
                          ? 'Loading instructions...'
                          : instruction?.content?.trim()
                            ? `${instruction.content.slice(0, 220)}${instruction.content.length > 220 ? '…' : ''}`
                            : 'Add the operating instructions Daryle should follow in this project.'}
                      </p>
                    </div>

                    <div className="p-4">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--chat-muted)]">Key sources</p>
                      {keySources.length === 0 ? (
                        <p className="text-sm text-[var(--chat-muted)]">Add the docs this project can trust.</p>
                      ) : keySources.map(source => (
                        <div key={source.id} className="flex items-center gap-3 py-2">
                          <Layers className="h-4 w-4 flex-shrink-0 text-[var(--ui-icon)]" />
                          <span className="min-w-0 flex-1 truncate text-sm text-[var(--chat-text)]">{source.title}</span>
                          <span className="text-xs capitalize text-[var(--chat-muted)]">{compactLabel(source.type)}</span>
                          <Badge variant="outline" className={`text-[10px] capitalize ${SOURCE_STATUS_CLASSES[source.status] ?? 'border-[var(--chat-border)] text-[var(--chat-muted)]'}`}>{compactLabel(source.status)}</Badge>
                          {source.url && (
                            <a href={source.url} target="_blank" rel="noreferrer" className="text-[var(--chat-muted)] hover:text-[var(--chat-text)]" onClick={e => e.stopPropagation()} aria-label={`Open ${source.title}`}>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="p-4">
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--chat-muted)]">Approved knowledge</p>
                      {approvedKnowledge.length === 0 ? (
                        <p className="text-sm text-[var(--chat-muted)]">Promote strong answers into reusable context.</p>
                      ) : approvedKnowledge.map(item => (
                        <div key={item.id} className="py-2">
                          <p className="text-sm text-[var(--chat-text)] line-clamp-2">{item.content}</p>
                          <p className="mt-1 text-xs capitalize text-[var(--chat-muted)]">{compactLabel(item.type)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-4 shadow-sm shadow-black/5">
                  <div className="mb-4 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-[var(--ui-icon)]" />
                    <h2 className="font-heading text-lg font-semibold text-[var(--chat-text)]">Open loops</h2>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--chat-muted)]">Recent decisions</p>
                      {recentDecisions.length === 0 ? (
                        <p className="text-sm text-[var(--chat-muted)]">No decisions saved yet.</p>
                      ) : recentDecisions.map(decision => (
                        <p key={decision.id} className="border-b border-[var(--chat-border)] py-2 text-sm text-[var(--chat-text)] last:border-b-0 line-clamp-2">{decision.content}</p>
                      ))}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--chat-muted)]">Open questions</p>
                      {openQuestions.length === 0 ? (
                        <p className="text-sm text-[var(--chat-muted)]">No open questions saved yet.</p>
                      ) : openQuestions.slice(0, 3).map(q => (
                        <p key={q.id} className="border-b border-[var(--chat-border)] py-2 text-sm text-[var(--chat-text)] last:border-b-0">{q.content}</p>
                      ))}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--chat-muted)]">Memory</p>
                      {activeMemory.length === 0 ? (
                        <p className="text-sm text-[var(--chat-muted)]">Save decisions Daryle should remember.</p>
                      ) : <p className="text-sm text-[var(--chat-muted)]">{activeMemory.length} active memory item{activeMemory.length === 1 ? '' : 's'}</p>}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--chat-muted)]">Members</p>
                      {ws.members.length === 0 ? (
                        <p className="text-sm text-[var(--chat-muted)]">No shared members yet.</p>
                      ) : ws.members.slice(0, 4).map(member => (
                        <div key={member.id} className="flex items-center justify-between py-2 text-sm">
                          <span className="font-mono text-[var(--chat-text)]">{abbreviateId(member.user_id)}</span>
                          <span className="capitalize text-[var(--chat-muted)]">{member.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </div>
            </TabsContent>

            <TabsContent value="instructions" className="mt-0">
              <FolderInstructions folderId={folderId} />
            </TabsContent>

            <TabsContent value="sources" className="mt-0">
              <FolderSources folderId={folderId} sources={ws.sources} onAdd={ws.addSource} onDelete={ws.deleteSource} onUpdateStatus={ws.updateSourceStatus} />
            </TabsContent>

            <TabsContent value="memory" className="mt-0">
              <FolderMemory memory={ws.memory} onAdd={ws.addMemory} onUpdate={ws.updateMemory} onUpdateStatus={ws.updateMemoryStatus} onDelete={ws.deleteMemory} />
            </TabsContent>

            <TabsContent value="knowledge" className="mt-0">
              <FolderKnowledge knowledge={ws.knowledge} onDelete={ws.deleteKnowledge} onUpdateStatus={ws.updateKnowledgeStatus} />
            </TabsContent>

            <TabsContent value="links" className="mt-0">
              <FolderQuickLinks quickLinks={ws.quickLinks} onAdd={ws.addQuickLink} onUpdate={ws.updateQuickLink} onDelete={ws.deleteQuickLink} />
            </TabsContent>

            <TabsContent value="members" className="mt-0">
              {ws.folder && <FolderPermissions folder={ws.folder} members={ws.members} onAdd={ws.addMember} onUpdateRole={ws.updateMemberRole} onRemove={ws.removeMember} onUpdateFolder={ws.updateFolder} />}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default FolderDashboard;
