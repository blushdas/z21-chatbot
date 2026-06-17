import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Zap, Brain, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface LLMSelectorProps {
  currentModel: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

const modelOptions = {
  grounded: {
    label: "Instant",
    description: "Fast, conversational responses in seconds. Best for quick questions, everyday coaching conversations, and natural flowing dialogue.",
    icon: Zap,
    value: "grounded"
  },
  fast: {
    label: "Thinking",
    description: "Takes more time to reason through complex problems. Best for strategic decisions, multi-step analysis, and weighing multiple factors.",
    icon: Brain,
    value: "fast"
  },
  deep: {
    label: "Pro",
    description: "Our most capable model for expert-level work. Best for nuanced leadership challenges, detailed analysis, and when precision matters most.",
    icon: Shield,
    value: "deep"
  }
};

const LLMSelector: React.FC<LLMSelectorProps> = ({ currentModel, onModelChange, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Find current model config
  const getCurrentModelConfig = () => {
    const entry = Object.entries(modelOptions).find(([_, config]) => config.value === currentModel);
    return entry ? entry[1] : modelOptions.grounded;
  };

  const currentConfig = getCurrentModelConfig();
  const Icon = currentConfig.icon;

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const selectModel = (modelValue: string) => {
    onModelChange(modelValue);
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

  return (
    <div className="relative llm-selector z-50" ref={menuRef}>
      <button
        onClick={toggleDropdown}
        disabled={disabled}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors",
          "bg-[var(--chat-card)] border-[var(--chat-border)] text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]",
          disabled && "opacity-50 cursor-not-allowed hover:bg-[var(--chat-card)]"
        )}
        aria-label="Select LLM model"
      >
        <Icon className="h-3.5 w-3.5 text-brand-green" />
        <span className="whitespace-nowrap">{currentConfig.label}</span>
        <ChevronDown className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-96 bg-[var(--chat-card)] rounded-lg shadow-xl border border-[var(--chat-border)] z-[99999] overflow-hidden">
          <div className="px-3 py-2 border-b border-[var(--chat-border)] bg-[var(--ui-bg-hover)]">
            <p className="text-xs font-medium text-[var(--chat-text-secondary)]">
              Choose your AI model
            </p>
          </div>
          
          <div className="py-1">
            {Object.entries(modelOptions).map(([key, config]) => {
              const OptionIcon = config.icon;
              const isSelected = config.value === currentModel;
              
              return (
                <button
                  key={key}
                  onClick={() => selectModel(config.value)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 transition-colors flex items-start gap-3",
                    isSelected
                      ? "bg-brand-green/10 text-brand-green"
                      : "text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]"
                  )}
                >
                  <OptionIcon className={cn(
                    "h-4 w-4 mt-0.5 flex-shrink-0",
                    isSelected ? "text-brand-green" : "text-[var(--chat-muted)]"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{config.label}</span>
                      {isSelected && (
                        <div className="w-1.5 h-1.5 bg-brand-green rounded-full"></div>
                      )}
                    </div>
                    <p className="text-xs text-[var(--chat-muted)] mt-0.5">
                      {config.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LLMSelector;
