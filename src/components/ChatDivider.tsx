import React from 'react';
import { cn } from '@/lib/utils';

interface ChatDividerProps {
  label?: string;
  variant?: 'simple' | 'labeled';
  className?: string;
}

const ChatDivider: React.FC<ChatDividerProps> = ({
  label = 'Today',
  variant = 'labeled',
  className = '',
}) => {
  if (variant === 'simple') {
    return <hr className={cn('border-t border-[var(--chat-border)] my-6 w-full', className)} />;
  }

  return (
    <div className={cn('flex items-center my-6', className)}>
      <div className="flex-grow border-t border-[var(--chat-border)]" />
      <span className="mx-4 px-3 py-1 text-[11px] text-brand-yellow/80 uppercase tracking-widest font-medium bg-[var(--chat-bg)]">
        {label}
      </span>
      <div className="flex-grow border-t border-[var(--chat-border)]" />
    </div>
  );
};

export default ChatDivider;
