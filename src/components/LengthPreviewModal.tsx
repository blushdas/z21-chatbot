
import React from "react";
import { Zap, AlignLeft, FileText, BookOpenText, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChatMode } from "./ChatInterface";

interface LengthPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLength: (length: string) => void;
  currentPrompt: string;
  currentMode: ChatMode;
}

const LengthPreviewModal: React.FC<LengthPreviewModalProps> = ({
  isOpen,
  onClose,
  onSelectLength,
  currentPrompt,
  currentMode,
}) => {
  // Mock responses for each length type - in a real app, these would be generated via API
  const getMockResponse = (length: string): string => {
    const baseResponses = {
      Coaching: "Leadership is about making others better as a result of your presence.",
      Family: "Family should always be your highest priority.",
      Investor: "The best investments align profit with purpose.",
      Ambassador: "How we represent our mission matters.",
    };

    const baseResponse = baseResponses[currentMode] || baseResponses.Coaching;
    
    switch (length) {
      case "short":
        return baseResponse;
      case "medium":
        return `${baseResponse} This principle has guided many successful leaders throughout history. Consider how you might apply this in your specific context.`;
      case "long":
        return `${baseResponse} This principle has guided many successful leaders throughout history. Consider how you might apply this in your specific context. The impact of this approach tends to compound over time, especially when consistently applied across different situations. What specific aspects of this resonate with you most?`;
      case "daryle_long":
        return `${baseResponse} This principle has guided many successful leaders throughout history. 

When I first started my business journey, I discovered the power of this approach. There was a time when a difficult decision came before me that would impact dozens of employees. Instead of focusing solely on the financial aspects, I considered the long-term implications for everyone involved.

Consider how you might apply this in your specific context. The impact of this approach tends to compound over time, especially when consistently applied across different situations. 

I've found that leaders who embrace this mindset create lasting change, not just temporary improvements. What specific aspects of this resonate with you most?`;
      default:
        return baseResponse;
    }
  };

  const lengthOptions = [
    { 
      id: "short", 
      name: "Short", 
      description: "1-2 sentence summary", 
      icon: <Zap size={16} />
    },
    { 
      id: "medium", 
      name: "Medium", 
      description: "1-2 paragraphs with clarity", 
      icon: <AlignLeft size={16} />
    },
    { 
      id: "long", 
      name: "Long", 
      description: "Detailed with examples (3-5 paragraphs)", 
      icon: <FileText size={16} />
    },
    { 
      id: "daryle_long", 
      name: "Daryle Long", 
      description: "Deep dive, story-based wisdom", 
      icon: <BookOpenText size={16} />
    },
  ];

  const handleSelectLength = (length: string) => {
    onSelectLength(length);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--chat-text)]">
            Compare Output Lengths
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 text-sm text-[var(--chat-muted)] mb-4">
          <p>Preview how Daryle would respond to your input at different lengths</p>
          {currentPrompt && (
            <div className="mt-2 p-2 bg-[var(--ui-bg-hover)] rounded-md border border-[var(--chat-border)]">
              <p className="font-medium">Your prompt:</p>
              <p className="italic">{currentPrompt}</p>
            </div>
          )}
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
            {lengthOptions.map((option) => (
              <div 
                key={option.id}
                className="bg-slate-50 rounded-lg border border-[var(--chat-border)] overflow-hidden flex flex-col"
              >
                <div className="bg-[var(--chat-card)] p-3 border-b border-[var(--chat-border)] flex items-center space-x-2">
                  <span className="text-brand-green">{option.icon}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{option.name}</h3>
                    <p className="text-xs text-[var(--chat-muted)]">{option.description}</p>
                  </div>
                </div>
                
                <div className="p-4 text-sm flex-1 overflow-auto">
                  <p className="whitespace-pre-line">{getMockResponse(option.id)}</p>
                </div>
                
                <div className="p-3 bg-[var(--chat-card)] border-t border-[var(--chat-border)]">
                  <Button
                    onClick={() => handleSelectLength(option.id)}
                    className="w-full bg-[var(--chat-card)] hover:bg-[var(--ui-bg-hover)] text-[var(--chat-text)] border border-[var(--chat-border)] hover:text-brand-green hover:border-brand-green transition-colors"
                    variant="outline"
                  >
                    <Check size={16} className="mr-1" />
                    Use This Length
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LengthPreviewModal;
