import React, { memo, useState } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import MessageHoverActions from './MessageHoverActions';
import MessageTimestamp from './MessageTimestamp';
import { parseMarkdownBold } from '@/utils/markdownParser';
import { formatMessageMetadata } from '@/utils/messageMetadataLabels';
import { Sparkles, Paperclip, FileText } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useBrand } from '@/context/BrandContext';

interface MessageBubbleProps {
  message: {
    id?: string;
    chatId?: string | null;
    text?: string;
    content?: string;
    role?: string;
    sender?: string;
    createdAt?: string;
    timestamp?: Date;
    sequence?: number;
    sources?: any[];
    citation?: string | { source: string; title: string; url?: string; };
    mode?: string;
    model?: string;
    knowledgeBaseEnabled?: boolean;
    responseStyle?: string;
    processingPower?: string;
    intent?: string;
    routeMetadata?: {
      route: string;
      classification?: string;
      stageTimings: { model: string; durationMs: number }[];
      totalDurationMs: number;
    };
    attachedFiles?: Array<{
      fileId: string;
      fileName: string;
      fileType?: string;
      pageCount?: number;
    }>;
  };
  messageIndex?: number;
  onRegenerate?: (index: number) => void;
  onEdit?: (index: number) => void;
  onViewSources?: () => void;
  isStreaming?: boolean;
  variant?: 'default' | 'comparison';
}

