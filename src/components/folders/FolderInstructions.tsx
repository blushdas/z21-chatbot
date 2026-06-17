import React, { useEffect, useState } from 'react';
import { CheckCircle2, Lock, Save, Unlock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useFolderInstructions } from '@/hooks/supabase/useFolderInstructions';

type FolderInstructionsProps = {
  folderId: string;
};

const FolderInstructions: React.FC<FolderInstructionsProps> = ({ folderId }) => {
  const { instruction, isLoading, isSaving, save, toggleLock } = useFolderInstructions(folderId);
  const DEFAULT_PLACEHOLDER =
    'e.g. You are helping with this project. Use trusted sources first. Keep answers concise, direct, and grounded in saved context.';
  const [draft, setDraft] = useState('');
  const saved = instruction?.content ?? '';
  const isDirty = draft.trim() !== saved.trim();
  const isActive = saved.trim().length > 0;

  useEffect(() => {
    setDraft(instruction?.content ?? '');
  }, [instruction?.content]);

  if (isLoading) {
    return <div className="py-6 text-sm text-[var(--chat-muted)]">Loading instructions...</div>;
  }

  const isLocked = instruction?.is_locked ?? false;
  const lastEdited = instruction?.last_edited_at
    ? new Date(instruction.last_edited_at).toLocaleString()
    : null;
  const editor = instruction?.last_edited_by
    ? `${instruction.last_edited_by.slice(0, 8)}…${instruction.last_edited_by.slice(-4)}`
    : null;

  return (
    <section className="mx-auto max-w-5xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-heading text-xl font-semibold text-[var(--chat-text)]">Project instructions</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--chat-muted)]">
            This is the project system prompt. Daryle reads it before every chat in this folder.
          </p>
          {isActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/40 bg-green-500/15 px-2.5 py-1 text-xs text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Active — applied to every chat in this project
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs text-amber-400">
              <AlertCircle className="h-3.5 w-3.5" />
              Not yet active — type your instructions and click Save to apply
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isLocked && (
            <Badge variant="outline" className="border-[var(--chat-border)] bg-[var(--chat-card)] text-xs text-[var(--chat-muted)]">
              Locked
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLock}
            className="h-8 gap-1.5 text-xs text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)]"
            aria-label={isLocked ? 'Unlock project instructions' : 'Lock project instructions'}
          >
            {isLocked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            {isLocked ? 'Locked' : 'Lock'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--chat-border)] bg-[var(--chat-card)] p-3 shadow-sm shadow-black/5">
        <Textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          disabled={isLocked}
          placeholder={DEFAULT_PLACEHOLDER}
          className="min-h-[360px] resize-y rounded-xl border-[var(--chat-border)] bg-[var(--chat-input-bg)] p-4 font-mono text-sm leading-7 text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] disabled:cursor-not-allowed disabled:opacity-70"
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-[var(--chat-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 text-xs text-[var(--chat-muted)]">
          <p>{draft.length} characters</p>
          {lastEdited && <p>Last edited: {lastEdited}{editor ? ` by ${editor}` : ''}</p>}
        </div>
        <Button
          size="sm"
          onClick={() => save(draft)}
          disabled={isSaving || !isDirty || isLocked || draft.trim().length === 0}
          className="h-9 gap-2 bg-brand-yellow text-brand-blue hover:bg-brand-yellow/90 disabled:cursor-not-allowed disabled:bg-brand-yellow/35 disabled:text-brand-blue/60"
        >
          <Save className="h-3.5 w-3.5" />
          {isSaving ? 'Saving...' : 'Save Instructions'}
        </Button>
      </div>
    </section>
  );
};

export default FolderInstructions;
