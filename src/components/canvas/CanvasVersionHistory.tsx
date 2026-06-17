import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Loader2, RotateCcw, Trash2, History } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCanvasVersions,
  deleteCanvasVersion,
  type CanvasVersion,
  type CanvasVersionSource,
} from '@/hooks/useCanvasVersions';

interface Props {
  canvasId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (version: CanvasVersion) => Promise<void> | void;
}

const sourceLabel: Record<CanvasVersionSource, string> = {
  autosave: 'Autosave',
  manual: 'Manual save',
  'ai-edit': 'AI edit',
  restore: 'Restored',
};

const CanvasVersionHistory: React.FC<Props> = ({ canvasId, open, onOpenChange, onRestore }) => {
  const { versions, loading, refresh } = useCanvasVersions(open ? canvasId : undefined);
  const [selected, setSelected] = useState<CanvasVersion | null>(null);
  const [restoring, setRestoring] = useState(false);

  React.useEffect(() => {
    if (open) void refresh();
    if (!open) setSelected(null);
  }, [open, refresh]);

  const handleRestore = async (v: CanvasVersion) => {
    setRestoring(true);
    try {
      await onRestore(v);
      toast.success('Version restored');
      onOpenChange(false);
    } catch {
      toast.error('Could not restore version');
    } finally {
      setRestoring(false);
    }
  };

  const handleDelete = async (v: CanvasVersion) => {
    await deleteCanvasVersion(v.id);
    if (selected?.id === v.id) setSelected(null);
    void refresh();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            Version history
          </SheetTitle>
        </SheetHeader>
        <div className="flex min-h-0 flex-1">
          <div className="w-1/2 border-r">
            <ScrollArea className="h-full">
              {loading && (
                <div className="flex items-center justify-center p-6">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!loading && versions.length === 0 && (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No versions yet. Snapshots are saved as you edit.
                </div>
              )}
              <ul className="divide-y">
                {versions.map((v) => {
                  const isActive = selected?.id === v.id;
                  return (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => setSelected(v)}
                        className={`group flex w-full flex-col gap-0.5 px-3 py-2 text-left text-xs hover:bg-accent ${
                          isActive ? 'bg-accent' : ''
                        }`}
                      >
                        <span className="font-medium text-foreground">
                          {formatDistanceToNow(new Date(v.created_at), { addSuffix: true })}
                        </span>
                        <span className="text-muted-foreground">
                          {sourceLabel[v.source] ?? v.source} · {new Date(v.created_at).toLocaleString()}
                        </span>
                        <span className="truncate text-muted-foreground/80">{v.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </div>
          <div className="flex w-1/2 flex-col">
            {selected ? (
              <>
                <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
                  <div className="min-w-0 text-xs">
                    <div className="truncate font-medium">{selected.title}</div>
                    <div className="text-muted-foreground">
                      {new Date(selected.created_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 gap-1 px-2 text-xs"
                      disabled={restoring}
                      onClick={() => handleRestore(selected)}
                    >
                      {restoring ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <RotateCcw className="h-3 w-3" />
                      )}
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDelete(selected)}
                      title="Delete this snapshot"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <pre className="whitespace-pre-wrap break-words px-3 py-2 text-xs text-foreground/90">
                    {selected.content_plaintext || '(empty)'}
                  </pre>
                </ScrollArea>
              </>
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                Select a version to preview and restore.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default CanvasVersionHistory;