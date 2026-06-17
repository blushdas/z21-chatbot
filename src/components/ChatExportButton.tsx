import React, { useState } from 'react';
import { Download, FileText, FileDown, FileType, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useChatExport } from '@/hooks/useChatExport';
import { MessageType } from '@/components/ChatInterface';

interface ChatExportButtonProps {
  messages: MessageType[];
  chatTitle: string;
  mode: string;
  createdAt: string;
  chatId: string;
  disabled?: boolean;
  selectedMode?: string;
  selectedModel?: string;
  userName?: string;
  userEmail?: string;
}

export const ChatExportButton: React.FC<ChatExportButtonProps> = ({
  messages,
  chatTitle,
  mode,
  createdAt,
  chatId,
  disabled = false,
  userName,
  userEmail
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { exportToPDF, exportToMarkdown, exportToWord } = useChatExport();

  const handleExportPDF = async () => {
    if (messages.length === 0) {
      toast({
        title: "No messages to export",
        description: "Start a conversation to export it",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const result = await exportToPDF({
        messages,
        chatTitle,
        mode,
        createdAt,
        chatId,
        userName,
        userEmail
      });

      if (result.success) {
        toast({
          title: "PDF exported successfully!",
          description: `Downloaded as ${result.filename}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unable to export PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportMarkdown = async () => {
    if (messages.length === 0) {
      toast({
        title: "No messages to export",
        description: "Start a conversation to export it",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    
    try {
      const result = await exportToMarkdown({
        messages,
        chatTitle,
        mode,
        createdAt,
        chatId,
        userName,
        userEmail
      });

      if (result.success) {
        toast({
          title: "Markdown exported successfully!",
          description: `Downloaded as ${result.filename}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unable to export",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    if (messages.length === 0) {
      toast({
        title: 'No messages to export',
        description: 'Start a conversation to export it',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const result = await exportToWord({
        messages,
        chatTitle,
        mode,
        createdAt,
        chatId,
        userName,
        userEmail,
      });

      if (result.success) {
        toast({
          title: 'Word document exported successfully!',
          description: `Downloaded as ${result.filename}`,
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Unable to export Word document',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled || isExporting || messages.length === 0}
          className="h-8 gap-1 px-2 text-[var(--ui-icon)] hover:text-[var(--ui-icon-hover)] hover:bg-[var(--ui-bg-hover)]"
          title="Export chat"
        >
          <Download size={16} className={isExporting ? "animate-pulse" : ""} />
          <ChevronDown size={12} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)]">
        <DropdownMenuItem onClick={handleExportPDF} disabled={isExporting} className="hover:bg-[var(--ui-bg-hover)] focus:bg-[var(--ui-bg-hover)] text-[var(--chat-text)] focus:text-[var(--chat-text)]">
          <FileDown size={16} className="mr-2" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportMarkdown} disabled={isExporting} className="hover:bg-[var(--ui-bg-hover)] focus:bg-[var(--ui-bg-hover)] text-[var(--chat-text)] focus:text-[var(--chat-text)]">
          <FileText size={16} className="mr-2" />
          Export as Markdown
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportWord} disabled={isExporting} className="hover:bg-[var(--ui-bg-hover)] focus:bg-[var(--ui-bg-hover)] text-[var(--chat-text)] focus:text-[var(--chat-text)]">
          <FileType size={16} className="mr-2" />
          Export as Word Doc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
