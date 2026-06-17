import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderOpen } from 'lucide-react';
import SavedChatsSidebar from '@/components/SavedChatsSidebar';
import MobileSidebarDrawer from '@/components/MobileSidebarDrawer';
import { useSidebarState } from '@/hooks/useSidebarState';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useFolders } from '@/context/FolderContext';
import { useFolderOperations } from '@/hooks/supabase/useFolderOperations';
import { useFolderTags } from '@/hooks/supabase/useFolderTags';
import { useFolderStats } from '@/hooks/supabase/useFolderStats';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import ProjectsToolbar, { ProjectSort, ProjectView } from '@/components/projects/ProjectsToolbar';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectList from '@/components/projects/ProjectList';
import type { Folder } from '@/hooks/supabase/useFolderOperations';

const LS = {
  view: 'projectsView',
  sort: 'projectsSort',
  dir: 'projectsSortDir',
};

const AllProjectsPageInner: React.FC = () => {
  const { user } = useAuth();
  const { folders, updateFolder, loadFolders, addFolder } = useFolders();
  const { createFolder } = useFolderOperations();
  const tagApi = useFolderTags();
  const { stats } = useFolderStats();

  const [view, setView] = useState<ProjectView>(() => (localStorage.getItem(LS.view) as ProjectView) || 'grid');
  const [sort, setSort] = useState<ProjectSort>(() => (localStorage.getItem(LS.sort) as ProjectSort) || 'recent');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(() => (localStorage.getItem(LS.dir) as 'asc' | 'desc') || 'desc');
  const [search, setSearch] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { localStorage.setItem(LS.view, view); }, [view]);
  useEffect(() => { localStorage.setItem(LS.sort, sort); }, [sort]);
  useEffect(() => { localStorage.setItem(LS.dir, sortDir); }, [sortDir]);

  const handleTogglePin = async (folder: Folder) => {
    if (!user?.id) return;
    const next = !folder.is_pinned;
    updateFolder(folder.id, { is_pinned: next });
    const { error } = await supabase.from('folders').update({ is_pinned: next }).eq('id', folder.id).eq('user_id', user.id);
    if (error) updateFolder(folder.id, { is_pinned: folder.is_pinned });
    else await loadFolders();
  };

  const handleCreate = async () => {
    const t = newTitle.trim();
    if (!t || creating) return;
    setCreating(true);
    const created = await createFolder(t);
    setCreating(false);
    if (created) {
      addFolder(created);
      setNewTitle('');
      setIsCreateOpen(false);
    }
  };

  const toggleTagFilter = (id: string) => {
    setSelectedTagIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    let arr = folders.filter(f => {
      if (q && !f.title.toLowerCase().includes(q)) return false;
      if (selectedTagIds.size > 0) {
        const ft = tagApi.getTagsForFolder(f.id).map(t => t.id);
        const hasAny = ft.some(id => selectedTagIds.has(id));
        if (!hasAny) return false;
      }
      return true;
    });
    const dir = sortDir === 'asc' ? 1 : -1;
    arr = [...arr].sort((a, b) => {
      switch (sort) {
        case 'name':
          return a.title.localeCompare(b.title) * dir;
        case 'created':
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
        case 'tags': {
          const at = tagApi.getTagsForFolder(a.id).map(t => t.name).join(',');
          const bt = tagApi.getTagsForFolder(b.id).map(t => t.name).join(',');
          if (!at && bt) return 1;
          if (at && !bt) return -1;
          return at.localeCompare(bt) * dir;
        }
        case 'recent':
        default: {
          const av = stats[a.id]?.lastChatAt || a.updated_at;
          const bv = stats[b.id]?.lastChatAt || b.updated_at;
          return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
        }
      }
    });
    // Pinned always float to top
    return arr.sort((a, b) => Number(b.is_pinned ?? false) - Number(a.is_pinned ?? false));
  }, [folders, search, selectedTagIds, sort, sortDir, stats, tagApi]);

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[var(--chat-bg)]">
      <header className="flex items-center justify-between border-b border-[var(--chat-border)] px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--chat-text)]">All Projects</h1>
          <p className="text-xs text-[var(--chat-muted)]">{folders.length} {folders.length === 1 ? 'project' : 'projects'}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90">
              <Plus className="mr-1 h-4 w-4" /> New project
            </Button>
          </DialogTrigger>
          <DialogContent className="border-[var(--chat-border)] bg-[var(--chat-card)] text-[var(--chat-text)]">
            <DialogHeader>
              <DialogTitle>New project</DialogTitle>
            </DialogHeader>
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleCreate(); } }}
              placeholder="Project name"
              className="bg-[var(--chat-input-bg)]"
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button
                disabled={!newTitle.trim() || creating}
                onClick={() => void handleCreate()}
                className="bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90"
              >
                {creating ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <ProjectsToolbar
        view={view}
        onViewChange={setView}
        sort={sort}
        onSortChange={setSort}
        sortDir={sortDir}
        onSortDirToggle={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
        search={search}
        onSearchChange={setSearch}
        tags={tagApi.tags}
        selectedTagIds={selectedTagIds}
        onToggleTagFilter={toggleTagFilter}
        onClearTagFilter={() => setSelectedTagIds(new Set())}
        tagApi={{
          onCreate: tagApi.createTag,
          onRename: tagApi.renameTag,
          onColor: tagApi.updateTagColor,
          onDelete: tagApi.deleteTag,
        }}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {folders.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <FolderOpen className="h-12 w-12 text-[var(--chat-muted)]" />
            <h2 className="text-base font-semibold text-[var(--chat-text)]">No projects yet</h2>
            <p className="max-w-sm text-sm text-[var(--chat-muted)]">Create a project from the sidebar to group related chats.</p>
            <Button asChild size="sm" className="bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90">
              <Link to="/chat"><Plus className="mr-1 h-4 w-4" /> Start a chat</Link>
            </Button>
          </div>
        ) : filteredSorted.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-sm text-[var(--chat-muted)]">
            No projects match your filters.
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredSorted.map(folder => (
              <ProjectCard
                key={folder.id}
                folder={folder}
                stat={stats[folder.id]}
                folderTags={tagApi.getTagsForFolder(folder.id)}
                allTags={tagApi.tags}
                onTogglePin={() => handleTogglePin(folder)}
                onCreateTag={tagApi.createTag}
                onAssignTag={(tagId) => tagApi.assignTag(folder.id, tagId)}
                onUnassignTag={(tagId) => tagApi.unassignTag(folder.id, tagId)}
              />
            ))}
          </div>
        ) : (
          <ProjectList
            folders={filteredSorted}
            stats={stats}
            allTags={tagApi.tags}
            getTagsForFolder={tagApi.getTagsForFolder}
            onTogglePin={handleTogglePin}
            onCreateTag={tagApi.createTag}
            onAssignTag={tagApi.assignTag}
            onUnassignTag={tagApi.unassignTag}
            sort={sort}
            sortDir={sortDir}
            onSortChange={setSort}
            onSortDirToggle={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
          />
        )}
      </div>
    </div>
  );
};

const AllProjectsPage: React.FC = () => {
  const { isOpen } = useSidebarState();
  const { user } = useAuth();
  const noop = () => {};
  return (
    <div className="relative flex h-screen-safe no-bounce w-full bg-[var(--chat-bg)]">
      <MobileSidebarDrawer onResumeChat={noop} onStartNewChat={noop} />
      <div
        className={`hidden sm:block h-full overflow-hidden ${user ? (isOpen ? 'w-[288px] shrink-0' : 'w-0 shrink') : 'w-[288px] shrink-0'}`}
        aria-hidden={user ? !isOpen : false}
      >
        <SavedChatsSidebar onResumeChat={noop} onStartNewChat={noop} />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AllProjectsPageInner />
      </div>
    </div>
  );
};

export default AllProjectsPage;