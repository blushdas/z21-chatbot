
import React from 'react';
import { formatDate } from '@/lib/utils';

interface MessageTimestampProps {
  timestamp?: string | Date;
  className?: string;
}

const MessageTimestamp: React.FC<MessageTimestampProps> = ({ 
  timestamp, 
  className = "" 
}) => {
  if (!timestamp) return null;

  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return null;

  const formattedTime = formatDate(date);

  return (
    <div className={`text-xs text-[var(--chat-muted)] ${className}`}>
      {formattedTime}
    </div>
  );
};

export default MessageTimestamp;
