import React from "react";
import { FileText, Image, Loader2, X, AlertCircle, CheckCircle2, RotateCcw, Eye, EyeOff, CloudOff, Circle, Save } from "lucide-react";
import type { ChatAttachment } from "@/hooks/useChatFileUpload";

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

export const ChatFileCard: React.FC<{
  attachment: ChatAttachment;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  onToggleActive?: (id: string) => void;
  onRetryPersist?: (id: string) => void;
}> = ({ attachment, onRemove, onRetry, onToggleActive, onRetryPersist }) => {
  const inFlight = attachment.status === "uploading" || attachment.status === "processing";
  const isError = attachment.status === "error";
  const isReady = attachment.status === "ready";
  const dim = isReady && attachment.active === false;
  const persist = attachment.persistStatus;

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs max-w-[280px] transition-opacity ${
        isError
          ? "border-[var(--color-error-border)] bg-[var(--color-error-soft)]"
          : "border-[var(--chat-border)] bg-[var(--ui-bg-hover)]"
      } ${dim ? "opacity-50" : ""}`}
    >
      {attachment.imageBase64 ? (
        <img
          src={attachment.imageBase64}
          alt={attachment.fileName}
          className="h-7 w-7 rounded object-cover shrink-0"
        />
      ) : IMAGE_EXTS.has(attachment.fileType) ? (
        <Image className="h-3.5 w-3.5 text-[var(--chat-muted)] shrink-0" />
      ) : (
        <FileText className="h-3.5 w-3.5 text-[var(--chat-muted)] shrink-0" />
      )}

      <span className="min-w-0 flex-1 truncate text-[var(--chat-text)]" title={attachment.fileName}>
        {attachment.fileName}
      </span>

      {inFlight && <Loader2 className="h-3.5 w-3.5 text-[var(--chat-muted)] animate-spin shrink-0" />}
      {isReady && persist === "pending" && (
        <span className="shrink-0" title="Saving for follow-ups…">
          <Loader2 className="h-3.5 w-3.5 text-[var(--chat-muted)] animate-spin" />
        </span>
      )}
      {isReady && (persist === "saved" || persist === undefined) && (
        <span className="shrink-0" title="Saved — future turns can read this file">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        </span>
      )}
      {isReady && persist === "skipped" && (
        <span className="shrink-0" title="Parsed (this turn only)">
          <Circle className="h-3.5 w-3.5 text-[var(--chat-muted)]" />
        </span>
      )}
      {isReady && persist === "failed" && (
        <span
          className="shrink-0 text-amber-400"
          title={attachment.persistError ? `Not saved: ${attachment.persistError}` : "Not saved for follow-ups"}
        >
          <CloudOff className="h-3.5 w-3.5" />
        </span>
      )}
      {isReady && persist === "failed" && onRetryPersist && (
        <button
          type="button"
          onClick={() => onRetryPersist(attachment.documentId)}
          className="rounded p-0.5 text-amber-400 hover:text-amber-300 shrink-0"
          aria-label="Retry save"
          title="Retry save"
        >
          <Save className="h-3 w-3" />
        </button>
      )}
      {isError && (
        <span className="flex items-center gap-1 text-[10px] text-red-400 shrink-0 max-w-[120px]">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span className="truncate">{attachment.error ? attachment.error.slice(0, 50) : "Failed"}</span>
        </span>
      )}

      {isError && onRetry && (
        <button
          type="button"
          onClick={() => onRetry(attachment.documentId)}
          className="rounded p-0.5 text-red-400 hover:text-red-300 shrink-0"
          aria-label="Retry"
          title="Retry"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      )}

      {isReady && onToggleActive && (
        <button
          type="button"
          onClick={() => onToggleActive(attachment.documentId)}
          className="rounded p-0.5 text-[var(--chat-muted)] hover:text-[var(--chat-text)] shrink-0"
          aria-label={attachment.active ? "Exclude from reply" : "Include in reply"}
          title={attachment.active ? "Exclude from reply" : "Include in reply"}
        >
          {attachment.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
        </button>
      )}

      <button
        type="button"
        onClick={() => onRemove(attachment.documentId)}
        className="rounded p-0.5 text-[var(--chat-muted)] hover:text-[var(--chat-text)] shrink-0"
        aria-label="Remove file"
        title="Remove"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

export default ChatFileCard;
