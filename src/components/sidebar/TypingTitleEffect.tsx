
import React, { useEffect, useState, useMemo } from 'react';

interface TypingTitleEffectProps {
  isTyping: boolean;
  finalTitle: string;
  onComplete?: () => void;
}

const TypingTitleEffect: React.FC<TypingTitleEffectProps> = ({
  isTyping,
  finalTitle,
  onComplete
}) => {
  const [displayText, setDisplayText] = useState('');
  const [animationComplete, setAnimationComplete] = useState(false);

  // Memoize the text to prevent unnecessary re-renders
  const textToType = useMemo(() => finalTitle || 'Generating title...', [finalTitle]);

  useEffect(() => {
    if (!isTyping) {
      setDisplayText(finalTitle);
      setAnimationComplete(true);
      return;
    }

    setDisplayText('');
    setAnimationComplete(false);
    
    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const typeNextChar = () => {
      if (currentIndex < textToType.length) {
        setDisplayText(textToType.substring(0, currentIndex + 1));
        currentIndex++;
        timeoutId = setTimeout(typeNextChar, 50);
      } else {
        setAnimationComplete(true);
        onComplete?.();
      }
    };

    timeoutId = setTimeout(typeNextChar, 50);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isTyping, textToType, onComplete]);

  return (
    <span className="inline-flex items-center">
      {displayText}
      {isTyping && !animationComplete && (
        <span className="ml-1 w-0.5 h-4 bg-brand-yellow opacity-100 animate-pulse" />
      )}
    </span>
  );
};

export default TypingTitleEffect;
