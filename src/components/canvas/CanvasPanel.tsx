import React, { useState, useCallback, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { useCanvas, useChatCanvases, renameCanvas, autoTitleCanvas, deleteCanvas } from '@/hooks/useCanvas';
import { useCanvasAutosave } from '@/hooks/useCanvasAutosave';
import { useCanvasAIEdit, getApplyMode, setApplyMode, type ApplyMode } from '@/hooks/useCanvasAIEdit';
import {
  snapshotCanvasVersion,
  useSnapshotOnSave,
  type CanvasVersion,
} from '@/hooks/useCanvasVersions';
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { tiptapToPlainText } from '@/lib/canvas/markdownToTiptap';
import { sliceToHtml } from '@/lib/canvas/proseDiff';
import { applyCanvasOperations, type CanvasOperation } from '@/lib/canvasPatch';
import CanvasEditor from './CanvasEditor';
import CanvasAIBubbleMenu from './CanvasAIBubbleMenu';
import CanvasSuggestionCard from './CanvasSuggestionCard';
import CanvasVersionHistory from './CanvasVersionHistory';
import CanvasTabs from './CanvasTabs';
import AlphaBadge from './AlphaBadge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Wand2, History, Copy, Download, AlertTriangle, FileQuestion, RotateCw, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSearchParams } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  buildExportHtml,
  copyCanvasRichText,
  downloadBlob,
  printHtmlAsPdf,
  sanitizeFilename,
  downloadBlobObject,
  htmlToMarkdown,
  htmlToDocxBlob,
} from '@/lib/canvas/exportCanvas';

interface Props {
  canvasId: string;
}

