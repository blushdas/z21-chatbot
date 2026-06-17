
import React from 'react';
import { cn } from '@/lib/utils';

interface TagPillProps {
  label: string;
  variant?: 'default' | 'subtle' | 'outline';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const TagPill: React.FC<TagPillProps> = ({ 
  label, 
  variant = 'default',
  size = 'md',
  className
}) => {
  const baseClasses = "inline-flex items-center rounded-full";
  
  const variantClasses = {
    default: "bg-slate-100 text-gray-700",
    subtle: "bg-brand-green/10 text-brand-green",
    outline: "border border-[var(--chat-border)] bg-[var(--chat-card)] text-[var(--chat-text)]"
  };
  
  const sizeClasses = {
    xs: "text-xs px-1.5 py-0.5",
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1"
  };

  return (
    <span className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}>
      {label}
    </span>
  );
};

export default TagPill;
