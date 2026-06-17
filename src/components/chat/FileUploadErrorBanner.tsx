import React from "react";
import { AlertCircle, X, RotateCcw } from "lucide-react";
import type { ChatAttachment } from "@/hooks/useChatFileUpload";

interface Props {
  attachments: ChatAttachment[];
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}

// Translate raw edge-function error strings into something a human can act on.
function friendlyError(raw: string): string {
  const s = raw.toLowerCase();
  if (s.includes("could not find file in options")) {
    return "We couldn't open this DOCX. It may be corrupted, password-protected, or saved in an older Word format. Try re-saving it as .docx or export as PDF and re-upload.";
  }
  if (s.includes("unsupported file type")) {
    return "This file type isn't supported. Use PDF, DOCX, TXT, or Markdown.";
  }
  if (s.includes("pdf is") && s.includes("max parseable")) {
    return raw.replace(/^.*?:\s*/, "");
  }
  if (s.startsWith("extract-chat-file") || s.startsWith("parse:")) {
    return raw.replace(/^[^:]+:\s*/, "");
  }
  return raw;
}

export const FileUploadErrorBanner: React.FC<Props> = ({ attachments, onRetry, onDismiss }) => {
  const failed = attachments.filter((a) => a.status === "error" && a.error);

  if (failed.length === 0) return null;

  return (
    <div className="mx-3 mt-3 rounded-lg border border-[var(--color-error-border)] bg-[var(--color-error-soft)] text-[color:var(--color-error)]">
      <div className="flex items-start gap-2 px-3 py-2">
        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-[color:var(--color-error)]" />
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-foreground">
            {failed.length === 1 ? "File upload failed" : `${failed.length} file uploads failed`}
          </div>
          <ul className="mt-1.5 space-y-1.5">
            {failed.map((a) => {
              const raw = friendlyError(a.error || "Unknown error");
              return (
                <li key={a.documentId} className="rounded border border-[var(--color-error-border)] bg-[var(--chat-card)] px-2 py-1.5">
                  <div className="flex items-start gap-2 text-[11px]">
                    <span className="truncate font-medium text-foreground flex-1 min-w-0" title={a.fileName}>
                      {a.fileName}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onRetry(a.documentId)}
                        className="inline-flex items-center gap-1 rounded border border-[var(--color-error-border)] bg-[var(--color-error-soft)] px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-error)] hover:bg-[color:var(--color-error)] hover:text-[color:var(--color-text-inverse)] transition-colors"
                      >
                        <RotateCcw className="h-3 w-3" /> Retry
                      </button>
                      <button
                        type="button"
                        onClick={() => onDismiss(a.documentId)}
                        className="rounded p-0.5 text-[color:var(--color-error)] hover:bg-[var(--ui-bg-hover)] transition-colors"
                        aria-label="Dismiss"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-[11px] leading-snug text-muted-foreground select-text">
                    {raw}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FileUploadErrorBanner;