const CanvasPanel: React.FC<Props> = ({ canvasId }) => {
  const { canvas, loading, error, reload } = useCanvas(canvasId);
  const { canvases: chatCanvases, refresh: refreshCanvases } = useChatCanvases(
    (canvas as { chat_id?: string | null } | null)?.chat_id ?? null,
  );
  const [, setSearchParams] = useSearchParams();
  const [doc, setDoc] = useState<unknown>(null);
  const [title, setTitle] = useState('');
  const { status, lastSavedAt } = useCanvasAutosave(canvasId, doc);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [applyMode, setApplyModeState] = useState<ApplyMode>(() => getApplyMode());
  const { runEdit, loading: aiLoading } = useCanvasAIEdit();
  const [suggestion, setSuggestion] = useState<
    | { html: string; from: number; to: number; beforeHtml: string }
    | null
  >(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [rewriteOpen, setRewriteOpen] = useState(false);
  const [rewriteInstruction, setRewriteInstruction] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const { user } = useAuth();
  const autoTitleAttemptedRef = useRef(false);
  const autoTitleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [chatContext, setChatContext] = useState<{
    chatId: string | null;
    recentMessages: Array<{ role: string; content: string }>;
    originatingMessageId: string | null;
  }>({ chatId: null, recentMessages: [], originatingMessageId: null });
  const docRef = useRef<unknown>(null);
  const titleRef = useRef<string>('');
  docRef.current = doc;
  titleRef.current = title;

  useSnapshotOnSave(canvasId, status, () => {
    if (docRef.current == null) return null;
    return { title: titleRef.current || 'Untitled canvas', contentJson: docRef.current };
  }, { minIntervalMs: 15_000 });

  React.useEffect(() => {
    if (canvas) {
      setDoc(canvas.content_json);
      setTitle(canvas.title);
    }
  }, [canvas]);

  // Reflect AI-generated title updates pushed from createCanvasFromMarkdown.
  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ canvasId?: string; title?: string }>).detail;
      if (!detail || detail.canvasId !== canvasId || !detail.title) return;
      setTitle(detail.title);
    };
    window.addEventListener('canvas:titleUpdated', handler);
    return () => window.removeEventListener('canvas:titleUpdated', handler);
  }, [canvasId]);

  // Load recent chat messages so AI edits understand the conversation
  // that produced this canvas.
  React.useEffect(() => {
    if (!canvas?.chat_id) {
      setChatContext({ chatId: null, recentMessages: [], originatingMessageId: null });
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from('chats')
        .select('messages')
        .eq('id', canvas.chat_id)
        .maybeSingle();
      if (cancelled) return;
      const raw = (data?.messages ?? []) as Array<{ role?: string; content?: string }>;
      const recent = Array.isArray(raw)
        ? raw
            .slice(-6)
            .map((m) => ({
              role: typeof m?.role === 'string' ? m.role : 'user',
              content: typeof m?.content === 'string' ? m.content : '',
            }))
            .filter((m) => m.content.length > 0)
        : [];
      setChatContext({
        chatId: canvas.chat_id,
        recentMessages: recent,
        originatingMessageId: canvas.created_from_message_id ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [canvas?.chat_id, canvas?.created_from_message_id]);

  React.useEffect(() => {
    if (!editor) return;
    const update = () => {
      const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n').trim();
      setIsEmpty(text.length === 0);
      // Expose current HTML so the chat composer can include it when routing
      // edit-intent messages through the canvas-chat-edit edge function.
      try {
        const w = window as unknown as { __canvasHtml?: Record<string, string> };
        w.__canvasHtml = w.__canvasHtml || {};
        w.__canvasHtml[canvasId] = editor.getHTML();
      } catch { /* noop */ }
      // Auto-name still-untitled canvases once content is substantive.
      const currentTitle = (titleRef.current || '').trim().toLowerCase();
      const untitled = currentTitle === '' || currentTitle === 'untitled canvas';
      if (untitled && !autoTitleAttemptedRef.current && text.length >= 80) {
        autoTitleAttemptedRef.current = true;
        if (autoTitleTimerRef.current) clearTimeout(autoTitleTimerRef.current);
        autoTitleTimerRef.current = setTimeout(() => {
          void autoTitleCanvas(canvasId, text).catch(() => {
            // Allow another attempt on failure.
            autoTitleAttemptedRef.current = false;
          });
        }, 1500);
      }
    };
    update();
    editor.on('update', update);
    return () => {
      editor.off('update', update);
      if (autoTitleTimerRef.current) clearTimeout(autoTitleTimerRef.current);
      try {
        const w = window as unknown as { __canvasHtml?: Record<string, string> };
        if (w.__canvasHtml) delete w.__canvasHtml[canvasId];
      } catch { /* noop */ }
    };
  }, [editor, canvasId]);

  // Listen for chat-driven canvas patches: ChatInterface dispatches
  // `canvas:apply-patch` when the user sends an edit-intent message while
  // this canvas is open.
  React.useEffect(() => {
    if (!editor) return;
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ canvasId: string; operations: CanvasOperation[] }>).detail;
      if (!detail || detail.canvasId !== canvasId) return;
      const applied = applyCanvasOperations(editor, detail.operations || []);
      if (applied === 0) toast.error("Couldn't apply canvas update.");
    };
    window.addEventListener('canvas:apply-patch', handler as EventListener);
    return () => window.removeEventListener('canvas:apply-patch', handler as EventListener);
  }, [editor, canvasId]);

  const onTitleBlur = useCallback(async () => {
    if (canvas && title.trim() && title !== canvas.title) {
      const next = title.trim();
      await renameCanvas(canvas.id, next);
      window.dispatchEvent(new CustomEvent('canvas:titleUpdated', { detail: { canvasId: canvas.id, title: next } }));
    }
  }, [canvas, title]);

  const saveSnapshot = useCallback(async () => {
    if (!user || docRef.current == null) return;
    await snapshotCanvasVersion({
      canvasId,
      ownerId: user.id,
      title: titleRef.current || 'Untitled canvas',
      contentJson: docRef.current,
      source: 'manual',
    });
    toast.success('Snapshot saved');
  }, [canvasId, user]);

  const openHistory = useCallback(async () => {
    // Snapshot the current state so the most recent edits are always visible
    // in version history (autosave throttle would otherwise hide them).
    if (user && docRef.current != null) {
      try {
        await snapshotCanvasVersion({
          canvasId,
          ownerId: user.id,
          title: titleRef.current || 'Untitled canvas',
          contentJson: docRef.current,
          source: 'manual',
        });
      } catch (e) {
        console.warn('Pre-history snapshot failed', e);
      }
    }
    setHistoryOpen(true);
  }, [canvasId, user]);

  const restoreVersion = useCallback(
    async (version: CanvasVersion) => {
      if (!user || !editor) return;
      // Snapshot current state first so the restore itself is reversible
      if (docRef.current != null) {
        await snapshotCanvasVersion({
          canvasId,
          ownerId: user.id,
          title: titleRef.current || 'Untitled canvas',
          contentJson: docRef.current,
          source: 'restore',
        });
      }
      editor
        .chain()
        .focus()
        .setContent(version.content_json as never, { parseOptions: { preserveWhitespace: 'full' } })
        .run();
      const plain = tiptapToPlainText(version.content_json);
      await supabase
        .from('canvases')
        .update({
          content_json: version.content_json as never,
          content_plaintext: plain,
          title: version.title,
        })
        .eq('id', canvasId);
      setTitle(version.title);
    },
    [canvasId, user, editor],
  );

  const handleCopy = useCallback(async () => {
    if (!editor) return;
    setCopying(true);
    try {
      await copyCanvasRichText(editor);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Copy failed');
    } finally {
      setCopying(false);
    }
  }, [editor]);

  const handleExportMarkdown = useCallback(() => {
    if (!editor) return;
    const md = htmlToMarkdown(editor.getHTML());
    const titled = `# ${titleRef.current || 'Canvas'}\n\n${md}`;
    downloadBlob(`${sanitizeFilename(titleRef.current)}.md`, 'text/markdown;charset=utf-8', titled);
  }, [editor]);

  const handleExportDocx = useCallback(async () => {
    if (!editor) return;
    try {
      const blob = await htmlToDocxBlob(titleRef.current || 'Canvas', editor.getHTML());
      downloadBlobObject(`${sanitizeFilename(titleRef.current)}.docx`, blob);
    } catch (e) {
      console.error('DOCX export failed', e);
    }
  }, [editor]);

  const handleExportPdf = useCallback(() => {
    if (!editor) return;
    const html = buildExportHtml(titleRef.current || 'Canvas', editor.getHTML());
    printHtmlAsPdf(html);
  }, [editor]);

  const performDeleteCanvas = useCallback(async () => {
    if (!canvas) return;
    try {
      await deleteCanvas(canvas.id);
      toast.success('Canvas deleted');
      await refreshCanvases();
      const remaining = chatCanvases.filter((x) => x.id !== canvas.id);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (remaining[0]) next.set('canvas', remaining[0].id);
        else next.delete('canvas');
        return next;
      }, { replace: true });
    } catch (e) {
      console.error('Delete canvas failed', e);
      toast.error('Could not delete canvas');
    }
  }, [canvas, chatCanvases, refreshCanvases, setSearchParams]);

  const toggleApplyMode = () => {
    const next: ApplyMode = applyMode === 'direct' ? 'suggest' : 'direct';
    setApplyMode(next);
    setApplyModeState(next);
  };

  const handleProposeSelection = (html: string, from: number, to: number) => {
    const beforeHtml = editor ? sliceToHtml(editor.schema, editor.state.doc, from, to) : '';
    setSuggestion({ html, from, to, beforeHtml });
  };

  const acceptSuggestion = () => {
    if (!editor || !suggestion) return;
    editor
      .chain()
      .focus()
      .insertContentAt({ from: suggestion.from, to: suggestion.to }, suggestion.html, {
        parseOptions: { preserveWhitespace: false },
      })
      .run();
    setSuggestion(null);
  };

  const rewriteWholeDoc = () => {
    if (!editor) return;
    setRewriteInstruction('');
    setRewriteOpen(true);
  };

  const submitRewrite = async () => {
    if (!editor) return;
    const instruction = rewriteInstruction.trim();
    if (!instruction) return;
    const fullText = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n');
    setRewriteOpen(false);
    const result = await runEdit({
      canvasId,
      mode: 'document',
      action: 'custom',
      instruction,
      fullText,
      chatId: chatContext.chatId,
      recentMessages: chatContext.recentMessages,
      originatingMessageId: chatContext.originatingMessageId,
    });
    if (!result) return;
    if (applyMode === 'direct') {
      editor.chain().focus().setContent(result.html, { parseOptions: { preserveWhitespace: false } }).run();
    } else {
      setSuggestion({
        html: result.html,
        from: 0,
        to: editor.state.doc.content.size,
        beforeHtml: editor.getHTML(),
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-background" aria-busy="true" aria-live="polite">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
          <div className="h-6 w-64 animate-pulse rounded bg-muted" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-14 animate-pulse rounded bg-muted" />
            <div className="h-6 w-16 animate-pulse rounded bg-muted" />
            <div className="h-6 w-16 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="flex-1 space-y-3 p-6">
          <div className="h-7 w-2/3 animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <span className="sr-only">Loading canvas…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-6">
        <div className="max-w-sm rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-center">
          <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-destructive" />
          <h2 className="text-sm font-medium text-foreground">Couldn't load this canvas</h2>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={reload}>
            <RotateCw className="h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!canvas) {
    return (
      <div className="flex h-full items-center justify-center bg-background p-6">
        <div className="max-w-sm rounded-lg border border-border bg-card p-5 text-center">
          <FileQuestion className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
          <h2 className="text-sm font-medium text-foreground">Canvas not found</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            It may have been deleted, or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  if (doc === null) {
    // Canvas record loaded, editor doc still being hydrated.
    return (
      <div className="flex h-full items-center justify-center bg-background" aria-busy="true">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="sr-only">Preparing editor…</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <CanvasTabs chatId={canvas.chat_id} activeCanvasId={canvas.id} />
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={onTitleBlur}
            className="h-8 max-w-xl border-none bg-transparent text-base font-medium shadow-none focus-visible:ring-0"
          />
          <AlphaBadge />
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 p-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleCopy}
                    disabled={copying || !editor || isEmpty}
                    aria-label="Copy canvas as rich text"
                  >
                    {copying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isEmpty ? 'Nothing to copy' : 'Copy as rich text'}</TooltipContent>
              </Tooltip>
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={!editor || isEmpty}
                        aria-label="Download canvas"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>{isEmpty ? 'Nothing to export' : 'Download'}</TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end" className="w-44">
                  <DropdownMenuItem onClick={handleExportPdf}>PDF</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportDocx}>Word (.docx)</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportMarkdown}>Markdown (.md)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipProvider>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => void openHistory()}
            title="Version history"
          >
            <History className="h-3.5 w-3.5" />
            History
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setConfirmDeleteOpen(true)}
            title="Delete this canvas"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
          {false && (
            <>
              <button
                type="button"
                onClick={saveSnapshot}
                className="rounded border border-border px-2 py-0.5 hover:bg-accent"
                title="Save a manual snapshot"
              >
                Save snapshot
              </button>
              <button
                type="button"
                onClick={toggleApplyMode}
                className="rounded border border-border px-2 py-0.5 hover:bg-accent"
                title="Toggle how AI edits are applied"
              >
                AI: {applyMode === 'direct' ? 'Direct' : 'Suggest'}
              </button>
            </>
          )}
          <span>
            {status === 'saving' && 'Saving…'}
            {status === 'saved' && lastSavedAt && `Saved · ${lastSavedAt.toLocaleTimeString()}`}
            {status === 'error' && 'Save failed'}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <CanvasEditor
          initialContent={doc}
          onChange={setDoc}
          onEditorReady={setEditor}
          rightToolbarSlot={
            <div className="flex items-center gap-1 pr-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={rewriteWholeDoc}
                disabled={aiLoading || !!suggestion}
                title={
                  suggestion
                    ? 'Resolve the pending suggestion first'
                    : aiLoading
                      ? 'AI is working…'
                      : 'Rewrite the whole document'
                }
                aria-busy={aiLoading}
              >
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                {aiLoading ? 'Rewriting…' : 'Rewrite document'}
              </Button>
            </div>
          }
        >
          <CanvasAIBubbleMenu
            editor={editor}
            canvasId={canvasId}
            onProposeSelection={handleProposeSelection}
            suggestionPending={!!suggestion}
            chatContext={chatContext}
          />
          {suggestion && editor && (
            <CanvasSuggestionCard
              html={suggestion.html}
              beforeHtml={suggestion.beforeHtml}
              schema={editor.schema}
              onAccept={acceptSuggestion}
              onReject={() => setSuggestion(null)}
            />
          )}
        </CanvasEditor>
      </div>
      <CanvasVersionHistory
        canvasId={canvasId}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        onRestore={restoreVersion}
      />
      <Dialog open={rewriteOpen} onOpenChange={(open) => { if (!aiLoading) setRewriteOpen(open); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rewrite document</DialogTitle>
            <DialogDescription>
              How should the whole document change? (e.g. "tighten and add headings")
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            value={rewriteInstruction}
            onChange={(e) => setRewriteInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                void submitRewrite();
              }
            }}
            placeholder="Tighten the language and add section headings…"
            rows={4}
            disabled={aiLoading}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRewriteOpen(false)} disabled={aiLoading}>
              Cancel
            </Button>
            <Button onClick={submitRewrite} disabled={aiLoading || !rewriteInstruction.trim()}>
              {aiLoading ? (<><Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Rewriting…</>) : 'Rewrite'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{title || 'Untitled canvas'}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. The canvas and its version history will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void performDeleteCanvas()}
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

export default CanvasPanel;