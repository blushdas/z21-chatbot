import React from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  show: boolean;
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ onClick, show }) => {
  if (!show) return null;

  return (
    <Button
      onClick={onClick}
      size="sm"
      className="rounded-full shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-300 bg-background/95 backdrop-blur-md border-2 border-border/50 hover:border-primary hover:scale-105 group animate-fade-in"
      aria-label="Scroll to bottom"
    >
      <ChevronDown className="h-4 w-4 mr-0 md:mr-2 text-foreground group-hover:text-primary transition-all duration-300 group-hover:animate-bounce" />
      <span className="hidden md:inline text-sm font-medium text-foreground group-hover:text-primary transition-colors">
        Jump to latest
      </span>
    </Button>
  );
};

export default ScrollToBottomButton;
