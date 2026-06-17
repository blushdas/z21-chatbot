
import React, { useState, useRef, useEffect } from 'react';
import { Info, FileText, Calendar } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import TagPill from './TagPill';
import { cn } from '@/lib/utils';
import ViewSourceLink from './ViewSourceLink';

export interface SourceTooltipProps {
  sourceTitle: string;
  sourceDate?: string;
  tags?: string[];
  fileType?: 'memo' | 'pdf' | 'email';
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  citation?: string;
}

const SourceTooltip: React.FC<SourceTooltipProps> = ({
  sourceTitle,
  sourceDate,
  tags = [],
  fileType,
  position = 'top',
  className,
  citation = ""
}) => {
  // Convert fileType to friendly display name and icon
  const getFileTypeInfo = () => {
    switch (fileType) {
      case 'memo':
        return { label: 'Memo', icon: <FileText size={12} className="mr-1" /> };
      case 'pdf':
        return { label: 'PDF Document', icon: <FileText size={12} className="mr-1" /> };
      case 'email':
        return { label: 'Email', icon: <FileText size={12} className="mr-1" /> };
      default:
        return { label: 'Document', icon: <FileText size={12} className="mr-1" /> };
    }
  };

  // Get file type display info
  const fileTypeInfo = fileType ? getFileTypeInfo() : null;

  return (
    <div className={cn("relative inline-block", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="p-1 text-[var(--chat-muted)] hover:text-brand-green rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-brand-green"
            aria-label="View source information"
          >
            <Info size={14} />
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 p-3 bg-[var(--chat-card)] shadow-xl rounded-lg border border-[var(--chat-border)] z-50"
          sideOffset={5}
          align="center"
        >
          <div className="font-semibold text-sm text-[var(--chat-text)] mb-1">{sourceTitle}</div>
          
          <div className="flex items-center gap-2 mb-2">
            {sourceDate && (
              <span className="flex items-center text-xs text-[var(--chat-muted)]">
                <Calendar size={12} className="mr-1" />
                {sourceDate}
              </span>
            )}
            
            {fileTypeInfo && (
              <span className="flex items-center text-xs text-[var(--chat-muted)]">
                {fileTypeInfo.icon}
                {fileTypeInfo.label}
              </span>
            )}
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {tags.map((tag, idx) => (
                <TagPill key={idx} label={tag} variant="subtle" />
              ))}
            </div>
          )}
          
          <ViewSourceLink citation={citation || sourceTitle} className="mt-2" />
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default SourceTooltip;
