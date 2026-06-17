
import React, { useState, useEffect } from 'react';
import { ChatMode } from './ChatInterface';
import { curatedPromptSuggestions, themeColors, themeIcons, CuratedPromptSuggestion } from '@/data/curatedPromptSuggestions';
import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedSuggestedPromptCarouselProps {
  currentMode: ChatMode;
  onSuggestionClick: (suggestion: string) => void;
  className?: string;
  responseCompleted?: number; // Timestamp of last completed response
}

const EnhancedSuggestedPromptCarousel: React.FC<EnhancedSuggestedPromptCarouselProps> = ({ 
  currentMode, 
  onSuggestionClick,
  className,
  responseCompleted
}) => {
  const [visibleSuggestions, setVisibleSuggestions] = useState<CuratedPromptSuggestion[]>([]);
  const [isRotating, setIsRotating] = useState(false);
  
  // Determine how many suggestions to show based on viewport
  const getVisibleCount = () => {
    if (window.innerWidth < 640) return 1; // Mobile: 1 suggestion
    if (window.innerWidth < 1024) return 2; // Tablet: 2 suggestions
    return 3; // Desktop: 3 suggestions
  };

  // Get one random suggestion from each category for variety
  const getBalancedSuggestions = (count: number): CuratedPromptSuggestion[] => {
    const allSuggestions = curatedPromptSuggestions[currentMode] || [];
    
    const characterQuestions = allSuggestions.filter(s => s.theme === 'character');
    const chemistryQuestions = allSuggestions.filter(s => s.theme === 'chemistry');
    const competencyQuestions = allSuggestions.filter(s => s.theme === 'competency');
    
    const result: CuratedPromptSuggestion[] = [];
    
    // Pick one random from each category
    if (characterQuestions.length > 0) {
      result.push(characterQuestions[Math.floor(Math.random() * characterQuestions.length)]);
    }
    if (chemistryQuestions.length > 0 && result.length < count) {
      result.push(chemistryQuestions[Math.floor(Math.random() * chemistryQuestions.length)]);
    }
    if (competencyQuestions.length > 0 && result.length < count) {
      result.push(competencyQuestions[Math.floor(Math.random() * competencyQuestions.length)]);
    }
    
    // Shuffle the results so category order varies
    return result.sort(() => Math.random() - 0.5);
  };
  
  // Initialize with balanced suggestions
  useEffect(() => {
    const count = getVisibleCount();
    setVisibleSuggestions(getBalancedSuggestions(count));
  }, [currentMode]);
  
  // Handle window resize for responsive display
  useEffect(() => {
    const handleResize = () => {
      if (!isRotating) {
        const count = getVisibleCount();
        if (visibleSuggestions.length !== count) {
          setVisibleSuggestions(getBalancedSuggestions(count));
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [visibleSuggestions.length, isRotating, currentMode]);
  
  // Rotate suggestions when response is completed
  useEffect(() => {
    if (responseCompleted && responseCompleted > 0) {
      rotateSuggestions();
    }
  }, [responseCompleted]);
  
  const rotateSuggestions = () => {
    const allSuggestions = curatedPromptSuggestions[currentMode] || [];
    if (allSuggestions.length <= visibleSuggestions.length) return;
    
    setIsRotating(true);
    
    // Find suggestions that aren't currently visible
    const availableSuggestions = allSuggestions.filter(
      s => !visibleSuggestions.some(v => v.id === s.id)
    );
    
    // Replace one random suggestion with a new one
    if (availableSuggestions.length > 0) {
      const newSuggestion = availableSuggestions[Math.floor(Math.random() * availableSuggestions.length)];
      const indexToReplace = Math.floor(Math.random() * visibleSuggestions.length);
      
      const newVisibleSuggestions = [...visibleSuggestions];
      newVisibleSuggestions[indexToReplace] = newSuggestion;
      
      setVisibleSuggestions(newVisibleSuggestions);
    }
    
    setTimeout(() => {
      setIsRotating(false);
    }, 600);
  };

  if (visibleSuggestions.length === 0) return null;
  
  return (
    <div className={cn("w-full px-4 py-4 bg-slate-50/80 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 animate-fade-in", className)}>
      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
        <div className="flex items-center">
          <Lightbulb className="mr-2 text-brand-blue" size={16} />
          <span className="font-medium">Explore these themes with Daryle AI:</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleSuggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion.text)}
            className={cn(
              "group relative text-left p-4 rounded-lg border-2 transition-all duration-300 hover:shadow-md",
              "bg-[var(--chat-card)] hover:bg-[var(--chat-card-2)] border-[var(--chat-border)] hover:border-brand-yellow/40",
              "transform hover:scale-[1.02] active:scale-[0.98]",
              isRotating && "animate-fade-in"
            )}
          >
            {/* Theme indicator */}
            <div className="flex items-center justify-between mb-2">
              <div className={cn(
                "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                themeColors[suggestion.theme]
              )}>
                <span className="mr-1">{themeIcons[suggestion.theme]}</span>
                <span className="capitalize">{suggestion.theme}</span>
              </div>
            </div>
            
            {/* Question text */}
            <p className="text-sm font-medium text-[var(--chat-text)] leading-relaxed group-hover:text-brand-yellow transition-colors">
              {suggestion.text}
            </p>
            
            {/* Hover effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-yellow/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        ))}
      </div>
      
      <div className="text-xs text-[var(--chat-muted)] text-center mt-3">
        <span>Character • Chemistry • Competency</span>
      </div>
    </div>
  );
};

export default EnhancedSuggestedPromptCarousel;
