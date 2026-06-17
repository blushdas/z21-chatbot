import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useChatCanvases, createBlankCanvas, deleteCanvas, autoTitleCanvasFromChat, type Canvas } from '@/hooks/useCanvas';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  chatId: string | null;
  activeCanvasId: string;
}

const CanvasTabs: React.FC<Props> = ({ chatId, activeCanvasId }) => {
  const { canvases, refresh } = useChatCanvases(chatId);
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Canvas | null>(null);

  // Pick up async title updates (e.g. AI auto-titling after canvas creation).
  useEffect(() => {
    const handler = () => { void refresh(); };
    window.addEventListener('canvas:titleUpdated', handler);
    return () => window.removeEventListener('canvas:titleUpdated', handler);
  }, [refresh]);

  const selectCanvas = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('canvas', id);
    setSearchParams(next, { replace: true });
  };

  const handleNew = async () => {
    if (!user || !chatId || creating) return;
    setCreating(true);
    // Leave the title blank — CanvasPanel will auto-name the canvas from its
    // contents once the user adds enough text.
    const c = await createBlankCanvas(user.id, chatId, 'Untitled canvas');
    setCreating(false);
    if (!c) {
      toast.error('Could not create canvas');
      return;
    }
    await refresh();
    selectCanvas(c.id);
    // Fire-and-forget: name the new canvas based on the chat's recent
    // conversation so the tab reflects context instead of "Untitled".
    void autoTitleCanvasFromChat(c.id, chatId).then(() => { void refresh(); });
  };

  const requestClose = (e: React.MouseEvent, c: Canvas) => {
    e.stopPropagation();
    e.preventDefault();
    setPendingDelete(c);
  };

  const confirmClose = async () => {
    const c = pendingDelete;
    if (!c) return;
    setPendingDelete(null);
    await deleteCanvas(c.id);
    await refresh();
    if (c.id === activeCanvasId) {
      // Switch to next available or close panel.
      const remaining = canvases.filter((x) => x.id !== c.id);
      const next = new URLSearchParams(searchParams);
      if (remaining[0]) next.set('canvas', remaining[0].id);
      else next.delete('canvas');
      setSearchParams(next, { replace: true });
    }
  };

  // Hide when only one canvas and no chat (nothing to switch).
  if (!chatId) return null;

  return (
    <div
      role="tablist"
      aria-label="Canvases in this chat"
      className="relative flex shrink-0 items-end gap-1 overflow-x-auto border-b border-border bg-muted/40 px-2 pt-1.5 text-xs"
    >
      {canvases.map((c) => {
        const isActive = c.id === activeCanvasId;
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => selectCanvas(c.id)}
            className={`group relative flex max-w-[200px] items-center gap-1.5 rounded-t-md border px-3 py-1.5 transition-colors ${
              isActive
                ? 'z-10 -mb-px border-border border-b-background bg-background font-semibold text-foreground shadow-[0_-1px_0_0_hsl(var(--border))]'
                : 'border-transparent bg-muted/60 text-muted-foreground hover:bg-muted'
            }`}
            title={c.title || 'Untitled canvas'}
          >
            <span
              aria-hidden
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                isActive ? 'bg-primary' : 'bg-muted-foreground/40'
              }`}
            />
            <span className="truncate">{c.title || 'Untitled canvas'}</span>
            <span
              role="button"
              tabIndex={-1}
              aria-label="Close canvas"
              onClick={(e) => requestClose(e, c)}
              className="rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={handleNew}
        disabled={creating}
        className="mb-px ml-1 flex items-center gap-1 rounded-t-md border border-dashed border-border bg-background/40 px-2 py-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-50"
        title="New canvas in this chat — Alpha: canvases are in alpha testing, expect minor issues and changes"
      >
        <Plus className="h-3 w-3" />
        New canvas
      </button>
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDelete?.title || 'Untitled canvas'}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. The canvas and its version history will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmClose()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CanvasTabs;