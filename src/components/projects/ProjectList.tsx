import React from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, Star, MoreHorizontal, Tag as TagIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Folder } from '@/hooks/supabase/useFolderOperations';
import type { FolderStat } from '@/hooks/supabase/useFolderStats';
import type { ProjectTag } from '@/hooks/supabase/useFolderTags';
import TagChip from './TagChip';
import FolderTagPicker from './FolderTagPicker';
import type { ProjectSort } from './ProjectsToolbar';

interface Props {
  folders: Folder[];
  stats: Record<string, FolderStat>;
  allTags: ProjectTag[];
  getTagsForFolder: (folderId: string) => ProjectTag[];
  onTogglePin: (folder: Folder) => void;
  onCreateTag: (name: string) => Promise<ProjectTag | null>;
  onAssignTag: (folderId: string, tagId: string) => void;
  onUnassignTag: (folderId: string, tagId: string) => void;
  sort: ProjectSort;
  sortDir: 'asc' | 'desc';
  onSortChange: (sort: ProjectSort) => void;
  onSortDirToggle: () => void;
}

function fmt(date: string | null | undefined) {
  if (!date) return '—';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const ProjectList: React.FC<Props> = ({ folders, stats, allTags, getTagsForFolder, onTogglePin, onCreateTag, onAssignTag, onUnassignTag, sort, sortDir, onSortChange, onSortDirToggle }) => {
  const SortHeader: React.FC<{ id: ProjectSort; label: string; className?: string }> = ({ id, label, className }) => {
    const active = sort === id;
    return (
      <TableHead className={`text-xs uppercase tracking-wider text-[var(--chat-muted)] ${className ?? ''}`}>
        <button
          type="button"
          onClick={() => active ? onSortDirToggle() : onSortChange(id)}
          className={`inline-flex items-center gap-1 hover:text-[var(--chat-text)] ${active ? 'text-[var(--chat-text)]' : ''}`}
          aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
        >
          {label}
          {active && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
        </button>
      </TableHead>
    );
  };
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--chat-border)] bg-[var(--chat-card)]">
      <Table>
        <TableHeader>
          <TableRow className="border-[var(--chat-border)] hover:bg-transparent">
            <SortHeader id="name" label="Name" />
            <SortHeader id="tags" label="Tags" />
            <TableHead className="text-xs uppercase tracking-wider text-[var(--chat-muted)]">Chats</TableHead>
            <SortHeader id="recent" label="Last activity" />
            <SortHeader id="created" label="Created" />
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {folders.map(folder => {
            const stat = stats[folder.id];
            const tags = getTagsForFolder(folder.id);
            const tagIds = new Set(tags.map(t => t.id));
            const lastActivity = stat?.lastChatAt || folder.updated_at;
            return (
              <TableRow key={folder.id} className="group border-[var(--chat-border)] hover:bg-[var(--ui-bg-hover)]">
                <TableCell>
                  <Link to={`/folder/${folder.id}`} className="flex items-center gap-2.5">
                    <FolderIcon
                      className="h-4 w-4 flex-shrink-0"
                      style={{ color: folder.color || '#3b82f6', fill: folder.color || '#3b82f6' }}
                    />
                    <span className="truncate text-sm font-medium text-[var(--chat-text)]">{folder.title}</span>
                    {folder.is_pinned && <Star className="h-3 w-3 fill-brand-yellow text-brand-yellow" />}
                  </Link>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {tags.length === 0 ? (
                      <span className="text-xs text-[var(--chat-muted)]">—</span>
                    ) : tags.map(t => <TagChip key={t.id} tag={t} size="xs" onRemove={() => onUnassignTag(folder.id, t.id)} />)}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-[var(--chat-text)]">{stat?.chatCount ?? 0}</TableCell>
                <TableCell className="text-sm text-[var(--chat-muted)]">{fmt(lastActivity)}</TableCell>
                <TableCell className="text-sm text-[var(--chat-muted)]">{fmt(folder.created_at)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--chat-muted)]" aria-label="Project options">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="border-[var(--chat-border)] bg-[var(--chat-card)] text-[var(--chat-text)]">
                      <DropdownMenuItem asChild><Link to={`/folder/${folder.id}`}>Open</Link></DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onTogglePin(folder)}>{folder.is_pinned ? 'Unpin' : 'Pin'}</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <FolderTagPicker
                        tags={allTags}
                        folderTagIds={tagIds}
                        onToggle={(tagId, assigned) => assigned ? onAssignTag(folder.id, tagId) : onUnassignTag(folder.id, tagId)}
                        onCreate={onCreateTag}
                        trigger={
                          <DropdownMenuItem onSelect={e => e.preventDefault()}>
                            <TagIcon className="mr-2 h-3.5 w-3.5" />
                            Tags…
                          </DropdownMenuItem>
                        }
                      />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProjectList;