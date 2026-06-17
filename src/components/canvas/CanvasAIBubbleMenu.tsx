import React, { useEffect, useState } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import type { Editor } from '@tiptap/react';
import {
  Sparkles, Wand2, Minimize2, Maximize2, List, Table as TableIcon,
  FileText, SpellCheck, Loader2, Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCanvasAIEdit, getApplyMode, type AIEditAction } from '@/hooks/useCanvasAIEdit';
import {
  aiSelectionHighlightKey,
  aiSelectionHighlightPlugin,
} from '@/lib/canvas/aiSelectionHighlight';

interface Props {
  editor: Editor | null;
  canvasId: string;
  onProposeSelection: (html: string, from: number, to: number) => void;
  suggestionPending?: boolean;
  chatContext?: {
    chatId: string | null;
    recentMessages: Array<{ role: string; content: string }>;
    originatingMessageId: string | null;
  };
}

const ACTIONS: { id: AIEditAction; label: string; running: string; icon: React.ReactNode }[] = [
  { id: 'improve', label: 'Improve', running: 'Improving…', icon: <Wand2 className="h-3.5 w-3.5" /> },
  { id: 'shorter', label: 'Shorter', running: 'Shortening…', icon: <Minimize2 className="h-3.5 w-3.5" /> },
  { id: 'longer', label: 'Longer', running: 'Expanding…', icon: <Maximize2 className="h-3.5 w-3.5" /> },
  { id: 'bullets', label: 'Bullets', running: 'Converting…', icon: <List className="h-3.5 w-3.5" /> },
  { id: 'table', label: 'Table', running: 'Building table…', icon: <TableIcon className="h-3.5 w-3.5" /> },
  { id: 'summary', label: 'Summary', running: 'Summarizing…', icon: <FileText className="h-3.5 w-3.5" /> },
  { id: 'grammar', label: 'Fix grammar', running: 'Fixing…', icon: <SpellCheck className="h-3.5 w-3.5" /> },
];

const CanvasAIBubbleMenu: React.FC<Props> = ({ editor, canvasId, onProposeSelection, suggestionPending, chatContext }) => {
  const { runEdit, loading } = useCanvasAIEdit();
  const [showCustom, setShowCustom] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [pending, setPending] = useState<AIEditAction | null>(null);

  // Clear local pending when global loading resolves
  useEffect(() => {
    if (!loading) setPending(null);
  }, [loading]);

  // Register the highlight plugin once per editor so we can paint a
  // decoration over the user's selection while the input has focus.
  useEffect(() => {
    if (!editor) return;
    editor.registerPlugin(aiSelectionHighlightPlugin());
    return () => {
      try { editor.unregisterPlugin(aiSelectionHighlightKey); } catch { /* noop */ }
    };
  }, [editor]);

  // Apply / clear the highlight when toggling the custom-instruction input.
  useEffect(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const tr = editor.state.tr.setMeta(
      aiSelectionHighlightKey,
      showCustom && from !== to ? { from, to } : null,
    );
    editor.view.dispatch(tr);
  }, [editor, showCustom]);

  if (!editor) return null;

  const busy = loading || !!suggestionPending;
  const blockReason = suggestionPending
    ? 'Resolve the pending suggestion first'
    : loading
      ? 'AI is working…'
      : undefined;

  const handle = async (action: AIEditAction, customInstruction?: string) => {
    if (busy) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const selectionText = editor.state.doc.textBetween(from, to, '\n');
    const fullText = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n');
    setPending(action);
    const result = await runEdit({
      canvasId,
      mode: 'selection',
      action,
      instruction: customInstruction,
      selectionText,
      fullText,
      chatId: chatContext?.chatId ?? null,
      recentMessages: chatContext?.recentMessages ?? [],
      originatingMessageId: chatContext?.originatingMessageId ?? null,
    });
    if (!result) {
      setPending(null);
      return;
    }
    if (getApplyMode() === 'direct') {
      editor.chain().focus().insertContentAt({ from, to }, result.html, {
        parseOptions: { preserveWhitespace: false },
      }).run();
    } else {
      onProposeSelection(result.html, from, to);
    }
    setShowCustom(false);
    setInstruction('');
    setPending(null);
  };

  const pendingLabel = pending
    ? ACTIONS.find((a) => a.id === pending)?.running ?? 'Working…'
    : pending === null && loading
      ? 'Working…'
      : null;

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top' }}
      className={`z-50 flex flex-col gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg transition-opacity ${
        suggestionPending ? 'opacity-70' : ''
      }`}
    >
      {suggestionPending && (
        <div className="flex items-center gap-1 px-1 pb-0.5 text-[10px] text-muted-foreground">
          <Lock className="h-3 w-3" />
          Suggestion pending — accept or reject to continue
        </div>
      )}
      {!showCustom ? (
        <div className="flex flex-wrap items-center gap-1">
          {ACTIONS.map((a) => {
            const isThis = pending === a.id;
            const disabled = busy;
            return (
              <Button
                key={a.id}
                variant={isThis ? 'secondary' : 'ghost'}
                size="sm"
                disabled={disabled}
                onClick={() => handle(a.id)}
                className={`h-7 gap-1 px-2 text-xs transition-opacity ${
                  loading && !isThis ? 'opacity-40' : ''
                }`}
                title={blockReason ?? a.label}
                aria-busy={isThis}
              >
                {isThis ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : a.icon}
                {isThis ? a.running : a.label}
              </Button>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => setShowCustom(true)}
            className={`h-7 gap-1 px-2 text-xs ${loading ? 'opacity-40' : ''}`}
            title={blockReason ?? 'Custom instruction'}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Ask AI
          </Button>
          {pendingLabel && !pending && (
            <span className="ml-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              {pendingLabel}
            </span>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (instruction.trim()) void handle('custom', instruction.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              if (!loading) {
                setShowCustom(false);
                setInstruction('');
              }
            }
          }}
          className="flex items-center gap-1"
        >
          <Input
            autoFocus
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={busy ? (blockReason ?? 'Working…') : 'Tell AI what to change… (Esc to cancel)'}
            className="h-7 w-64 text-xs"
            disabled={busy}
          />
          <Button
            type="submit"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            disabled={busy || !instruction.trim()}
            aria-busy={pending === 'custom'}
          >
            {pending === 'custom' ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Applying…
              </>
            ) : (
              'Apply'
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={loading}
            onClick={() => {
              setShowCustom(false);
              setInstruction('');
            }}
          >
            Cancel
          </Button>
        </form>
      )}
    </BubbleMenu>
  );
};

export default CanvasAIBubbleMenu;
