
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, ArrowUp, LogIn, Square, Sparkles, ArrowRight, Paperclip, Mic, LayoutGrid, Settings, AlertCircle, ChevronDown, LayoutTemplate, Plus, FileText, PenSquare, X, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SharpenToggle } from "./SharpenToggle";
import VoiceRecordingBar from "./VoiceRecordingBar";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import {
  ProcessingPowerSelect,
  AIModelSelect,
  KnowledgeBaseSelect,
} from "@/components/ChatToolbarSelectors";
import AlphaBadge from "@/components/canvas/AlphaBadge";
import { motion, AnimatePresence } from "framer-motion";
import { ChatMode } from "@/components/ChatInterface";
import { useAuth } from "@/context/SupabaseAuthContext";
import { useBrand } from "@/context/BrandContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatCanvases, createBlankCanvas, renameCanvas, deleteCanvas } from "@/hooks/useCanvas";
import { toast } from "sonner";
import { useChatFileUpload, type ChatAttachment } from "@/hooks/useChatFileUpload";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FileUploadErrorBanner from "@/components/chat/FileUploadErrorBanner";
import ChatFileCard from "@/components/chat/ChatFileCard";

const CHAR_LIMIT = 50000;
const LARGE_PASTE_THRESHOLD = 5000;

interface ChatInputAreaProps {
  onSendMessage: (
    message: string,
    attachments?: Array<{
      fileId: string;
      fileName: string;
      parsedText: string;
      fileType?: string;
      pageCount?: number;
    }>,
  ) => void;
  onStartNewChat: () => void;
  currentMode: ChatMode;
  setCurrentMode: (mode: string) => void;
  currentLength: string;
  setCurrentLength: (length: string) => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  useKnowledgebase: boolean;
  onKnowledgebaseChange: (value: boolean) => void;
  disabled?: boolean;
  chatId?: string;
  folderId?: string | null;
  hasMessages?: boolean;
  /** Called when the user attaches files before the chat exists. Should create
   *  the chat (and sync URL/state) and return its real id. */
  ensureChatId?: () => Promise<string | null>;
  isBotTyping?: boolean;
  isStreaming?: boolean;
  onStopGeneration?: () => void;
  promptImprovement?: {
    state: 'idle' | 'offering' | 'generating' | 'reviewing' | 'complete';
    isEnabled: boolean;
    isActive: boolean;
    originalPrompt: string | null;
    improvedPrompt: string | null;
    acceptImprovement: () => Promise<void>;
    declineImprovement: () => void;
    useImproved: () => void;
    keepOriginal: () => void;
    useEdited: (edited: string) => void;
  };
  onToggleSharpen?: () => void;
  isSharpening?: boolean;
  /** Show empty-state button layout (Attach/Settings/Options instead of mode label) */
  emptyState?: boolean;
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSendMessage,
  onStartNewChat,
  currentMode,
  setCurrentMode,
  currentLength,
  setCurrentLength,
  selectedModel,
  setSelectedModel,
  useKnowledgebase,
  onKnowledgebaseChange,
  disabled = false,
  chatId,
  folderId,
  hasMessages = false,
  ensureChatId,
  isBotTyping = false,
  isStreaming = false,
  onStopGeneration,
  promptImprovement,
  onToggleSharpen,
  isSharpening = false,
  emptyState = false,
}) => {
  const { user } = useAuth();
  const { brandText } = useBrand();
  const navigate = useNavigate();
  const draftKey = `chatDraft:${chatId ?? 'new'}`;
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [message, setMessage] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    try {
      return window.localStorage.getItem(`chatDraft:${chatId ?? 'new'}`) ?? '';
    } catch {
      return '';
    }
  });

  // When the active chat changes (e.g. user switches chats), hydrate the
  // draft for the new chat. Canvas open/close does not change chatId, so the
  // draft is preserved across split-screen toggles automatically.
  useEffect(() => {
    try {
      setMessage(window.localStorage.getItem(draftKey) ?? '');
    } catch {
      setMessage('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // Persist the draft on every change, throttled by React's batching.
  useEffect(() => {
    try {
      if (message) window.localStorage.setItem(draftKey, message);
      else window.localStorage.removeItem(draftKey);
    } catch {
      /* ignore quota errors */
    }
  }, [message, draftKey]);
  const [reviewText, setReviewText] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [showCompressBanner, setShowCompressBanner] = useState(false);
  const [isSharpeningDraft, setIsSharpeningDraft] = useState(false);
  const sharpenAbortRef = useRef<AbortController | null>(null);
  const sharpenCancelledRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const isDisabled = disabled || !user || isSharpeningDraft;
  const isOverLimit = message.length > CHAR_LIMIT;

  // File uploads
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { attachments, upload, removeOne, toggleActive, retry, retryPersist, reset } = useChatFileUpload(chatId, ensureChatId);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const anyPending = attachments.some(
    (a) => a.status === "uploading" || a.status === "processing",
  );
  const readyAttachments = attachments.filter((a) => a.status === "ready" && a.active !== false);
  const pendingCount = attachments.filter(
    (a) => a.status === "uploading" || a.status === "processing",
  ).length;
  const pendingMessage = pendingCount > 0
    ? `Waiting for ${pendingCount} file${pendingCount === 1 ? "" : "s"} to finish uploading and extracting before you can send.`
    : "";

  // Voice recording — ChatGPT-style overlay that replaces the input.
  const appendTranscript = (text: string) => {
    const next = message.trim().length > 0
      ? `${message.replace(/\s+$/, '')} ${text}`
      : text;
    setMessage(next);
    if (next.length <= LARGE_PASTE_THRESHOLD) setShowCompressBanner(false);
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }
    });
  };
  const recorder = useVoiceRecorder({ onTranscribed: appendTranscript });
  const isRecorderActive = recorder.state !== 'idle';

  useEffect(() => {
    if (promptImprovement?.state === 'reviewing' && promptImprovement.improvedPrompt) {
      setReviewText(promptImprovement.improvedPrompt);
    }
  }, [promptImprovement?.state, promptImprovement?.improvedPrompt]);

  // Window-level drag & drop: dropping a file anywhere on the chat page uploads it.
  // This complements the composer drop zone so users don't have to aim precisely.
  useEffect(() => {
    if (isDisabled) return;
    let dragDepth = 0;
    const hasFiles = (e: DragEvent) =>
      Array.from(e.dataTransfer?.types ?? []).includes('Files');
    const onDragEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth += 1;
      setIsDragging(true);
    };
    const onDragOver = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
    };
    const onDragLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) setIsDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth = 0;
      setIsDragging(false);
      const files = Array.from(e.dataTransfer?.files ?? []);
      if (files.length) upload(files);
    };
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
    };
  }, [isDisabled, upload]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isDisabled || isOverLimit || isCompressing) return;
    if (anyPending) {
      toast.message("Waiting for files to finish processing…");
      return;
    }
    const meta = readyAttachments
      .filter((a) => a.parsedText?.trim() || a.imageBase64)
      .map((a) => ({
        fileId: a.documentId,
        fileName: a.fileName,
        parsedText: a.parsedText,
        fileType: a.fileType,
        pageCount: a.pageCount,
        imageBase64: a.imageBase64,
      }));
    onSendMessage(message.trim(), meta.length ? meta : undefined);
    setMessage("");
    setShowCompressBanner(false);
    // Clear composer attachment cards immediately after send.
    // Stored file context (documentIds) remains available to the AI via prior messages.
    if (attachments.length) reset();
    try { window.localStorage.removeItem(draftKey); } catch { /* ignore */ }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;
    if (e.key === 'Escape' && showSlashMenu) {
      setShowSlashMenu(false);
      return;
    }
    // Enter submits; Shift+Enter inserts a newline. Cmd/Ctrl+Enter also submits.
    if (e.key === "Enter" && !e.shiftKey && !(e.nativeEvent as any).isComposing) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleMessageChange = (nextMessage: string) => {
    if (isDisabled) return;
    setMessage(nextMessage);
    setShowSlashMenu(nextMessage.startsWith('/') && !nextMessage.includes(' '));
    if (nextMessage.length <= LARGE_PASTE_THRESHOLD) {
      setShowCompressBanner(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted.length > LARGE_PASTE_THRESHOLD) {
      setShowCompressBanner(true);
    }
  };

  const handleCompress = async () => {
    if (!message.trim()) return;
    setIsCompressing(true);
    try {
      const { compressText } = await import('@/api/compressText');
      const compressed = await compressText(message);
      setMessage(compressed);
      setShowCompressBanner(false);
    } catch (error) {
      console.error('Failed to compress pasted text:', error);
    } finally {
      setIsCompressing(false);
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const maxH = emptyState ? 140 : (hasMessages ? 120 : 140);
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, maxH) + "px";
    }
  }, [message, hasMessages, emptyState]);

  const isMuted = promptImprovement?.isActive &&
    (promptImprovement.state === 'offering' || promptImprovement.state === 'generating');
  const isReviewing = promptImprovement?.isActive && promptImprovement.state === 'reviewing';

  const handleSharpenClick = async () => {
    const draft = message.trim();
    // If there's no draft, fall back to toggling the auto-sharpen preference.
    if (!draft) {
      onToggleSharpen?.();
      return;
    }
    if (isSharpeningDraft) return;
    sharpenCancelledRef.current = false;
    sharpenAbortRef.current = new AbortController();
    setIsSharpeningDraft(true);
    try {
      const { improvePrompt } = await import('@/api/promptImprovement');
      const result = await improvePrompt(draft, undefined, sharpenAbortRef.current.signal);
      if (sharpenCancelledRef.current) return;
      if (!result.fallback && result.improvedPrompt && result.improvedPrompt !== draft) {
        setMessage(result.improvedPrompt);
        // Move caret to end so user can keep typing if desired
        requestAnimationFrame(() => {
          const el = textareaRef.current;
          if (el) {
            el.focus();
            el.setSelectionRange(result.improvedPrompt.length, result.improvedPrompt.length);
          }
        });
      }
    } catch (err) {
      if (!sharpenCancelledRef.current) {
        console.error('Sharpen prompt failed:', err);
      }
    } finally {
      sharpenAbortRef.current = null;
      setIsSharpeningDraft(false);
    }
  };

  const handleCancelSharpen = () => {
    sharpenCancelledRef.current = true;
    sharpenAbortRef.current?.abort();
    sharpenAbortRef.current = null;
    setIsSharpeningDraft(false);
  };

  if (!user) {
    return (
      <div className="flex gap-3 items-center justify-center p-6 bg-[var(--chat-input-bg)] rounded-xl border border-[var(--chat-border)]">
        <div className="text-center">
          <LogIn className="h-8 w-8 text-[var(--ui-icon)] mx-auto mb-3" />
          <h3 className="text-[var(--chat-text)] font-medium mb-2">Sign in to start chatting</h3>
          <p className="text-[var(--chat-muted)] text-sm mb-4">{brandText('Create an account or sign in to chat with Daryle AI.')}</p>
          <Button
            onClick={() => navigate("/auth")}
            className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue font-medium"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Main input container */}
      <div
        className={`relative rounded-xl border transition-colors ${
          isOverLimit
            ? 'border-red-500 bg-[var(--chat-input-bg)]'
            : isDragging
              ? 'border-brand-yellow bg-[var(--chat-input-bg)]'
              : 'border-[var(--chat-border)] bg-[var(--chat-input-bg)] focus-within:border-[var(--chat-border)]'
        }`}
        onDragOver={(e) => { e.preventDefault(); if (!isDragging) setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const files = Array.from(e.dataTransfer?.files ?? []);
          if (files.length) upload(files);
        }}
      >
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-brand-yellow/10 border-2 border-dashed border-brand-yellow text-sm font-medium text-brand-yellow">
            Drop files to attach (PDF, DOCX, RTF, TXT, MD)
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.rtf,.txt,.md,.markdown,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/rtf,text/rtf,text/plain,text/markdown"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) upload(files);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />

        {!isRecorderActive && !isReviewing && (
          <FileUploadErrorBanner
            attachments={attachments}
            onRetry={retry}
            onDismiss={removeOne}
          />
        )}

        {attachments.length > 0 && !isRecorderActive && !isReviewing && (
          <div className="px-3 pt-3">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {attachments.length} attachment{attachments.length === 1 ? "" : "s"}
                {pendingCount > 0 && (
                  <span className="ml-1 text-amber-400">
                    · {pendingCount} still processing
                  </span>
                )}
              </span>
              {attachments.length > 1 && (
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(true)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
            {pendingCount > 0 && (
              <div
                role="status"
                aria-live="polite"
                className="mb-2 rounded-md border border-[var(--color-warning-border)] bg-[var(--color-warning-soft)] px-2 py-1 text-[11px] text-[color:var(--color-warning)]"
              >
                {pendingMessage}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {attachments.map((a) => (
                <ChatFileCard
                  key={a.documentId}
                  attachment={a}
                  onRemove={removeOne}
                  onRetry={retry}
                  onToggleActive={toggleActive}
                  onRetryPersist={retryPersist}
                />
              ))}
            </div>
          </div>
        )}

        <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove all attachments?</AlertDialogTitle>
              <AlertDialogDescription>
                This will remove all {attachments.length} attached file{attachments.length === 1 ? "" : "s"} from this message. You can re-upload them if needed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  attachments.forEach((a) => removeOne(a.documentId));
                  setConfirmClearAll(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove all
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Route selector + Sharpen — visible above textarea */}
        {!isReviewing && !isRecorderActive && (
          <>
          <div className="flex items-center gap-2 px-3 pt-3 pb-1 flex-wrap">
            <span data-tour="processing-power" className="inline-flex">
              <ProcessingPowerSelect
                disabled={disabled || isBotTyping}
                openUpward={hasMessages}
                chatId={chatId ?? null}
              />
            </span>
            <span data-tour="ai-model" className="inline-flex">
              <AIModelSelect
                currentModel={selectedModel}
                onModelChange={setSelectedModel}
                disabled={disabled || isBotTyping}
                openUpward={hasMessages}
                chatId={chatId ?? null}
              />
            </span>
            <span data-tour="knowledge-base" className="inline-flex">
              <KnowledgeBaseSelect
                enabled={useKnowledgebase}
                onEnabledChange={onKnowledgebaseChange}
                disabled={disabled || isBotTyping}
                openUpward={hasMessages}
                chatId={chatId ?? null}
                folderId={folderId ?? null}
              />
            </span>
            {promptImprovement && onToggleSharpen && (
              <span data-tour="prompt-sharpener" className="inline-flex">
                <SharpenToggle
                  enabled={promptImprovement.isEnabled}
                  onToggle={handleSharpenClick}
                  disabled={disabled || isBotTyping}
                  loading={isSharpeningDraft}
                  onCancel={handleCancelSharpen}
                />
              </span>
            )}
          </div>
          </>
        )}

        {/* Recording overlay takes over the whole input area */}
        {isRecorderActive ? (
          <VoiceRecordingBar
            levels={recorder.levels}
            peaks={recorder.peaks}
            elapsed={recorder.elapsed}
            isTranscribing={recorder.state === 'transcribing'}
            onCancel={recorder.cancel}
            onConfirm={recorder.commit}
          />
        ) : !isReviewing ? (
          <form onSubmit={handleSubmit} data-tour="prompt-input" className="relative">
            {showSlashMenu && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--chat-card)] border border-[var(--chat-border)] rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-[var(--chat-border)]">
                  <p className="text-xs text-[var(--chat-muted)] font-medium">Commands</p>
                </div>
                {[{ id: 'advisor', icon: '🧭', label: '/advisor', tagline: 'Bring a problem. Get practical guidance.' }]
                  .filter(cmd => cmd.id.startsWith(message.slice(1).toLowerCase()))
                  .map(cmd => (
                    <button
                      key={cmd.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setMessage(`/${cmd.id} `);
                        setShowSlashMenu(false);
                        textareaRef.current?.focus();
                      }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[var(--chat-card-2)] transition-colors"
                    >
                      <span className="text-lg leading-none">{cmd.icon}</span>
                      <div>
                        <div className="text-sm font-semibold text-[var(--chat-text)]">{cmd.label}</div>
                        <div className="text-xs text-[var(--chat-muted)]">{cmd.tagline}</div>
                      </div>
                    </button>
                  ))
                }
              </div>
            )}
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={isDisabled ? "Please wait..." : currentMode === 'advisor' ? "What challenge or decision do you need guidance on?" : "Ask me anything..."}
              readOnly={promptImprovement?.isActive && promptImprovement.state !== 'reviewing'}
              className={`w-full resize-none border-0 bg-transparent text-[var(--chat-text)] placeholder:text-[var(--chat-muted)] focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm leading-relaxed scrollbar-hide px-4 ${
                emptyState ? 'min-h-[80px] pt-4 pb-3' : 'min-h-[52px] pt-2 pb-2'
              } ${isMuted ? 'opacity-40' : ''}`}
              rows={1}
              disabled={isDisabled}
              spellCheck={false}
            />

            {/* Bottom action row */}
            <div className="flex items-center justify-between px-3 pb-3 pt-1">
              <div className="flex items-center gap-1">
                {!isMobile && (
                  <>
                    <span data-tour="canvas-button" className="inline-flex">
                      <CanvasQuickMenu chatId={chatId ?? null} disabled={isDisabled} />
                    </span>
                    <CanvasArmedPill chatId={chatId ?? null} />
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  data-tour="file-upload"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isDisabled || isBotTyping}
                  aria-label="Attach file"
                  title="Attach file (PDF, DOCX, RTF, TXT, MD)"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={recorder.start}
                  disabled={isDisabled || isStreaming}
                  aria-label="Record voice"
                  title="Record voice"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
                >
                  <Mic className="h-4 w-4" />
                </button>
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={onStopGeneration}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    <Square className="h-3.5 w-3.5 text-white fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!message.trim() || isDisabled || isOverLimit || isCompressing || pendingCount > 0}
                    title={pendingCount > 0 ? pendingMessage : undefined}
                    aria-disabled={pendingCount > 0 || undefined}
                    className="w-9 h-9 flex items-center justify-center rounded-full bg-brand-yellow hover:bg-brand-yellow/90 disabled:bg-[var(--ui-bg-hover)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors focus-ring"
                  >
                    <ArrowUp className="h-4 w-4 text-brand-blue" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          </form>
        ) : (
          /* Reviewing state — prompt improvement editor */
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <span className="text-[10px] uppercase tracking-wider text-[var(--chat-muted)] font-medium">Your question</span>
              <span className="text-[10px] text-[var(--chat-muted)] truncate max-w-[200px]">{promptImprovement?.originalPrompt}</span>
            </div>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand-yellow/40 rounded-full" />
              <Textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="pl-3 text-sm border border-[var(--chat-border)] bg-[var(--ui-bg-hover)] text-[var(--chat-text)] focus:border-brand-yellow/40 resize-none min-h-[60px]"
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue h-7 text-xs px-3 gap-1"
                onClick={() => {
                  const trimmed = reviewText.trim();
                  if (trimmed !== promptImprovement?.improvedPrompt) {
                    promptImprovement?.useEdited(trimmed);
                  } else {
                    promptImprovement?.useImproved();
                  }
                }}
              >
                Use this <ArrowRight size={12} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--ui-icon)] hover:text-[var(--ui-icon-hover)] h-7 text-xs px-3"
                onClick={promptImprovement?.keepOriginal}
              >
                Keep mine
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Large paste compression banner */}
      {showCompressBanner && !isCompressing && (
        <div className="flex items-center justify-between mt-2 px-3 py-2 rounded-lg bg-[var(--ui-bg-hover)] border border-[var(--chat-border)] text-xs">
          <span className="text-[var(--chat-muted)]">Large text pasted ({message.length.toLocaleString()} chars) — compress with AI?</span>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <button
              type="button"
              onClick={handleCompress}
              className="text-brand-yellow hover:text-brand-yellow/80 font-medium transition-colors"
            >
              Compress
            </button>
            <button
              type="button"
              onClick={() => setShowCompressBanner(false)}
              className="text-[var(--chat-muted)] hover:text-[var(--chat-text)] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {isCompressing && (
        <div className="flex items-center gap-2 mt-2 px-3 py-2 text-xs text-[var(--chat-muted)]">
          <span className="animate-pulse">Compressing...</span>
        </div>
      )}

      {/* Character limit error */}
      {isOverLimit && (
        <div className="flex items-center gap-2 mt-2 text-red-400 text-xs">
          <AlertCircle size={14} />
          <span>Message exceeds {CHAR_LIMIT.toLocaleString()} characters. Use the Compress button to reduce it.</span>
        </div>
      )}

      {/* Sharpening indicator */}
      <AnimatePresence>
        {isSharpening && (
          <motion.div
            key="sharpening"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-lg px-3 py-2.5 mt-2"
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-brand-yellow animate-pulse shrink-0" />
              <span className="text-xs font-medium text-[var(--chat-muted)]">Enhancing your prompt…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt improvement — offering */}
      <AnimatePresence>
        {promptImprovement?.isActive && promptImprovement.state === 'offering' && (
          <motion.div
            key="offering"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-lg px-3 py-2 mt-2"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 min-w-0">
                <Sparkles size={13} className="text-brand-yellow shrink-0" />
                <span className="text-xs font-medium text-[var(--chat-text)]">Want to sharpen this?</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button size="sm" className="bg-brand-yellow hover:bg-brand-yellow/90 text-brand-blue h-6 text-[11px] px-2.5 rounded-md" onClick={promptImprovement.acceptImprovement}>
                  Yes, improve it
                </Button>
                <Button variant="ghost" size="sm" className="text-[var(--ui-icon)] hover:text-[var(--ui-icon-hover)] h-6 text-[11px] px-2 rounded-md" onClick={promptImprovement.declineImprovement}>
                  No thanks
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {promptImprovement?.isActive && promptImprovement.state === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-brand-yellow/10 border border-brand-yellow/20 rounded-lg px-3 py-2.5 mt-2"
          >
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-brand-yellow animate-pulse shrink-0" />
              <span className="text-xs text-[var(--chat-muted)]">Improving…</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ChatInputArea;

// ---------------------------------------------------------------------------
// CanvasQuickMenu — "+" button on the chat composer that lets the user
// (a) create a brand-new canvas inside the current chat, or
// (b) re-open any existing canvas attached to this chat.
// Opens the canvas via the `canvas:open-request` CustomEvent that
// IndexContent already listens for.
// ---------------------------------------------------------------------------
const CanvasQuickMenu: React.FC<{ chatId: string | null; disabled?: boolean }> = ({
  chatId,
  disabled,
}) => {
  const { user } = useAuth();
  const { canvases, refresh } = useChatCanvases(chatId);
  const [creating, setCreating] = useState(false);

  const openCanvas = (id: string) => {
    window.dispatchEvent(
      new CustomEvent('canvas:open-request', { detail: { canvasId: id, chatId } }),
    );
  };

  const handleNew = () => {
    // Arm canvas mode: next assistant response will land in a new canvas.
    // chatId may be null (brand-new chat) — ChatInterface arms regardless and
    // the canvas is created once the chat row exists after the first send.
    window.dispatchEvent(
      new CustomEvent('canvas:arm', { detail: { chatId } }),
    );
  };

  const isDisabled = disabled || !user;

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) void refresh(); }}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={isDisabled}
          title={'Canvas (Alpha)'}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[var(--chat-muted)] transition-colors hover:bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)] disabled:cursor-not-allowed disabled:opacity-40 focus-ring"
          aria-label="Open canvas menu"
        >
          <Plus className="h-5 w-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuItem onClick={handleNew} disabled={creating}>
          <FileText className="mr-2 h-4 w-4" />
          <span className="flex items-center gap-1.5">
            New canvas
            <AlphaBadge />
          </span>
        </DropdownMenuItem>
        {canvases.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Canvases in this chat
            </DropdownMenuLabel>
            {canvases.map((c) => (
              <CanvasRow
                key={c.id}
                id={c.id}
                title={c.title || 'Untitled canvas'}
                chatId={chatId}
                onOpen={() => openCanvas(c.id)}
                onChanged={() => refresh()}
              />
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// ---------------------------------------------------------------------------
// CanvasArmedPill — small "Canvas" indicator that appears next to the + button
// once the user has armed canvas mode. Their next message will be placed in a
// fresh canvas. Clicking the pill disarms.
// ---------------------------------------------------------------------------
const CanvasArmedPill: React.FC<{ chatId: string | null }> = ({ chatId }) => {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const onArm = (e: Event) => {
      const detail = (e as CustomEvent).detail as { chatId?: string } | undefined;
      // Match when both ids align, or when either side is missing (new chat case).
      if (!detail?.chatId || !chatId || detail.chatId === chatId) setArmed(true);
    };
    const onDisarm = (e: Event) => {
      const detail = (e as CustomEvent).detail as { chatId?: string } | undefined;
      if (!detail?.chatId || detail.chatId === chatId) setArmed(false);
    };
    window.addEventListener('canvas:arm', onArm as EventListener);
    window.addEventListener('canvas:disarm', onDisarm as EventListener);
    return () => {
      window.removeEventListener('canvas:arm', onArm as EventListener);
      window.removeEventListener('canvas:disarm', onDisarm as EventListener);
    };
  }, [chatId]);

  if (!armed) return null;

  return (
    <button
      type="button"
      onClick={() => {
        window.dispatchEvent(new CustomEvent('canvas:disarm', { detail: { chatId } }));
      }}
      title="Canvas armed — next reply will open in a new canvas. Click to cancel."
      className="group flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-sky-400 transition-colors hover:bg-sky-400/10"
    >
      <PenSquare className="h-3.5 w-3.5" />
      <span className="flex items-center gap-1">
        Canvas
        <AlphaBadge className="bg-sky-400/15 text-sky-400 ring-sky-400/40" />
      </span>
      <X className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-70" />
    </button>
  );
};

// ---------------------------------------------------------------------------
// CanvasRow — single canvas entry inside the + dropdown. Clicking the row
// opens the canvas. A trailing "…" button reveals rename / delete actions.
// ---------------------------------------------------------------------------
const CanvasRow: React.FC<{
  id: string;
  title: string;
  chatId: string | null;
  onOpen: () => void;
  onChanged: () => void;
}> = ({ id, title, chatId, onOpen, onChanged }) => {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(title); }, [title]);
  useEffect(() => {
    if (renaming) requestAnimationFrame(() => inputRef.current?.select());
  }, [renaming]);

  const commitRename = async () => {
    const next = draft.trim();
    setRenaming(false);
    if (!next || next === title) { setDraft(title); return; }
    try {
      await renameCanvas(id, next);
      onChanged();
    } catch {
      toast.error('Could not rename canvas');
      setDraft(title);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteCanvas(id);
      // If this canvas is currently open in the URL, close it.
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('canvas') === id) {
          params.delete('canvas');
          const qs = params.toString();
          window.history.replaceState(
            {},
            '',
            window.location.pathname + (qs ? `?${qs}` : ''),
          );
        }
        if (chatId) {
          const key = `lastCanvas:${chatId}`;
          if (localStorage.getItem(key) === id) localStorage.removeItem(key);
        }
      } catch { /* ignore */ }
      onChanged();
      toast.success('Canvas deleted');
    } catch {
      toast.error('Could not delete canvas');
    }
  };

  if (renaming) {
    return (
      <div
        className="flex items-center gap-2 px-2 py-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <Pencil className="h-4 w-4 shrink-0 text-[var(--chat-muted)]" />
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
            else if (e.key === 'Escape') { e.preventDefault(); setDraft(title); setRenaming(false); }
          }}
          className="flex-1 min-w-0 bg-transparent border border-[var(--chat-border)] rounded px-1.5 py-0.5 text-sm text-[var(--chat-text)] focus:outline-none focus:border-sky-400"
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 pr-1 group/canvas-row">
      <DropdownMenuItem
        onClick={onOpen}
        className="flex-1 min-w-0 truncate"
      >
        <FileText className="mr-2 h-4 w-4 shrink-0" />
        <span className="truncate">{title}</span>
      </DropdownMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label={`More actions for ${title}`}
            className="h-7 w-7 flex items-center justify-center rounded text-[var(--chat-muted)] opacity-60 hover:opacity-100 hover:bg-[var(--chat-card-2)] transition"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); setRenaming(true); }}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => { e.preventDefault(); void handleDelete(); }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
