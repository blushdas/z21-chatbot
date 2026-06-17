
import React from 'react';

interface HighlightProps {
  text: string;
  searchTerm: string;
  className?: string;
}

export const highlightSearchTerm = (text: string, searchTerm: string, className?: string): React.ReactNode => {
  if (!searchTerm.trim()) {
    return text;
  }

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (regex.test(part)) {
      return (
        <span
          key={index}
          className={className || "bg-yellow-200 dark:bg-yellow-800/50 px-1 rounded font-medium"}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

export const HighlightText: React.FC<HighlightProps> = ({ text, searchTerm, className }) => {
  return <>{highlightSearchTerm(text, searchTerm, className)}</>;
};
