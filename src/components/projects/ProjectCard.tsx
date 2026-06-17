import React from 'react';
import { Link } from 'react-router-dom';
import { FolderIcon, MoreHorizontal, Star, Tag as TagIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Folder } from '@/hooks/supabase/useFolderOperations';
import type { FolderStat } from '@/hooks/supabase/useFolderStats';
import type { ProjectTag } from '@/hooks/supabase/useFolderTags';
import TagChip from './TagChip';
import FolderTagPicker from './FolderTagPicker';

function formatRelative(date: string | null): string {
  if (!date) return '—';
  const d = new Date(date);
  const diffMs = Date.now() - d.getTime();
  const day = 86_400_000;
  if (diffMs < day) return 'Today';
  if (diffMs < 2 * day) return 'Yesterday';
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props {
  folder: Folder;
  stat?: FolderStat;
  folderTags: ProjectTag[];
  allTags: ProjectTag[];
  onTogglePin: () => void;
  onCreateTag: (name: string) => Promise<ProjectTag | null>;
  onAssignTag: (tagId: string) => void;
  onUnassignTag: (tagId: string) => void;
}

const ProjectCard: React.FC<Props> = ({ folder, stat, folderTags, allTags, onTogglePin, onCreateTag, onAssignTag, onUnassignTag }) => {
  const tagIds = new Set(folderTags.map(t => t.id));
  const lastActivity = stat?.lastChatAt || folder.updated_at;

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-4 transition-all hover:border-brand-yellow/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <Link to={`/folder/${folder.id}`} className="flex min-w-0 flex-1 items-start gap-3">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg"
            style={{ background: (folder.color || '#3b82f6') + '20' }}
          >
            <FolderIcon
              className="h-5 w-5"
              style={{ color: folder.color || '#3b82f6', fill: folder.color || '#3b82f6' }}
            />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-[var(--chat-text)]" title={folder.title}>
              {folder.title}
            </h3>
            <p className="mt-0.5 text-xs text-[var(--chat-muted)]">
              {stat?.chatCount ?? 0} {stat?.chatCount === 1 ? 'chat' : 'chats'} · {formatRelative(lastActivity)}
            </p>
          </div>
        </Link>

        <div className="flex items-center">
          {folder.is_pinned && <Star className="h-3.5 w-3.5 fill-brand-yellow text-brand-yellow" />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-[var(--chat-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                aria-label="Project options"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="border-[var(--chat-border)] bg-[var(--chat-card)] text-[var(--chat-text)]">
              <DropdownMenuItem asChild>
                <Link to={`/folder/${folder.id}`}>Open project</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePin}>
                {folder.is_pinned ? 'Unpin' : 'Pin'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <FolderTagPicker
                tags={allTags}
                folderTagIds={tagIds}
                onToggle={(tagId, assigned) => assigned ? onAssignTag(tagId) : onUnassignTag(tagId)}
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
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {folderTags.length === 0 ? (
          <FolderTagPicker
            tags={allTags}
            folderTagIds={tagIds}
            onToggle={(tagId, assigned) => assigned ? onAssignTag(tagId) : onUnassignTag(tagId)}
            onCreate={onCreateTag}
            trigger={
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--chat-border)] px-2 py-0.5 text-[10px] text-[var(--chat-muted)] hover:border-brand-yellow/40 hover:text-[var(--chat-text)]"
              >
                <TagIcon className="h-2.5 w-2.5" />
                Add tag
              </button>
            }
          />
        ) : folderTags.map(t => (
          <TagChip key={t.id} tag={t} size="xs" onRemove={() => onUnassignTag(t.id)} />
        ))}
      </div>
    </div>
  );
};

export default ProjectCard;