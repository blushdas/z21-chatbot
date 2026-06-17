
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X, ExternalLink } from "lucide-react";
import { SourceData } from '@/data/mockSourceData';

interface SourceComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: SourceData[];
}

const SourceComparisonModal: React.FC<SourceComparisonModalProps> = ({
  open,
  onOpenChange,
  sources
}) => {
  const handleAskAboutSource = (sourceId: string) => {
    onOpenChange(false);
  };

  // Don't show the modal if there's only one source or no sources
  if (!sources || sources.length <= 1) {
    return null;
  }

  // Extract domain and subdomain from source data
  const getDomainSubdomain = (source: SourceData) => {
    if (source.title.toLowerCase().includes('identity') || source.title.toLowerCase().includes('purpose')) {
      return {
        domain: "Character",
        subdomain: "Identity & Purpose"
      };
    }
    if (source.title.toLowerCase().includes('leadership')) {
      return {
        domain: "Leadership",
        subdomain: "Development"
      };
    }
    if (source.title.toLowerCase().includes('communication')) {
      return {
        domain: "Communication",
        subdomain: "Effective Listening"
      };
    }
    // Default fallback
    return {
      domain: "Character",
      subdomain: "Identity & Purpose"
    };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90%] h-[90vh] p-6" hideCloseButton>
        <DialogHeader className="flex justify-between items-center mb-4">
          <DialogTitle className="font-serif text-xl font-semibold text-[var(--chat-text)]">
            Compare Sources
          </DialogTitle>
          <DialogClose className="p-2 rounded-full hover:bg-[var(--ui-bg-hover)]">
            <X className="h-5 w-5 text-[var(--chat-muted)]" />
          </DialogClose>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {sources.map((source) => {
            const { domain, subdomain } = getDomainSubdomain(source);
            
            return (
              <div key={source.id} className="bg-[var(--chat-card)] border border-[var(--chat-border)] rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                {/* Document Title */}
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-[var(--chat-text)] mb-2">
                    {source.title}
                  </h3>
                  {source.date && (
                    <p className="text-sm text-[var(--chat-text-secondary)]">
                      {source.date}
                    </p>
                  )}
                </div>

                {/* Top Row - Domain and Subdomain */}
                <div className="flex gap-3 text-sm font-medium mb-4">
                  <span className="bg-[var(--ui-bg-hover)] text-[var(--chat-text-secondary)] px-3 py-1 rounded-full">
                    {domain}
                  </span>
                  <span className="bg-[var(--ui-bg-hover)] text-[var(--chat-text)] px-3 py-1 rounded-full">
                    {subdomain}
                  </span>
                </div>

                {/* Divider Line */}
                <hr className="my-4 border-[var(--chat-border)]" />

                {/* Excerpt Section */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[var(--chat-text)] mb-2">
                    Excerpt
                  </h4>
                  <div className="bg-[var(--ui-bg-hover)] p-3 rounded-md border border-[var(--chat-border)]">
                    <p className="text-sm text-[var(--chat-text)] whitespace-pre-line leading-relaxed">
                      {source.excerpt}
                    </p>
                  </div>
                </div>

                {/* Bottom Tags Row */}
                {source.tags && source.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 text-sm text-[var(--chat-text)]">
                      {source.tags.map((tag, i) => (
                        <span key={i} className="bg-[var(--ui-bg-hover)] px-3 py-1 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3 mt-4">
                  <button 
                    onClick={() => handleAskAboutSource(source.id)}
                    className="flex items-center justify-center w-full text-sm text-brand-blue hover:text-brand-blue/80 transition-colors border border-brand-blue/20 hover:border-brand-blue/40 rounded-md py-2 px-3"
                  >
                    Ask about this source
                  </button>
                  
                  {/* View Full Source Button */}
                  {source.url && (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center w-full bg-brand-yellow text-white px-5 py-2 rounded-md text-sm font-semibold hover:bg-brand-yellow/85 transition-colors"
                    >
                      <ExternalLink size={16} className="mr-2" />
                      View Full Source
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SourceComparisonModal;
