import React, { useMemo, useState } from 'react';
import { Check, X, Eye, GitCompare, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Schema } from '@tiptap/pm/model';
import { computeRichDiff, type DiffOp } from '@/lib/canvas/proseDiff';
import { sanitizeMarkdown } from '@/utils/sanitize';

interface Props {
  html: string;
  beforeHtml: string;
  schema: Schema;
  onAccept: () => void;
  onReject: () => void;
}

const DiffView: React.FC<{ ops: DiffOp[] }> = ({ ops }) => (
  <div className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
    {ops.map((op, i) => {
      if (op.type === 'equal') return <span key={i}>{op.text}</span>;
      if (op.type === 'insert')
        return (
          <span
            key={i}
            className="rounded bg-emerald-500/15 px-0.5 text-emerald-700 underline decoration-emerald-500/60 dark:text-emerald-300"
          >
            {op.text}
          </span>
        );
      return (
        <span
          key={i}
          className="rounded bg-rose-500/15 px-0.5 text-rose-700 line-through decoration-rose-500/60 dark:text-rose-300"
        >
          {op.text}
        </span>
      );
    })}
  </div>
);

const CanvasSuggestionCard: React.FC<Props> = ({ html, beforeHtml, schema, onAccept, onReject }) => {
  const [tab, setTab] = useState<'inline' | 'diff' | 'preview'>('inline');
  const diff = useMemo(() => {
    try {
      return computeRichDiff(schema, beforeHtml, html);
    } catch {
      return { ops: [] as DiffOp[], inlineHtml: html, stats: { ins: 0, del: 0, blocks: 0 } };
    }
  }, [schema, beforeHtml, html]);
  const { ops, inlineHtml, stats } = diff;
  const safeInlineHtml = useMemo(() => sanitizeMarkdown(inlineHtml), [inlineHtml]);
  const safePreviewHtml = useMemo(() => sanitizeMarkdown(html), [html]);

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-40 w-[min(520px,calc(100%-2rem))] rounded-lg border border-border bg-popover p-3 shadow-xl">
      <style>{`
        .pm-diff ins.pm-ins { background: hsl(142 71% 45% / 0.18); color: hsl(142 65% 28%); text-decoration: none; border-radius: 2px; padding: 0 1px; }
        .dark .pm-diff ins.pm-ins { color: hsl(142 70% 75%); }
        .pm-diff ins.pm-ins-block { display: block; background: hsl(142 71% 45% / 0.08); border-left: 2px solid hsl(142 71% 45% / 0.6); padding-left: 6px; }
        .pm-diff del.pm-del { background: hsl(0 72% 51% / 0.15); color: hsl(0 65% 38%); text-decoration: line-through; border-radius: 2px; padding: 0 1px; margin: 0 1px; }
        .dark .pm-diff del.pm-del { color: hsl(0 80% 78%); }
      `}</style>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">AI suggestion</span>
          <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">+{stats.ins}</span>
          <span className="text-[10px] font-medium text-rose-600 dark:text-rose-400">−{stats.del}</span>
          {stats.blocks > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground">{stats.blocks} change{stats.blocks === 1 ? '' : 's'}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="mr-1 flex overflow-hidden rounded border border-border">
            <button
              type="button"
              onClick={() => setTab('inline')}
              className={`flex items-center gap-1 px-2 py-0.5 text-[11px] ${
                tab === 'inline' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
            >
              <AlignLeft className="h-3 w-3" /> Inline
            </button>
            <button
              type="button"
              onClick={() => setTab('diff')}
              className={`flex items-center gap-1 px-2 py-0.5 text-[11px] ${
                tab === 'diff' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
            >
              <GitCompare className="h-3 w-3" /> Text
            </button>
            <button
              type="button"
              onClick={() => setTab('preview')}
              className={`flex items-center gap-1 px-2 py-0.5 text-[11px] ${
                tab === 'preview' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
              }`}
            >
              <Eye className="h-3 w-3" /> Preview
            </button>
          </div>
          <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={onReject}>
            <X className="h-3.5 w-3.5" /> Reject
          </Button>
          <Button size="sm" className="h-7 gap-1 px-2 text-xs" onClick={onAccept}>
            <Check className="h-3.5 w-3.5" /> Accept
          </Button>
        </div>
      </div>
      <div className="max-h-72 overflow-y-auto rounded border border-border bg-background p-2">
        {tab === 'inline' ? (
          <div
            className="pm-diff prose prose-sm dark:prose-invert max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: safeInlineHtml }}
          />
        ) : tab === 'diff' ? (
          <DiffView ops={ops} />
        ) : (
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-sm"
            dangerouslySetInnerHTML={{ __html: safePreviewHtml }}
          />
        )}
      </div>
    </div>
  );
};

export default CanvasSuggestionCard;
