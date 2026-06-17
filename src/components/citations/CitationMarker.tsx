import React from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { SourceData, useSourceDrawer } from '@/hooks/useSourceDrawer';
import { useCitationVisibility } from '@/context/CitationVisibilityContext';
import { getMediaTypeColor } from '@/utils/namespaceConfig';

interface CitationMarkerProps {
  citationNumber: number;
  sourceData: SourceData;
  allSources: SourceData[];
  excerpt?: string;
  className?: string;
}

const CitationMarker: React.FC<CitationMarkerProps> = ({
  citationNumber,
  sourceData,
  allSources,
  excerpt,
  className = ''
}) => {
  const { openSourceDrawer } = useSourceDrawer();
  const { citationsVisible } = useCitationVisibility();

  // Hide citation if visibility is toggled off
  if (!citationsVisible) {
    return null;
  }

  const handleCitationClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Add citation numbers to all sources for drawer display
    const sourcesWithCitations = allSources.map((src, idx) => ({
      ...src,
      citationNumber: idx + 1
    }));

    // Add citation number to the clicked source
    const sourceWithCitation = {
      ...sourceData,
      citationNumber
    };

    // Open drawer with the clicked source highlighted
    openSourceDrawer(sourceWithCitation, sourcesWithCitations);
  };

  // Truncate excerpt for tooltip (max 150 chars)
  const truncatedExcerpt = excerpt && excerpt.length > 150 
    ? excerpt.substring(0, 150) + '...'
    : excerpt || 'No excerpt available';

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <button
          onClick={handleCitationClick}
          className={`citation-marker inline-flex items-center justify-center
                     text-blue-600 hover:text-blue-700 hover:underline
                     cursor-pointer transition-colors
                     font-semibold text-xs
                     ml-0.5 ${className}`}
          style={{ verticalAlign: 'super', fontSize: '0.75em' }}
          aria-label={`View source ${citationNumber}`}
        >
          [{citationNumber}]
        </button>
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 p-4 bg-[var(--chat-card)] shadow-elevated rounded-lg border border-[var(--chat-border)]"
        side="top"
        align="start"
      >
        <div className="space-y-2">
          {/* Citation number badge */}
          <div className="inline-flex items-center justify-center w-6 h-6 
                         text-xs font-bold text-primary bg-primary/15 rounded-full 
                         border-2 border-primary/30 mb-2">
            {citationNumber}
          </div>
          
          {/* Excerpt */}
          <div className="text-xs text-[var(--chat-text-muted)] italic line-clamp-3 border-l-2 border-primary/40 pl-3">
            "{truncatedExcerpt}"
          </div>
          
          {/* Source title */}
          <div className="text-sm font-semibold text-[var(--chat-text)] mt-2">
            {sourceData.title}
          </div>
          
          {/* Media type badge */}
          {sourceData.mediaType && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded border ${getMediaTypeColor(sourceData.mediaType)}`}>
                {sourceData.mediaType}
              </span>
            </div>
          )}
          
          {/* Click prompt */}
          <button 
            onClick={handleCitationClick}
            className="text-xs text-primary hover:text-primary/80 font-medium mt-2 
                       flex items-center gap-1 hover:underline"
          >
            View full source →
          </button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export default CitationMarker;
