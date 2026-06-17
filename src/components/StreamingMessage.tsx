import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useSourceDrawer } from '@/hooks/useSourceDrawer';
import { normalizePineconeMatch, deduplicateSources } from '@/utils/normalizePineconeMatch';
import { parseMarkdownBold } from '@/utils/markdownParser';
import { formatMessageMetadata } from '@/utils/messageMetadataLabels';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import MessageHoverActions from './MessageHoverActions';
import MessageTimestamp from './MessageTimestamp';
import CitationPills from './chat/CitationPills';
import { useBrand } from '@/context/BrandContext';

interface StreamingMessageProps {
  message: any;
  messageIndex: number;
  onRegenerate?: (index: number) => void;
  onEdit?: (index: number) => void;
  isStreaming?: boolean;
  onStreamComplete?: () => void;
}

const StreamingMessage = ({ 
  message, 
  messageIndex, 
  onRegenerate, 
  onEdit,
  isStreaming = false,
  onStreamComplete
}: StreamingMessageProps) => {
  const { user } = useAuth();
  const { openSourceDrawer } = useSourceDrawer();
  const { activeBrand } = useBrand();
  const isWhiteLabel = !!activeBrand;
  const [showContent, setShowContent] = useState(!!message.content);
  const [currentLength, setCurrentLength] = useState<string>('medium');

  // Fetch length preference from localStorage
  useEffect(() => {
    const storedLength = localStorage.getItem('preferredLength') || 'medium';
    setCurrentLength(storedLength);
  }, []);

  // Show content as soon as we have any content (during OR after streaming)
  useEffect(() => {
    if (message.content) {
      setShowContent(true);
    }
  }, [message.content]);

  // Call onStreamComplete when streaming finishes
  useEffect(() => {
    if (message.content && !isStreaming && onStreamComplete) {
      onStreamComplete();
    }
  }, [message.content, isStreaming, onStreamComplete]);


  // Clean message content: remove source list that LLM adds at the end
  // NOTE: We now KEEP citation markers [1], [2], etc. for the citation engine
  const cleanedContent = React.useMemo(() => {
    if (!message.content) return '';
    
    let cleaned = message.content;
    
    // Step 1: KEEP citation markers - they will be parsed by the citation engine
    // OLD: cleaned = cleaned.replace(/\[\d+\]/g, ''); // REMOVED - DON'T STRIP CITATIONS
    
    // Step 2: AGGRESSIVELY remove reference lists at the end
    // Pattern A: Remove everything after "Sources:", "References:", etc.
    cleaned = cleaned.replace(/\n+(?:Sources?|References?|Citations?|Bibliography):?\s*[\s\S]*$/i, '');
    
    // Pattern B: "1: Title" format (colon-based lists) - multiple variations
    cleaned = cleaned.replace(/\n+\d+:\s+[^\n]+(\n+\d+:\s+[^\n]+)*\s*$/g, '');
    
    // Pattern C: "1. Title" format (period-based numbered lists at end)
    cleaned = cleaned.replace(/\n+\d+\.\s+[A-Z][^\n]+(\n+\d+\.\s+[A-Z][^\n]+)*\s*$/g, '');
    
    // Pattern D: Standalone citation numbers at end like "123" or "1234"
    cleaned = cleaned.replace(/\n+\d{2,}\s*$/g, '');
    
    // Pattern E: Date-based source format "12022-09-09 Title"
    cleaned = cleaned.replace(/\n+\d{1,2}\d{4}-\d{2}-\d{2}\s+[\s\S]*$/g, '');
    
    // Pattern F: Quoted reference format '"title" citation'
    cleaned = cleaned.replace(/\n+\d+:\s*["""][^"""\n]+["""][\s\S]*$/g, '');
    
    // Step 3: Clean trailing incomplete citation brackets (e.g., "[", "[1")
    cleaned = cleaned.replace(/\[(?:\d*)?$/g, '');
    // Clean raw citation clusters like [1][2][3] (3+ consecutive)
    cleaned = cleaned.replace(/(\[\d+\]){3,}/g, '');
    
    // Step 4: Clean up whitespace
    cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.replace(/^\s*\.+\s*$/gm, '');
    
    return cleaned.trim();
  }, [message.content]);

  const handleViewSources = () => {
    if (message.sources && message.sources.length > 0) {
      
      // Transform all sources to the expected format - PRESERVE domain/subdomain/category
      const normalizedSources = message.sources.map((source: any, index: number) => 
        normalizePineconeMatch({
          id: source.id || `source-${index}-${Date.now()}`,
          metadata: {
            title: source.title,
            url: source.url || source.externalUrl || source.pdfUrl,
            text: source.originalMetadata?.text || source.excerpt || 'No excerpt available',
            blobType: source.originalMetadata?.blobType,
            'loc.lines.from': source.originalMetadata?.['loc.lines.from'],
            'loc.lines.to': source.originalMetadata?.['loc.lines.to'],
            // Ensure namespace is present for mediaType detection
            namespace: source.originalMetadata?.namespace || source.namespace,
            // PRESERVE CLASSIFICATION DATA FROM EDGE FUNCTION
            domain: source.domain,
            subdomain: source.subdomain,
            category: source.category,
            tags: source.tags,
            ...source.originalMetadata
          }
        })
      );
      
      // Use enhanced deduplication that merges excerpts
      const uniqueSources = deduplicateSources(normalizedSources);
      
      // Open drawer with deduplicated sources
      openSourceDrawer(uniqueSources[0], uniqueSources);
    }
  };


  const resolvedTimestamp = (() => {
    const raw = message.createdAt || message.timestamp;
    if (!raw) return new Date();
    const d = typeof raw === 'string' ? new Date(raw) : raw;
    return d instanceof Date && !isNaN(d.getTime()) ? d : new Date();
  })();

  return (
    <div className="mb-6 w-full animate-fade-in-left">
      <div className="max-w-3xl mx-auto px-6">
        {/* Avatar + sender row */}
        <div className={cn("flex items-center gap-2.5", isWhiteLabel ? "mb-1" : "mb-3")}>
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
          {/* Route badge inline */}
          {message.routeMetadata?.route && !isStreaming && (
            <Badge variant="secondary" className="text-[10px] font-medium gap-1 px-2 py-0.5 bg-brand-yellow/10 text-brand-yellow border-brand-yellow/20">
              {message.routeMetadata.route === 'chatgpt-claude' ? '🔗 ChatGPT · Claude' :
               message.routeMetadata.route === 'chatgpt' ? '🤖 ChatGPT' :
               message.routeMetadata.route === 'claude' ? '🧠 Claude' :
               message.routeMetadata.route === 'gemini' ? '✨ Gemini' : message.routeMetadata.route}
            </Badge>
          )}
        </div>

        {/* Free-floating content — GPT style, no card box */}
        <div className={isWhiteLabel ? "ml-0" : "ml-10"}>
          <div className={cn(
            "text-[var(--chat-text)] text-sm leading-[1.8] [&_strong]:font-semibold [&_strong]:text-[var(--chat-text)] [&_em]:italic transition-opacity duration-300",
            message.content ? 'opacity-100 animate-fade-in' : 'opacity-0'
          )}>
            {parseMarkdownBold(cleanedContent, currentLength, message.sources)}
          </div>

          {/* Sources — hidden when KB was disabled for this message */}
          {!isStreaming && message.knowledgeBaseEnabled !== false && message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--chat-border)] flex items-center justify-between">
              <span className="text-xs text-[var(--chat-muted)]">{message.sources.length} source{message.sources.length !== 1 ? 's' : ''}</span>
              <button onClick={handleViewSources} className="text-xs text-brand-yellow hover:text-brand-yellow/80 transition-colors">
                View Sources
              </button>
            </div>
          )}

          {/* File citations from doc-grounded replies */}
          {!isStreaming && message.fileCitations && message.fileCitations.length > 0 && (
            <CitationPills citations={message.fileCitations} />
          )}
          {!isStreaming && message.truncatedDocs && (
            <div className="mt-2 text-[11px] text-[var(--chat-muted)] italic">
              Document context was truncated to fit the model.
            </div>
          )}

          {/* Timestamp + metadata + actions */}
          <div className={`mt-3 flex items-center gap-2 flex-wrap ${showContent ? '' : 'invisible'}`}>
            <MessageTimestamp timestamp={resolvedTimestamp} className="text-[11px] text-[var(--chat-muted)]" />
            {(message.responseStyle || message.model) && (
              <span className="text-[11px] text-[var(--chat-muted)]">· {formatMessageMetadata(message.responseStyle, message.model, message.knowledgeBaseEnabled, message.processingPower)}</span>
            )}
            {message.intent === 'stopped' && (
              <span className="text-[11px] text-[var(--chat-muted)]">· ⏹ Stopped</span>
            )}
            <MessageHoverActions
              message={message}
              messageIndex={messageIndex}
              onRegenerate={onRegenerate}
              onViewSources={message.knowledgeBaseEnabled !== false && message.sources && message.sources.length > 0 ? handleViewSources : undefined}
              isAssistant={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreamingMessage;