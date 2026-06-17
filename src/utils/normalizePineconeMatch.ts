
import { SourceData } from '@/hooks/useSourceDrawer';
import { getDisplayLabel } from './namespaceConfig';

// Extract a meaningful title from Google Drive URL (fallback only)
function extractTitleFromUrl(url: string): string {
  if (!url) return "Document";
  
  // For Google Drive URLs, extract the file ID and create a more meaningful title
  if (url.includes('drive.google.com/file/d/')) {
    const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileIdMatch) {
      const fileId = fileIdMatch[1];
      // Use last 8 characters of file ID for distinction
      return `Document (${fileId.slice(-8)})`;
    }
  }
  
  // For other URLs, try to extract a filename or use domain
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    if (filename && filename.length > 0 && filename !== '/') {
      // Remove file extension and clean up
      const cleanName = filename.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      return cleanName.charAt(0).toUpperCase() + cleanName.slice(1) || "Document";
    }
    
    return `Document (${urlObj.hostname})`;
  } catch {
    return "Document";
  }
}

export function normalizePineconeMatch(match: any): SourceData {
  const meta = match.metadata || {};
  
  // Simple pass-through - trust backend processing
  let title = meta.title || "Document";
  
  // Basic title cleanup only
  if (title.endsWith('.pdf')) {
    title = title.replace('.pdf', '').replace(/_/g, ' ');
    title = title.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }
  
  if (title === "Document" && meta.url) {
    title = extractTitleFromUrl(meta.url);
  }

  // Use backend-provided classification
  const namespace = meta.namespace || '';
  const sourceType = meta.source_type || '';
  const mediaType = getDisplayLabel(namespace, sourceType);

  return {
    id: match.id,
    title: title,
    url: meta.url,
    pdfUrl: meta.url,
    domain: meta.domain || '',
    subdomain: meta.subdomain || '',
    category: meta.category || '',
    mediaType: mediaType,
    excerpt: meta.text,
    type: meta.type || 'Document',
    date: meta.date || new Date().getFullYear().toString(),
    page: undefined,
    originalMetadata: meta
  };
}

// Enhanced function to deduplicate sources and merge excerpts from same document
export function deduplicateSources(sources: SourceData[]): SourceData[] {
  
  // Create a map to track unique sources and merge excerpts
  const uniqueSourcesMap = new Map<string, SourceData & { excerpts: string[] }>();
  
  sources.forEach(source => {
    // Use title + URL + source-bucket combination for deduplication so
    // project KB items (no URL) can never collapse into same-titled global
    // archive entries.
    const bucket = (source as any).source || (source as any).mediaType || '';
    // Chat attachments must NEVER merge — two same-named PDFs are distinct
    // sources tied to distinct [N] citation pills. Key by id when present.
    const isChatAttachment = bucket === 'chat_attachment' || bucket === 'Chat Attachment' || bucket === 'Chat Image';
    const key = isChatAttachment
      ? `chat-attachment|||${source.id || `${source.title}|||${Math.random()}`}`
      : `${source.title}|||${source.url || source.pdfUrl || 'no-url'}|||${bucket}`;
    
    if (!uniqueSourcesMap.has(key)) {
      // First occurrence - initialize with current excerpt
      uniqueSourcesMap.set(key, {
        ...source,
        excerpts: source.excerpt ? [source.excerpt] : []
      });
    } else {
      // Duplicate found - merge excerpts if different
      const existing = uniqueSourcesMap.get(key)!;
      
      if (source.excerpt && !existing.excerpts.includes(source.excerpt)) {
        existing.excerpts.push(source.excerpt);
      }
      
      // Keep the source with more complete information
      const existingHasDetails = !!existing.originalMetadata && Object.keys(existing.originalMetadata).length > 0;
      const currentHasDetails = !!source.originalMetadata && Object.keys(source.originalMetadata).length > 0;
      
      if (currentHasDetails && !existingHasDetails) {
        // Keep new source data but preserve merged excerpts
        const mergedExcerpts = existing.excerpts;
        uniqueSourcesMap.set(key, {
          ...source,
          excerpts: mergedExcerpts
        });
      }
    }
  });
  
  // Convert back to SourceData array with merged excerpts
  const deduplicated = Array.from(uniqueSourcesMap.values()).map(source => ({
    ...source,
    // Combine all excerpts into one, separated by "..." if multiple
    excerpt: source.excerpts.length > 1 
      ? source.excerpts.slice(0, 3).join(' ... ') // Limit to first 3 excerpts to avoid overly long text
      : source.excerpts[0] || 'No excerpt available'
  }));
  
  return deduplicated;
}
