import React, { useState } from "react";
import { FileText } from "lucide-react";
import FileViewerDialog from "./FileViewerDialog";
import type { MessageType } from "@/types/chat";

type Citation = NonNullable<MessageType["fileCitations"]>[number];

export const CitationPills: React.FC<{ citations: Citation[] }> = ({ citations }) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Citation | null>(null);

  if (!citations?.length) return null;

  // Deduplicate by filename+page+heading
  const seen = new Set<string>();
  const unique = citations.filter((c) => {
    const k = `${c.filename}|${c.page ?? ""}|${c.heading ?? ""}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {unique.map((c, i) => {
          const suffix = c.page ? ` p.${c.page}` : c.heading ? ` §${c.heading}` : "";
          return (
            <button
              key={`${c.filename}-${i}`}
              type="button"
              onClick={() => {
                if (!c.fileId) return;
                setActive(c);
                setOpen(true);
              }}
              disabled={!c.fileId}
              className="inline-flex items-center gap-1 rounded-full border border-[var(--chat-border)] bg-[var(--ui-bg-hover)] px-2.5 py-0.5 text-[11px] text-[var(--chat-text)] hover:border-brand-yellow/40 hover:text-brand-yellow disabled:cursor-default disabled:opacity-60 focus-ring transition-colors"
              title={c.fileId ? "Open source" : "Source no longer available"}
            >
              <FileText className="h-3 w-3 text-[var(--chat-muted)]" />
              <span className="truncate max-w-[220px]">{c.filename}</span>
              {suffix && <span className="text-[var(--chat-muted)]">{suffix}</span>}
            </button>
          );
        })}
      </div>
      <FileViewerDialog
        open={open}
        onOpenChange={setOpen}
        fileId={active?.fileId}
        filename={active?.filename ?? ""}
        page={active?.page}
      />
    </>
  );
};

export default CitationPills;