// Detect thematic tags from message content
function detectTags(text: string): { label: string; color: string }[] {
  const tags: { label: string; color: string }[] = [];
  if (/chemistry|trust|relationship|team|collaboration/i.test(text)) {
    tags.push({ label: 'Chemistry', color: 'bg-green-500/10 text-green-700 dark:text-green-300 border-green-500/30' });
  }
  if (/competency|skill|performance|framework|process|execution/i.test(text)) {
    tags.push({ label: 'Competency', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30' });
  }
  if (/character|integrity|values|virtue|principle|moral|leader/i.test(text)) {
    tags.push({ label: 'Character', color: 'bg-brand-yellow/15 text-brand-blue dark:text-brand-yellow border-brand-yellow/30' });
  }
  return tags.slice(0, 2); // max 2 tags per message
}

const MessageBubble = ({
  message,
  messageIndex = 0,
  onRegenerate,
  onEdit,
  onViewSources,
  isStreaming = false,
  variant = 'default',
}: MessageBubbleProps) => {
  const { user, profile } = useAuth();
  const { activeBrand } = useBrand();
  const isWhiteLabel = !!activeBrand;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';
  const [showRouteDetail, setShowRouteDetail] = useState(false);

  const messageText = message.text || message.content || '';
  const isAssistant = message.role === 'assistant' || message.sender === 'daryle';
  const isUser = !isAssistant;
  const tags = isAssistant && !isStreaming ? detectTags(messageText) : [];
  const attachedFiles = message.attachedFiles ?? [];
  const hasAttachments = attachedFiles.length > 0;

  const AttachmentChips = ({ label }: { label: string }) => (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] uppercase tracking-wider text-[var(--chat-muted)] font-semibold flex items-center gap-1">
        <Paperclip className="h-3 w-3" />
        {label}
      </span>
      {attachedFiles.map((f) => (
        <span
          key={f.fileId}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-yellow/10 border border-brand-yellow/30 text-[11px] text-brand-blue dark:text-brand-yellow max-w-[260px]"
          title={f.fileName}
        >
          <FileText className="h-3 w-3 flex-shrink-0" />
          <span className="truncate">{f.fileName}</span>
          {f.pageCount ? <span className="text-[var(--chat-muted)]">· {f.pageCount}p</span> : null}
        </span>
      ))}
    </div>
  );

  // Comparison variant — content only
  if (variant === 'comparison') {
    return (
      <div className="prose prose-sm max-w-none text-[var(--chat-text)]">
        <div className="leading-relaxed text-[var(--chat-text)]">{parseMarkdownBold(messageText)}</div>
        {(message as any).knowledgeBaseEnabled !== false && message.sources && message.sources.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-[var(--chat-muted)]">Sources: {message.sources.length}</span>
            {onViewSources && (
              <button onClick={onViewSources} className="text-xs text-brand-yellow hover:text-brand-yellow/80 transition-colors">
                View Sources
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 w-full animate-fade-in-left">
      <div className="max-w-3xl mx-auto px-6">

        {/* ── User bubble ── */}
        {isUser && (
          <div className="flex items-start justify-end gap-3 group">
            <div className="flex flex-col items-end">
              {/* Message pill — uses CSS var, responds to theme */}
              <div className="bg-[var(--chat-user-msg)] text-[var(--chat-text)] px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-[1.7] max-w-[560px] whitespace-pre-wrap break-words">
                {messageText}
              </div>
              {hasAttachments && (
                <div className="self-end">
                  <AttachmentChips label="Attached" />
                </div>
              )}
              {/* Timestamp + hover actions */}
              <div className="mt-1.5 flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <MessageTimestamp timestamp={message.createdAt || message.timestamp} className="text-[11px] text-[var(--chat-muted)]" />
                <MessageHoverActions
                  message={{ ...message, id: message.id || 'temp-id' }}
                  messageIndex={messageIndex}
                  onRegenerate={onRegenerate}
                  onViewSources={onViewSources}
                  isAssistant={false}
                />
              </div>
            </div>
            {/* User avatar */}
            <Avatar className="w-8 h-8 flex-shrink-0 mt-1 border border-[var(--chat-border)]">
              {profile?.avatar_url ? (
                <AvatarImage src={profile.avatar_url} alt={profile?.name || 'You'} />
              ) : null}
              <AvatarFallback className="bg-brand-yellow text-brand-blue text-[11px] font-semibold">
                {(profile?.name || '')
                  .split(' ')
                  .map((n) => n[0])
                  .filter(Boolean)
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--chat-muted)]">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                )}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {/* ── AI — free-floating GPT style ── */}
        {isAssistant && (
          <div className="group">
            {/* Avatar + sender row */}
            <div className={cn("flex items-center gap-2.5", isWhiteLabel && tags.length === 0 ? "mb-0" : "mb-3")}>
              {!isWhiteLabel && (
                <>
                  <img
                    src="/lovable-uploads/Daryle_Round_Logo_Light.svg"
                    alt="Daryle AI"
                    className="w-8 h-8 flex-shrink-0 animate-logo-glow dark:hidden"
                  />
                  <img
                    src="/lovable-uploads/Daryle_Round_Logo.svg"
                    alt="Daryle AI"
                    className="w-8 h-8 flex-shrink-0 animate-logo-glow hidden dark:block"
                  />
                  <span className="text-sm font-semibold text-brand-blue dark:text-white">Daryle AI</span>
                </>
              )}
              {tags.map((tag) => (
                <span key={tag.label} className={cn('px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border', tag.color)}>
                  {tag.label}
                </span>
              ))}
            </div>

            {/* Free-floating content — no card box */}
            <div className={isWhiteLabel ? "ml-0" : "ml-10"}>
              {hasAttachments && <AttachmentChips label="Read from your files" />}

              {/* Admin route details */}
              {(message.responseStyle || message.model) && isAdmin && (
                <div className="text-[11px] text-[var(--chat-muted)] mb-1">
                  {formatMessageMetadata(message.responseStyle, message.model, message.knowledgeBaseEnabled, message.processingPower)}
                  {message.routeMetadata && (
                    <button onClick={() => setShowRouteDetail(!showRouteDetail)} className="ml-1 underline hover:text-[var(--chat-muted)]">
                      {showRouteDetail ? 'hide' : 'details'}
                    </button>
                  )}
                </div>
              )}

              {message.intent === 'stopped' && (
                <div className="text-[11px] text-[var(--chat-muted)] mb-1">⏹ Stopped</div>
              )}

              {showRouteDetail && message.routeMetadata && (
                <div className="mb-2 text-[10px] text-[var(--chat-muted)] space-y-0.5">
                  <div>Route: {message.routeMetadata.route} | Classification: {message.routeMetadata.classification || 'n/a'}</div>
                  {message.routeMetadata.stageTimings.map((stage, i) => (
                    <div key={i}>{stage.model}: {stage.durationMs}ms</div>
                  ))}
                  <div>Total: {message.routeMetadata.totalDurationMs}ms</div>
                </div>
              )}

              {/* Message text */}
              <div className="text-[var(--chat-text)] text-sm leading-[1.8] break-words [&_strong]:font-semibold [&_strong]:text-[var(--chat-text)] [&_em]:italic">
                {parseMarkdownBold(messageText)}
              </div>

              {/* Sources */}
              {!isStreaming && (message as any).knowledgeBaseEnabled !== false && message.sources && message.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--chat-border)] flex items-center justify-between">
                  <span className="text-xs text-[var(--chat-muted)]">{message.sources.length} source{message.sources.length !== 1 ? 's' : ''}</span>
                  {onViewSources && (
                    <button onClick={onViewSources} className="text-xs text-brand-yellow hover:text-brand-yellow/80 transition-colors">
                      View Sources
                    </button>
                  )}
                </div>
              )}

              {/* Timestamp + actions at bottom */}
              {!isStreaming && message.id && (
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <MessageTimestamp timestamp={message.timestamp} className="text-[11px] text-[var(--chat-muted)]" />
                  <MessageHoverActions
                    messageIndex={messageIndex}
                    message={message as any}
                    onRegenerate={onRegenerate}
                    onViewSources={onViewSources}
                    isAssistant={true}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(MessageBubble, (prev, next) =>
  prev.message.id === next.message.id &&
  prev.message.text === next.message.text &&
  prev.message.content === next.message.content &&
  prev.message.sender === next.message.sender &&
  prev.isStreaming === next.isStreaming &&
  prev.variant === next.variant &&
  prev.messageIndex === next.messageIndex
);
