import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircleHeart, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from '@/components/ui/tooltip';
import type { CommentaryDisplayMode } from '@/types/commentary';

type CommentaryToggleProps = {
  displayMode: CommentaryDisplayMode;
  isEnabled: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onCycleMode: () => void;
};

const modeLabels: Record<CommentaryDisplayMode, string> = {
  inline: 'Inline',
  sidebar: 'Panel',
  off: 'Off',
};

const CommentaryToggle: React.FC<CommentaryToggleProps> = ({
  displayMode,
  isEnabled,
  sidebarOpen,
  onToggleSidebar,
  onCycleMode,
}) => {
  if (!isEnabled) return null;

  const isActive = displayMode !== 'off';

  return (
    <TooltipProvider>
    <div className="flex items-center gap-0.5">
      {/* Mode cycle button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCycleMode}
            className={`
              h-8 gap-1.5 px-2.5 text-[11px] font-semibold tracking-wide uppercase rounded-lg
              transition-all duration-200
              ${isActive
                ? 'text-brand-yellow bg-brand-yellow/[0.08] hover:bg-brand-yellow/[0.14] shadow-[inset_0_0_0_1px_rgba(167,137,64,0.15)]'
                : 'text-[var(--chat-text)]/30 hover:text-[var(--chat-muted)] hover:bg-[var(--ui-bg-hover)]'
              }
            `}
          >
            <MessageCircleHeart size={13} className={isActive ? 'text-brand-yellow' : ''} />
            <AnimatePresence mode="wait">
              <motion.span
                key={displayMode}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="hidden sm:inline"
              >
                {modeLabels[displayMode]}
              </motion.span>
            </AnimatePresence>
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-brand-blue text-brand-offwhite border-brand-blue shadow-lg"
        >
          <p className="text-[11px] font-medium">
            {displayMode === 'off' ? 'Commentary disabled' : `${voice(displayMode)} mode`}
          </p>
          <p className="text-[10px] text-[var(--chat-muted)] mt-0.5">Click to cycle</p>
        </TooltipContent>
      </Tooltip>

      {/* Sidebar toggle */}
      {displayMode === 'sidebar' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className={`
                h-8 w-8 p-0 rounded-lg transition-all duration-200
                ${sidebarOpen
                  ? 'text-brand-yellow bg-brand-yellow/[0.08] hover:bg-brand-yellow/[0.14]'
                  : 'text-brand-yellow/60 hover:text-brand-yellow hover:bg-brand-yellow/[0.08]'
                }
              `}
            >
              {sidebarOpen ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-brand-blue text-brand-offwhite border-brand-blue shadow-lg"
          >
            <p className="text-[11px]">{sidebarOpen ? 'Close' : 'Open'} panel</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
    </TooltipProvider>
  );
};

function voice(mode: CommentaryDisplayMode): string {
  return mode === 'inline' ? 'Inline' : mode === 'sidebar' ? 'Panel' : 'Off';
}

export default CommentaryToggle;
