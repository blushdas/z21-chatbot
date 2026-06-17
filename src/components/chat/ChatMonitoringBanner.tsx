import React, { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

const DISMISSED_KEY = 'daryle_monitoring_notice_dismissed';

export const ChatMonitoringBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === '1'
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-[var(--color-warning-soft)] border-b border-[var(--color-warning-border)] text-sm text-[color:var(--color-warning)]">
      <ShieldAlert className="w-4 h-4 shrink-0" />
      <span className="flex-1">
        Conversations may be monitored for safety and security.{' '}
        <Link to="/privacy-policy" className="underline underline-offset-2 hover:opacity-80 transition-opacity">
          Learn more
        </Link>
      </span>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss notice"
        className="shrink-0 p-0.5 rounded hover:bg-[var(--ui-bg-hover)] transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default ChatMonitoringBanner;
