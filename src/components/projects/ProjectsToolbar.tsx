import React from 'react';
import { Search, Grid3x3, List, ArrowUpDown, ArrowUp, ArrowDown, Tags } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TagChip from './TagChip';
import TagManagerDialog from './TagManagerDialog';
import type { ProjectTag } from '@/hooks/supabase/useFolderTags';

export type ProjectSort = 'recent' | 'name' | 'created' | 'tags';
export type ProjectView = 'grid' | 'list';

interface Props {
  view: ProjectView;
  onViewChange: (v: ProjectView) => void;
  sort: ProjectSort;
  onSortChange: (s: ProjectSort) => void;
  sortDir: 'asc' | 'desc';
  onSortDirToggle: () => void;
  search: string;
  onSearchChange: (s: string) => void;
  tags: ProjectTag[];
  selectedTagIds: Set<string>;
  onToggleTagFilter: (id: string) => void;
  onClearTagFilter: () => void;
  tagApi: {
    onCreate: (name: string, color?: string | null) => Promise<ProjectTag | null>;
    onRename: (id: string, name: string) => Promise<boolean>;
    onColor: (id: string, color: string | null) => Promise<boolean>;
    onDelete: (id: string) => Promise<boolean>;
  };
}

const SORT_LABELS: Record<ProjectSort, string> = {
  recent: 'Most recent chat',
  name: 'Alphabetical',
  created: 'Created date',
  tags: 'Tags',
};

const ProjectsToolbar: React.FC<Props> = ({
  view, onViewChange, sort, onSortChange, sortDir, onSortDirToggle,
  search, onSearchChange, tags, selectedTagIds, onToggleTagFilter, onClearTagFilter, tagApi,
}) => {
  return (
    <div className="space-y-3 border-b border-[var(--chat-border)] bg-[var(--chat-bg)] px-6 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--chat-muted)]" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search projects…"
            className="h-9 bg-[var(--chat-input-bg)] pl-9 text-sm"
          />
        </div>

        <Select value={sort} onValueChange={(v) => onSortChange(v as ProjectSort)}>
          <SelectTrigger className="h-9 w-[180px] bg-[var(--chat-input-bg)] text-sm">
            <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-[var(--chat-border)] bg-[var(--chat-card)] text-[var(--chat-text)]">
            {(Object.keys(SORT_LABELS) as ProjectSort[]).map(k => (
              <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={onSortDirToggle} aria-label="Toggle sort direction">
          {sortDir === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
        </Button>

        <TagManagerDialog
          tags={tags}
          onCreate={tagApi.onCreate}
          onRename={tagApi.onRename}
          onColor={tagApi.onColor}
          onDelete={tagApi.onDelete}
          trigger={
            <Button variant="outline" size="sm" className="h-9 gap-1.5">
              <Tags className="h-4 w-4" />
              Manage tags
            </Button>
          }
        />

        <div className="ml-auto inline-flex rounded-md border border-[var(--chat-border)] bg-[var(--chat-card)] p-0.5">
          <button
            type="button"
            onClick={() => onViewChange('grid')}
            className={`flex h-8 w-8 items-center justify-center rounded ${view === 'grid' ? 'bg-[var(--ui-bg-hover)] text-[var(--chat-text)]' : 'text-[var(--chat-muted)]'}`}
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange('list')}
            className={`flex h-8 w-8 items-center justify-center rounded ${view === 'list' ? 'bg-[var(--ui-bg-hover)] text-[var(--chat-text)]' : 'text-[var(--chat-muted)]'}`}
            aria-label="List view"
            aria-pressed={view === 'list'}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-[var(--chat-muted)]">Filter:</span>
          {tags.map(t => (
            <TagChip
              key={t.id}
              tag={t}
              onClick={() => onToggleTagFilter(t.id)}
              selected={selectedTagIds.has(t.id)}
              size="xs"
            />
          ))}
          {selectedTagIds.size > 0 && (
            <button
              type="button"
              onClick={onClearTagFilter}
              className="text-[11px] text-[var(--chat-muted)] underline-offset-2 hover:underline"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectsToolbar;