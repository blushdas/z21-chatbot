import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useFolderInstructions } from '@/hooks/supabase/useFolderInstructions';

interface FolderInstructionsProps {
  folderId: string;
}

const FolderInstructions: React.FC<FolderInstructionsProps> = ({ folderId }) => {
  const { instruction, isLoading, isSaving, save, toggleLock } = useFolderInstructions(folderId);
  const [draft, setDraft] = useState('');
  const isDirty = draft !== (instruction?.content ?? '');

  useEffect(() => {
    setDraft(instruction?.content ?? '');
  }, [instruction?.content]);

  if (isLoading) {
    return <div className="text-sm text-[var(--chat-muted)] py-4">Loading...</div>;
  }

  const isLocked = instruction?.is_locked ?? false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-[var(--chat-muted)]">
            These instructions influence every chat inside this project. They are prepended to the AI context.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isLocked && <Badge variant="secondary" className="text-xs">Locked</Badge>}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLock}
            className="h-8 gap-1 text-xs text-[var(--chat-muted)] hover:text-[var(--chat-text)]"
          >
            {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            {isLocked ? 'Locked' : 'Lock'}
          </Button>
        </div>
      </div>

      <Textarea
        value={draft}
        onChange={e => setDraft(e.target.value)}
        disabled={isLocked}
        placeholder="e.g. You are helping me with the Acme Corp project. Always reference our Q2 strategy doc. Tone: concise and direct."
        className="min-h-[200px] bg-[var(--chat-bg)] border-[var(--chat-border)] text-[var(--chat-text)] resize-y font-mono text-sm"
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--chat-muted)]">{draft.length} characters</p>
        <Button
          size="sm"
          onClick={() => save(draft)}
          disabled={isSaving || !isDirty || isLocked}
          className="gap-1"
        >
          <Save className="h-3 w-3" />
          {isSaving ? 'Saving...' : 'Save Instructions'}
        </Button>
      </div>
    </div>
  );
};

export default FolderInstructions;
