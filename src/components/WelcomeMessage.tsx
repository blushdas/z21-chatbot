
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { welcomeMessages } from '@/data/welcomeMessages';
import { ChatMode } from './ChatInterface';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useBrand } from '@/context/BrandContext';

interface WelcomeMessageProps {
  mode: ChatMode;
  onDismiss?: () => void;
  autoFade?: boolean;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ mode, onDismiss, autoFade = false }) => {
  const [visible, setVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { profile } = useAuth();
  const { brandText } = useBrand();

  // Hide for justin@ (justin admin)
  const isJustin = profile?.name?.toLowerCase().includes('justin') ?? false;
  
  const message = welcomeMessages[mode];
  
  // Handle auto-fade effect
  useEffect(() => {
    setIsMounted(true);
    
    if (autoFade) {
      const timer = setTimeout(() => {
        setVisible(false);
        
        setTimeout(() => {
          if (onDismiss) onDismiss();
        }, 500); // Wait for fade-out animation to complete
      }, 6000); // Auto-dismiss after 6 seconds
      
      return () => clearTimeout(timer);
    }
    
    return () => {};
  }, [autoFade, onDismiss]);
  
  // Reset visibility when mode changes
  useEffect(() => {
    setVisible(true);
  }, [mode]);
  
  const handleDismiss = () => {
    setVisible(false);
    
    setTimeout(() => {
      if (onDismiss) onDismiss();
    }, 500); // Wait for fade-out animation to complete
  };
  
  if (!message) return null;
  
  return (
    <div 
      className={cn(
        'mb-6 transition-all duration-500 ease-in-out welcome-message',
        visible && isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4',
      )}
    >
      <Card className={cn(
        'relative bg-[var(--chat-bg)] border-l-4 shadow-sm',
        message.className
      )}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {message.icon && (
                <span className="text-2xl" aria-hidden="true">{message.icon}</span>
              )}
              <CardTitle className="t-h2 text-brand-blue">
                {brandText('Welcome to the Daryle AI Beta!')}
              </CardTitle>
            </div>
            {onDismiss && (
              <button 
                onClick={handleDismiss} 
                className="text-[var(--chat-muted)] hover:text-[var(--chat-text-secondary)] transition-colors"
                aria-label="Dismiss welcome message"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="t-body space-y-2">
            <p className="text-[var(--chat-text)] leading-relaxed">
              {brandText("You're among the first to experience Daryle AI.")} As a beta release, you may encounter occasional bugs or unexpected behavior as we continue to refine the platform. <strong className="font-semibold text-gray-900">Your feedback is invaluable</strong>—please don't hesitate to share your thoughts and report any issues you encounter.
            </p>
          </div>
        </CardContent>
        {message.citation && (
          <CardFooter className="pt-1 pb-4">
            <p className="text-xs text-[var(--chat-muted)] italic">
              {message.citation}
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default WelcomeMessage;
