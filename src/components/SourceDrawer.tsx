
import React from 'react';
import { X, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

import { getDisplayLabel, getMediaTypeColor } from '@/utils/namespaceConfig';

// Define the source data structure to match what comes from Pinecone
interface SourceData {
  id: string;
  title: string;
  url?: string;
  domain?: string;
  subdomain?: string;
  category?: string;
  excerpt?: string;
  type?: 'PDF' | 'Article' | 'Document';
  mediaType?: string;
  externalUrl?: string;
  pdfUrl?: string;
  originalMetadata?: any;
  date?: string;
  page?: string;
}

interface SourceDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceData: SourceData | null;
  allSources?: SourceData[];
  initialSource?: SourceData | null;
}

// Color mapping for domains and subdomains based on subject relevance
const getDomainColor = (domain: string) => {
  const normalizedDomain = domain.toLowerCase();
  
  if (normalizedDomain.includes('character')) {
    return 'bg-blue-100 text-blue-800';
  }
  if (normalizedDomain.includes('competency')) {
    return 'bg-green-100 text-green-800';
  }
  if (normalizedDomain.includes('chemistry')) {
    return 'bg-purple-100 text-purple-800';
  }
  if (normalizedDomain.includes('strategy') || normalizedDomain.includes('business')) {
    return 'bg-orange-100 text-orange-800';
  }
  if (normalizedDomain.includes('team') || normalizedDomain.includes('people')) {
    return 'bg-pink-100 text-pink-800';
  }
  if (normalizedDomain.includes('process') || normalizedDomain.includes('operations')) {
    return 'bg-yellow-100 text-yellow-800';
  }
  // Default
  return 'bg-slate-100 text-slate-700';
};

const getSubdomainColor = (subdomain: string) => {
  const normalizedSubdomain = subdomain.toLowerCase();
  
  if (normalizedSubdomain.includes('identity') || normalizedSubdomain.includes('purpose')) {
    return 'bg-indigo-100 text-indigo-800';
  }
  if (normalizedSubdomain.includes('overcoming') || normalizedSubdomain.includes('limiters')) {
    return 'bg-red-100 text-red-800';
  }
  if (normalizedSubdomain.includes('teamwork') || normalizedSubdomain.includes('team')) {
    return 'bg-pink-100 text-pink-800';
  }
  if (normalizedSubdomain.includes('problem') || normalizedSubdomain.includes('solving')) {
    return 'bg-teal-100 text-teal-800';
  }
  if (normalizedSubdomain.includes('planning') || normalizedSubdomain.includes('execution')) {
    return 'bg-yellow-100 text-yellow-800';
  }
  if (normalizedSubdomain.includes('ae specific')) {
    return 'bg-orange-100 text-orange-800';
  }
  if (normalizedSubdomain.includes('relating')) {
    return 'bg-emerald-100 text-emerald-800';
  }
  if (normalizedSubdomain.includes('communication') || normalizedSubdomain.includes('influence')) {
    return 'bg-purple-100 text-purple-800';
  }
  // Default
  return 'bg-slate-200 text-slate-700';
};



