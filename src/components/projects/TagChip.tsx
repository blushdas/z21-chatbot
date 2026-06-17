import React from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { ProjectTag } from '@/hooks/supabase/useFolderTags';

interface TagChipProps {
  tag: Pick<ProjectTag, 'name' | 'color'>;
  onRemove?: () => void;
  onClick?: () => void;
  selected?: boolean;
  size?: 'xs' | 'sm';
  className?: string;
}

const TagChip: React.FC<TagChipProps> = ({ tag, onRemove, onClick, selected, size = 'sm', className }) => {
  const dot = tag.color || 'hsl(var(--muted-foreground))';
  const Wrapper: React.ElementType = onClick ? 'button' : 'span';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-[var(--chat-border)] bg-[var(--chat-card)] text-[var(--chat-text)]',
        size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        selected && 'ring-1 ring-brand-yellow border-brand-yellow/50',
        onClick && 'hover:bg-[var(--ui-bg-hover)] cursor-pointer transition-colors',
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: dot }} aria-hidden />
      <span className="max-w-[140px] truncate">{tag.name}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-[var(--ui-bg-hover)]"
          aria-label={`Remove tag ${tag.name}`}
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </Wrapper>
  );
};

export default TagChip;