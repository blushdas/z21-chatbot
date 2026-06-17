import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Brain, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useIsMobile } from "@/hooks/use-mobile";

// Define the sub-prompts to match exactly what's in the backend
const subPromptToggles: Record<string, string> = {
  standard: "Wisdom-seeking companion with 3Cs discernment and transformational arc",
  quickAnswer: "Direct, concise answers grounded in sources",
  directQuotes: "Pull direct quotes from Daryle's learning times and emails",
  storytelling: "Pull full stories or create stories in the style of Daryle",
  noBlueprints: "Pull straight from the model — no Daryle prompts or response framing",
};

// Define the order for display
const promptOrder = ['quickAnswer', 'standard', 'directQuotes', 'noBlueprints'];

// Create display labels for the UI
const subPromptLabels: Record<string, string> = {
  standard: "Wisdom Mode",
  quickAnswer: "Standard Mode",
  directQuotes: "Direct Quotes",
  storytelling: "Storytelling",
  noBlueprints: "No Blueprints",
};

interface Props {
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

const PromptModifiers: React.FC<Props> = ({ selected, onChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const menuRef = useRef<HTMLDivElement>(null);
  const selectedValue = selected.length > 0 ? selected[0] : '';
  const isMobile = useIsMobile();

  const toggleDropdown = () => {
    if (!isOpen && menuRef.current) {
      // Calculate if dropdown should open upward or downward
      const rect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 320; // Approximate height of dropdown
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      setDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > dropdownHeight ? 'top' : 'bottom');
    }
    setIsOpen(!isOpen);
  };

  const selectModifier = (key: string) => {
    // Only change if selecting a different mode - can't deselect (always one active)
    if (key !== selectedValue) {
      onChange([key]);
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const ModalContent = () => (
    <div className="w-full">
      <div className="px-3 py-2 border-b border-[var(--chat-border)]">
        <p className="text-xs text-[var(--chat-muted)]">
          Choose a response style modifier to adjust how Daryle responds.
        </p>
      </div>
      
      <div className="py-2">
        <div className="space-y-2">
          {promptOrder.map((key) => (
            <button
              key={key}
              onClick={() => selectModifier(key)}
              className={cn(
                "flex items-start w-full text-left px-4 py-3 text-sm transition-colors rounded-md",
                selectedValue === key
                  ? "bg-brand-green/10 text-brand-green"
                  : "text-brand-blue hover:bg-[var(--ui-bg-hover)]"
              )}
            >
              <span className="mr-3 text-lg flex-shrink-0 mt-0.5">
                {key === 'standard' && '🌿'}
                {key === 'quickAnswer' && '⚡'}
                {key === 'directQuotes' && '💬'}
                {key === 'storytelling' && '📚'}
                {key === 'noBlueprints' && '🪄'}
              </span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{subPromptLabels[key]}</span>
                </div>
                <span className="text-xs text-[var(--chat-muted)]">{subPromptToggles[key]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="flex items-center gap-1">
        <div className="relative prompt-modifiers z-50" ref={menuRef}>
          <button
            onClick={toggleDropdown}
            disabled={disabled}
            className={cn(
              "flex items-center h-10 space-x-1 bg-[var(--chat-card)] backdrop-blur-sm border border-[var(--chat-border)]/50 shadow-sm rounded-md px-3 py-1.5 text-sm font-medium text-brand-blue hover:bg-[var(--chat-card)] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green transition-all min-w-[150px]",
              disabled && "opacity-50 cursor-not-allowed hover:bg-[var(--chat-card)]"
            )}
            aria-label="Select response style"
          >
            <span className="flex items-center">
              <Brain className="mr-2 h-4 w-4 text-brand-green" />
              <span className="whitespace-nowrap text-brand-blue">
                {selectedValue ? subPromptLabels[selectedValue] : "Response Style"}
              </span>
            </span>
            {!isMobile && <ChevronDown className="h-4 w-4 ml-auto text-brand-blue" />}
          </button>

          {/* Desktop Dropdown */}
          {isOpen && !isMobile && (
            <div className={cn(
              "absolute left-0 w-80 bg-[var(--chat-card)] rounded-md shadow-xl border border-[var(--chat-border)] z-[99999] max-h-80 overflow-y-auto",
              dropdownPosition === 'top' ? "bottom-full mb-1" : "top-full mt-1"
            )}>
              <ModalContent />
            </div>
          )}
        </div>

        {/* Help Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center justify-center text-[var(--chat-muted)] hover:text-[var(--chat-text-secondary)] transition-colors"
              aria-label="Mode information"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="start" className="w-72 p-4 bg-[var(--chat-card)] z-[99999]">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-brand-blue">Response Modes</h4>
              <p className="text-sm text-[var(--chat-text-secondary)]">
                These are the three modes included in the beta:
              </p>
              <ul className="text-sm text-[var(--chat-text-secondary)] list-disc list-inside space-y-1">
                <li><strong>Wisdom Mode</strong> – Deeper, reflective responses</li>
                <li><strong>Standard Mode</strong> – Direct, concise answers</li>
                <li><strong>Direct Quotes</strong> – Verbatim quotes from Daryle</li>
                <li><strong>No Blueprints</strong> – Raw model output with no Daryle prompts (still uses your knowledge base if enabled)</li>
              </ul>
              <p className="text-xs text-[var(--chat-muted)] pt-2 border-t border-[var(--chat-border)]">
                More modes are coming soon! These modes determine how Daryle AI frames and delivers responses to your questions.
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Mobile Modal */}
      {isMobile && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md mx-4 max-h-[80vh] overflow-y-auto fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-brand-green" />
                Response Style
              </DialogTitle>
            </DialogHeader>
            <ModalContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PromptModifiers;
