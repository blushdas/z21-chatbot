import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useIsMobile } from "@/hooks/use-mobile";
import { HelpTooltip } from "@/components/help/HelpTooltip";
import { helpTooltips } from "@/data/helpTooltips";

// Define the length options
const lengthOptions: Record<string, string> = {
  short: "Front loaded, TLDR, title + body and then conclusion (3 paragraphs)",
  medium: "Front loaded with TLDR, more body, references, supporting statements + conclusion (5-6 paragraphs)",
  long: "As much detail needed. Frontload the information",
};

// Define the order for display
const lengthOrder = ['short', 'medium', 'long'];

// Create display labels for the UI
const lengthLabels: Record<string, string> = {
  short: "Short Summary",
  medium: "Medium",
  long: "Long",
};

interface LengthSelectProps {
  currentLength: string;
  onLengthChange: (length: string) => void;
  disabled?: boolean;
}

const LengthSelect: React.FC<LengthSelectProps> = ({ currentLength, onLengthChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
  const menuRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const toggleDropdown = () => {
    if (!isOpen && menuRef.current) {
      // Calculate if dropdown should open upward or downward
      const rect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 320;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      setDropdownPosition(spaceBelow < dropdownHeight && spaceAbove > dropdownHeight ? 'top' : 'bottom');
    }
    setIsOpen(!isOpen);
  };

  const selectLength = (key: string) => {
    onLengthChange(key);
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
          Choose response length to adjust detail level and format.
        </p>
      </div>
      
      <div className="py-2">
        <div className="space-y-2">
          {lengthOrder.map((key) => (
            <button
              key={key}
              onClick={() => selectLength(key)}
              className={cn(
                "flex items-start w-full text-left px-4 py-3 text-sm transition-colors rounded-md",
                currentLength === key
                  ? "bg-brand-green/10 text-brand-green"
                  : "text-brand-blue hover:bg-[var(--ui-bg-hover)]"
              )}
            >
              <span className="mr-3 text-lg flex-shrink-0 mt-0.5">
                {key === 'short' && '📝'}
                {key === 'medium' && '📄'}
                {key === 'long' && '📚'}
              </span>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{lengthLabels[key]}</span>
                </div>
                <span className="text-xs text-[var(--chat-muted)]">{lengthOptions[key]}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative length-select z-50 inline-flex items-center gap-1" ref={menuRef}>
        <button
          onClick={toggleDropdown}
          disabled={disabled}
          className={cn(
            "flex items-center h-10 space-x-1 bg-[var(--chat-bg)] border border-[var(--chat-border)] rounded-md px-3 py-1.5 text-sm font-medium text-brand-blue hover:bg-[var(--ui-bg-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green transition-colors min-w-[150px]",
            disabled && "opacity-50 cursor-not-allowed hover:bg-[var(--chat-bg)]"
          )}
          aria-label="Select response length"
        >
          <span className="flex items-center">
            <AlignLeft className="mr-2 h-4 w-4 text-brand-green" />
            <span className="whitespace-nowrap text-brand-blue">
              {currentLength ? lengthLabels[currentLength] : "Response Length"}
            </span>
          </span>
          {!isMobile && <ChevronDown className="h-4 w-4 ml-auto text-brand-blue" />}
        </button>
        <HelpTooltip content={helpTooltips.lengthSelector} side="top" />

        {/* Desktop Dropdown */}
        {isOpen && !isMobile && (
          <div className={cn(
            "absolute left-0 w-80 bg-[var(--chat-bg)] rounded-md shadow-xl border border-[var(--chat-border)] z-[99999] max-h-80 overflow-y-auto",
            dropdownPosition === 'top' ? "bottom-full mb-1" : "top-full mt-1"
          )}>
            <ModalContent />
          </div>
        )}
      </div>

      {/* Mobile Modal */}
      {isMobile && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="sm:max-w-md mx-4 max-h-[80vh] overflow-y-auto fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlignLeft className="h-5 w-5 text-brand-green" />
                Response Length
              </DialogTitle>
            </DialogHeader>
            <ModalContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default LengthSelect;
