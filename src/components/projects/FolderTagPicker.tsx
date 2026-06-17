import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { ProjectTag } from '@/hooks/supabase/useFolderTags';

interface Props {
  trigger: React.ReactNode;
  tags: ProjectTag[];
  folderTagIds: Set<string>;
  onToggle: (tagId: string, assigned: boolean) => void;
  onCreate: (name: string) => Promise<ProjectTag | null>;
}

const FolderTagPicker: React.FC<Props> = ({ trigger, tags, folderTagIds, onToggle, onCreate }) => {
  const [query, setQuery] = useState('');
  const filtered = tags.filter(t => t.name.toLowerCase().includes(query.toLowerCase()));
  const canCreate = query.trim().length > 0 && !tags.some(t => t.name.toLowerCase() === query.trim().toLowerCase());

  const handleCreate = async () => {
    const created = await onCreate(query.trim());
    if (created) {
      onToggle(created.id, true);
      setQuery('');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-64 border-[var(--chat-border)] bg-[var(--chat-card)] p-2 text-[var(--chat-text)]">
        <Input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Find or create tag…"
          className="mb-2 h-8 bg-[var(--chat-input-bg)] text-sm"
          onKeyDown={e => { if (e.key === 'Enter' && canCreate) { e.preventDefault(); void handleCreate(); } }}
        />
        <div className="max-h-60 space-y-0.5 overflow-y-auto">
          {filtered.map(t => {
            const assigned = folderTagIds.has(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToggle(t.id, !assigned)}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-[var(--ui-bg-hover)]"
              >
                <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ background: t.color || 'hsl(var(--muted-foreground))' }} />
                <span className="flex-1 truncate">{t.name}</span>
                {assigned && <Check className="h-3.5 w-3.5 text-brand-yellow" />}
              </button>
            );
          })}
          {filtered.length === 0 && !canCreate && (
            <p className="px-2 py-1.5 text-xs text-[var(--chat-muted)]">No tags yet.</p>
          )}
        </div>
        {canCreate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCreate}
            className="mt-1 w-full justify-start gap-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Create "{query.trim()}"
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default FolderTagPicker;