import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { modes } from '@/data/modeConfig';
import { ChatMode } from './ChatInterface';
import { useBrand } from '@/context/BrandContext';

interface ModeChangeNotificationProps {
  mode: ChatMode | null;
  onDismiss: () => void;
}

const ModeChangeNotification: React.FC<ModeChangeNotificationProps> = ({ mode, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const { brandText } = useBrand();

  useEffect(() => {
    if (mode) {
      setIsVisible(true);
      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [mode]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => onDismiss(), 300); // Allow fade out animation
  };

  if (!mode || !isVisible) return null;

  const modeConfig = modes.find(m => m.id === mode);

  return (
    <div className="relative">
      <div className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}>
        <div className="bg-[var(--chat-card)] text-[var(--chat-text)] px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-80 border border-[var(--chat-border)]">
          <CheckCircle className="h-5 w-5 text-[color:var(--color-success)]" />
          <div className="flex-1">
            <div className="text-sm font-medium">Mode Changed</div>
            <div className="text-xs text-[var(--chat-muted)]">
              Will use {brandText(modeConfig?.label || mode)} mode for next message
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-[var(--chat-muted)] hover:text-[var(--chat-text)] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeChangeNotification;