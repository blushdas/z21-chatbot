
import React, { useState } from 'react';
import { ExternalLink, AlertCircle, FileText } from 'lucide-react';
import ViewSourceLink from './ViewSourceLink';
import TagPill from './TagPill';
import { deduplicateSources } from '@/utils/normalizePineconeMatch';
import { SourceData } from '@/hooks/useSourceDrawer';
import { toast } from 'sonner';

interface MessageSourcesProps {
  sources: Array<{
    title: string;
    url?: string;
    externalUrl?: string;
    pdfUrl?: string;
    originalMetadata?: any;
    [key: string]: any;
  }>;
}

const MessageSources: React.FC<MessageSourcesProps> = ({ sources }) => {
  const [clickedUrls, setClickedUrls] = useState<Set<string>>(new Set());

  if (!sources || sources.length === 0) {
    return null;
  }

  // Convert sources to SourceData format with required id field
  const sourcesWithIds: SourceData[] = sources.map((source, index) => ({
    id: source.id || `source-${index}-${Date.now()}`,
    title: source.title,
    url: source.url,
    externalUrl: source.externalUrl,
    pdfUrl: source.pdfUrl,
    originalMetadata: source.originalMetadata,
    type: source.type || 'Document',
    date: source.date || new Date().getFullYear().toString(),
    page: source.page,
    excerpt: source.excerpt,
    ...source
  }));

  // Deduplicate sources before rendering
  const deduplicatedSources = deduplicateSources(sourcesWithIds);

  // Get the working URL from Pinecone source data
  const getBestUrl = (source: any) => {
    // Prioritize the originalMetadata.url (this is the Pinecone URL)
    if (source.originalMetadata?.url) {
      return source.originalMetadata.url;
    }
    
    // Then check other possible URL fields
    const possibleUrls = [
      source.url,
      source.externalUrl,
      source.pdfUrl
    ];
    
    for (const url of possibleUrls) {
      if (url && typeof url === 'string' && url.trim() && url.startsWith('http')) {
        return url.trim();
      }
    }
    
    return null;
  };

  // Handle source click with validation
  const handleSourceClick = (url: string, title: string) => {
    // Check if it's a Google Drive URL
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)?.[1];
      
      // Mark as clicked
      setClickedUrls(prev => new Set(prev).add(url));
      
      // Show warning toast
      toast.warning('Opening Google Drive Link', {
        description: `If "${title}" doesn't open, the file may have been moved or permissions changed. Check the console for details.`,
        duration: 5000,
      });
      
      // Log for debugging
      console.warn('🔗 Google Drive link clicked:', {
        title,
        url,
        fileId: fileId || 'Invalid file ID format',
      });
    }
  };

  // Check if source is a user-uploaded document
  const isUserDocument = (source: any) => {
    return source.originalMetadata?.source_type === 'user_document' ||
           source.source_type === 'user_document';
  };

  // Get media type icon/prefix
  const getMediaTypeIcon = (mediaType?: string, isUserDoc?: boolean) => {
    if (isUserDoc) return '📄';
    
    switch (mediaType) {
      case 'Project Smart Article':
        return '📁';
      case 'Learning Time Transcript':
        return '🎙️';
      case 'Daryle Email':
        return '📧';
      case 'Document':
        return '📄';
      default:
        return '📎';
    }
  };

  return (
    <div className="mt-4 space-y-3 border border-[var(--chat-border)] rounded-lg p-3 bg-[var(--chat-card)]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-[var(--chat-text)]">
          Sources ({deduplicatedSources.length})
          {sourcesWithIds.length !== deduplicatedSources.length && (
            <span className="text-xs text-[var(--chat-muted)] ml-1">
              ({sourcesWithIds.length - deduplicatedSources.length} duplicates removed)
            </span>
          )}
        </div>
      </div>

      {/* Highlight when user documents are used */}
      {deduplicatedSources.filter(isUserDocument).length > 0 && (
        <div className="bg-[var(--chat-card-2)] border border-[var(--chat-border)] rounded-md px-3 py-2">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-brand-yellow flex-shrink-0" />
            <span className="text-sm font-medium text-[var(--chat-text)]">
              📄 Referenced {deduplicatedSources.filter(isUserDocument).length} section
              {deduplicatedSources.filter(isUserDocument).length !== 1 ? 's' : ''} from your uploaded PDFs
            </span>
          </div>
        </div>
      )}
      
      {/* PDF Open Buttons with Media Type Tags */}
      <div className="flex flex-wrap gap-2 mb-3">
        {deduplicatedSources
          .sort((a, b) => {
            // 🚀 Sort user documents FIRST
            const aIsUser = isUserDocument(a);
            const bIsUser = isUserDocument(b);
            if (aIsUser && !bIsUser) return -1;
            if (!aIsUser && bIsUser) return 1;
            return 0;
          })
          .map((source, index) => {
          const bestUrl = getBestUrl(source);
          const isUserDoc = isUserDocument(source);
          
          if (!bestUrl) return null;
          
          const isGoogleDrive = bestUrl.includes('drive.google.com');
          const wasClicked = clickedUrls.has(bestUrl);
          
          return (
            <div key={`source-container-${index}`} className="flex flex-col gap-1.5 relative">
              {isUserDoc && (
                <div className="absolute -top-1.5 -right-1.5 z-10">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800 border border-blue-300 shadow-sm">
                    📄 Your Upload
                  </span>
                </div>
              )}
              <a
                href={bestUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleSourceClick(bestUrl, source.title)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open PDF {deduplicatedSources.length > 1 ? `${index + 1}` : ''}
                {isGoogleDrive && wasClicked && (
                  <AlertCircle className="w-3 h-3 ml-2 opacity-80" />
                )}
              </a>
              <div className="flex items-center gap-1.5 flex-wrap">
                {source.mediaType && (
                  <>
                    <span className="text-xs">{getMediaTypeIcon(source.mediaType)}</span>
                    <TagPill 
                      label={source.mediaType} 
                      variant="outline" 
                      size="xs"
                    />
                  </>
                )}
                {isGoogleDrive && (
                  <TagPill 
                    label="Google Drive" 
                    variant="outline" 
                    size="xs"
                    className="text-yellow-600 border-yellow-300"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* View Source Links */}
      <div className="flex flex-wrap gap-2 border-t border-[var(--chat-border)] pt-2">
        {deduplicatedSources.map((source, index) => (
          <ViewSourceLink 
            key={`source-${index}`}
            citation={source.title}
            sourceData={source}
            className="text-xs"
          />
        ))}
      </div>
    </div>
  );
};

export default MessageSources;