const SourceDrawer: React.FC<SourceDrawerProps> = ({ 
  open, 
  onOpenChange,
  sourceData,
  allSources = [],
  initialSource = null
}) => {
  const sourceRefs = React.useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const SCROLL_TOP_OFFSET = 16; // consistent breathing room above the active source
  const [pulseKey, setPulseKey] = React.useState(0);

  // Use allSources if available, otherwise use single sourceData
  const sources = allSources.length > 0 ? allSources : (sourceData ? [sourceData] : []);

  // Resolve the index of the active source. Prefer citationNumber (1-based)
  // because source.id can repeat when multiple chunks come from the same doc.
  const activeIndex = React.useMemo(() => {
    if (!initialSource) return -1;
    const cn = (initialSource as any).citationNumber;
    if (typeof cn === 'number' && cn >= 1 && cn <= sources.length) return cn - 1;
    const idx = sources.findIndex((s) => s.id === initialSource.id);
    return idx;
  }, [initialSource, sources]);

  // Scroll the active citation into view. Wait for drawer slide-in + framer
  // entrance animations to settle so layout is stable, then poll until the
  // target ref exists and its rect matches its final position.
  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    let attempts = 0;
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    if (activeIndex < 0) return;
    // Trigger the immediate flash/pulse on the active source as soon as the
    // drawer opens (or the active source changes), independent of scroll.
    setPulseKey((k) => k + 1);

    const tryScroll = () => {
      if (cancelled) return;
      const container = scrollContainerRef.current;
      const element = sourceRefs.current.get(activeIndex);
      if (container && element) {
        const top =
          element.getBoundingClientRect().top -
          container.getBoundingClientRect().top +
          container.scrollTop -
          SCROLL_TOP_OFFSET;
        const target = Math.max(0, Math.min(top, container.scrollHeight - container.clientHeight));
        container.scrollTo({ top: target, behavior: 'smooth' });
        return;
      }
      if (attempts++ < 40) setTimeout(tryScroll, 50);
    };
    // Wait for drawer slide-in + brief framer entrance delays to settle so
    // getBoundingClientRect is final, then scroll smoothly to the target.
    const settleMs = 400 + Math.min(activeIndex, 5) * 40 + 60;
    const t = setTimeout(tryScroll, settleMs);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, activeIndex, sources.length]);

  if (!open || sources.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-[var(--chat-sidebar)] shadow-xl"
      >
        <div
          ref={scrollContainerRef}
          className="w-full h-full p-4 sm:p-6 overflow-y-auto scroll-smooth bg-[var(--chat-sidebar)] shadow-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-heading text-[var(--chat-text)]">
              Sources
            </h2>
            <button
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-2 hover:bg-[var(--chat-card)] transition-colors"
            >
              <X className="h-5 w-5 text-[var(--chat-muted)]" />
            </button>
          </div>

          {/* Sources count */}
          <p className="text-sm text-[var(--chat-muted)] mb-6">
            {sources.length} source{sources.length > 1 ? 's' : ''} cited
          </p>

          {/* Sources List */}
          {sources.map((source, index) => {
            const primaryUrl = source.url || source.externalUrl || source.pdfUrl || '';
            const isInitialSource = index === activeIndex;
            const citationNumber = (source as any).citationNumber;

            return (
              <motion.div
                key={`${source.id}-${index}`}
                ref={(el) => {
                  if (el) sourceRefs.current.set(index, el);
                  else sourceRefs.current.delete(index);
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: Math.min(index, 5) * 0.04 }}
                className={`mb-8 pb-6 border-b last:border-b-0 last:pb-0 transition-all ${
                  isInitialSource
                    ? 'relative bg-brand-yellow/15 -mx-4 px-4 py-4 rounded-lg border border-brand-yellow/40 border-l-4 border-l-brand-yellow shadow-sm ring-1 ring-brand-yellow/30'
                    : ''
                }`}
              >
                {isInitialSource && (
                  <>
                    <span
                      key={`marker-${pulseKey}`}
                      aria-hidden
                      className="pointer-events-none absolute -left-1 top-2 bottom-2 w-1 rounded-full bg-brand-yellow active-marker-glow"
                    />
                    <span
                      key={`pulse-${pulseKey}`}
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-lg source-pulse"
                    />
                  </>
                )}
                {/* Citation number badge */}
                {citationNumber && (
                  <div className="inline-flex items-center justify-center w-7 h-7 mb-3 
                                  text-sm font-bold text-blue-600 bg-blue-100 rounded-full 
                                  border-2 border-blue-200">
                    {citationNumber}
                  </div>
                )}

                {/* Metadata badges: Domain > Subdomain > Category > Media Type */}
                <div className="mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {((source as any).source === 'project_kb' || source.mediaType === 'Project Knowledge Base') && (
                      <span className="bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/40 text-xs px-3 py-1 rounded-md font-semibold inline-flex items-center gap-1">
                        📁 Project Knowledge Base
                      </span>
                    )}
                    {((source as any).source === 'chat_attachment' || source.mediaType === 'Chat Attachment' || source.mediaType === 'Chat Image') && (
                      <span className="bg-brand-blue/15 text-brand-blue border border-brand-blue/40 text-xs px-3 py-1 rounded-md font-semibold inline-flex items-center gap-1">
                        📎 {source.mediaType === 'Chat Image' ? 'Chat Image' : 'Chat Attachment'}
                      </span>
                    )}
                    {source.domain && source.domain !== 'Project Knowledge Base' && (
                      <span className={`${getDomainColor(source.domain)} text-xs px-3 py-1 rounded-md font-semibold inline-flex items-center`}>
                        {source.domain}
                      </span>
                    )}

                    {source.subdomain && (
                      <span className={`${getSubdomainColor(source.subdomain)} text-xs px-3 py-1 rounded-md font-semibold inline-flex items-center`}>
                        {source.subdomain}
                      </span>
                    )}

                    {source.category && (
                      <span className="bg-[var(--chat-card-2)] text-[var(--chat-text)] border border-[var(--chat-border)] text-xs px-3 py-1 rounded-md font-medium inline-flex items-center">
                        {source.category}
                      </span>
                    )}

                    {source.mediaType && source.mediaType !== 'Project Knowledge Base' && source.mediaType !== 'Chat Attachment' && source.mediaType !== 'Chat Image' && (
                      <span className={`${getMediaTypeColor(source.mediaType)} text-xs px-3 py-1 rounded-md font-semibold inline-flex items-center gap-1 border`}>
                        📁 {source.mediaType}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title (not clickable) */}
                <h3 className="text-base sm:text-lg font-semibold text-[var(--chat-text)] mb-1 mt-2">
                  {source.title}
                </h3>

                {/* Full Sourcing Coming Soon indicator */}
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/70 italic">
                    <Clock className="h-3 w-3" /> Full Sourcing – Coming Soon
                  </span>
                </div>

                {/* Excerpt (without title) */}
                {source.excerpt && (
                  <div className="text-xs text-muted-foreground border-l-2 border-primary/30 pl-3 py-2 italic">
                    "{source.excerpt}"
                  </div>
                )}

              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};

export default SourceDrawer;
