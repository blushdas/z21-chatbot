
import React from 'react';
import { FileText, ExternalLink } from 'lucide-react';
import { useSourceDrawer } from '@/hooks/useSourceDrawer';

interface ViewSourceLinkProps {
  citation: string;
  className?: string;
  showIcon?: boolean;
  variant?: 'default' | 'minimal';
  sourceData?: any;
}

const ViewSourceLink: React.FC<ViewSourceLinkProps> = ({ 
  citation, 
  className = "",
  showIcon = true,
  variant = 'default',
  sourceData = null
}) => {
  const { openSourceDrawer } = useSourceDrawer();
  
  const handleViewSource = () => {
    // If we have source data from Pinecone, use it directly
    if (sourceData) {
      // Extract URL from Pinecone source data (prioritize metadata.url)
      const extractUrl = (source: any) => {
        // First check originalMetadata.url (this is the Pinecone URL)
        if (source.originalMetadata?.url) {
          return source.originalMetadata.url;
        }
        
        // Then check direct URL fields
        const directUrls = [
          source.url,
          source.externalUrl, 
          source.pdfUrl
        ];
        
        for (const url of directUrls) {
          if (url && typeof url === 'string' && url.trim() && url.startsWith('http')) {
            return url.trim();
          }
        }
        
        return null;
      };
      
      const extractedUrl = extractUrl(sourceData);
      
      // Determine mediaType from namespace if not already set
    const getMediaType = (source: any): string => {
      // Return existing mediaType if available
      if (source.mediaType) return source.mediaType;
      
      const namespace = source.originalMetadata?.namespace || source.namespace || '';
      const title = source.title || source.originalMetadata?.title || '';

      // Learning Time Transcripts (Daryle-Transcripts namespace)
      if (namespace === 'Daryle-Transcript-Metadata' || 
          namespace === 'Daryle-Transcripts' || 
          namespace.includes('Transcript')) {
        return 'Learning Time Transcript';
      }

      // Daryle Emails
      if (namespace.includes('Email') || title.toLowerCase().includes('email')) {
        return 'Daryle Email';
      }

      // Project Smart Articles (Daryle namespace but NOT transcripts or emails)
      if (namespace === 'Daryle' || (namespace.includes('Daryle') && !namespace.includes('Transcript') && !namespace.includes('Email'))) {
        return 'Project Smart Article';
      }

      // Documents (PDFs)
      const blobType = source.originalMetadata?.blobType || source.blobType;
      if (blobType === 'application/pdf' || title.endsWith('.pdf')) {
        return 'Document';
      }

      // Default to Other
      return 'Other';
    };
      
      // Transform Pinecone source data to SourceDrawer format
      const drawerData = {
        id: `source-${Date.now()}`,
        title: sourceData.title || citation.replace("Source: ", ""),
        type: (sourceData.type as 'PDF' | 'Article' | 'Document') || 'Document',
        date: sourceData.date || new Date().getFullYear().toString(),
        page: sourceData.page || (sourceData.originalMetadata ? `Lines ${sourceData.originalMetadata['loc.lines.from']}-${sourceData.originalMetadata['loc.lines.to']}` : undefined),
        excerpt: sourceData.originalMetadata?.text ? sourceData.originalMetadata.text.substring(0, 200) + "..." : "Click 'Open' to view the complete document",
        tags: sourceData.tags || ["Leadership & Self Deception"],
        domain: sourceData.domain,
        subdomain: sourceData.subdomain,
        category: sourceData.category,
        mediaType: getMediaType(sourceData),
        url: extractedUrl || '#no-url',
        externalUrl: extractedUrl,
        pdfUrl: extractedUrl,
        originalMetadata: sourceData.originalMetadata
      };
      
      openSourceDrawer(drawerData);
      return;
    }

    // Fallback: create a basic source data object for legacy citations
    const fallbackSource = {
      id: `source-${Date.now()}`,
      title: citation.replace("Source: ", ""),
      type: 'Document' as const,
      date: new Date().getFullYear().toString(),
      excerpt: "Unable to retrieve source details. The document may not be available in the knowledge base.",
      tags: ["Reference"]
    };
    openSourceDrawer(fallbackSource);
  };
  
  if (variant === 'minimal') {
    return (
      <button 
        className={`text-brand-green hover:text-brand-green/80 cursor-pointer transition-colors ${className}`}
        onClick={handleViewSource}
        title="View source details"
      >
        {showIcon && <FileText className="w-3 h-3 inline mr-1" />}
        Source
      </button>
    );
  }
  
  return (
    <button 
      className={`text-sm text-brand-green hover:text-brand-green/80 cursor-pointer flex items-center transition-colors group ${className}`}
      onClick={handleViewSource}
    >
      {showIcon && <FileText className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" />}
      <span className="underline underline-offset-2">View Full Source</span>
      <ExternalLink className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
};

export default ViewSourceLink;
