
import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

interface TypingIndicatorProps {
  subPrompts?: string[];
  isHiding?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ subPrompts = [], isHiding = false }) => {
  const [shouldHide, setShouldHide] = useState(false);

  useEffect(() => {
    if (isHiding) setShouldHide(true);
  }, [isHiding]);

  return (
    <div className={`mb-6 w-full ${shouldHide ? 'animate-fade-out-seamless' : 'animate-fade-in-left'}`}>
      <div className="max-w-3xl mx-auto px-6">
        {/* Avatar + sender row */}
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-full bg-brand-yellow flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-brand-blue" />
          </div>
          <span className="text-sm font-semibold text-[var(--chat-text)]">Daryle AI</span>
        </div>
        {/* Card */}
        <div className="ml-10 bg-[var(--chat-card)] border border-[var(--chat-border)] border-l-2 border-l-brand-yellow/50 rounded-xl px-5 py-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 bg-[var(--chat-muted)] rounded-full animate-soft-pulse [animation-delay:0ms]" />
            <span className="w-2 h-2 bg-[var(--chat-muted)] rounded-full animate-soft-pulse [animation-delay:200ms]" />
            <span className="w-2 h-2 bg-[var(--chat-muted)] rounded-full animate-soft-pulse [animation-delay:400ms]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
