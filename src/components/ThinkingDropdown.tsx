import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Check, Loader2 } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { formatMessageMetadata } from '@/utils/messageMetadataLabels';
import { useBrand } from '@/context/BrandContext';

export interface ThinkingStep {
  step: string;
  detail?: string;
  timestamp: number;
  completed?: boolean;
}

interface ThinkingDropdownProps {
  subPrompts?: string[];
  isHiding?: boolean;
  thinkingSteps?: ThinkingStep[];
  isStreaming?: boolean;
  isResponseStarted?: boolean;
  isInstantMode?: boolean;
  onExpandChange?: (isOpen: boolean) => void;
  currentMode?: string;
  selectedModel?: string;
  useKnowledgebase?: boolean;
  selectedPower?: string;
}

// Transform backend technical messages to user-friendly verbose versions with dynamic data
const transformStepToUserFriendly = (step: string, detail?: string): { step: string; detail?: string } => {
  const stepLower = step.toLowerCase();
  
  // Parse JSON detail if present
  const parseDetail = (d?: string) => {
    if (!d) return null;
    try {
      return JSON.parse(d);
    } catch {
      return null;
    }
  };
  
  if (stepLower.includes('checked cache') || stepLower.includes('checking cache')) {
    return { step: "Checking for similar questions you've asked before..." };
  }
  
  if (stepLower.includes('knowledge base disabled')) {
    return { step: 'Raw model mode — no Daryle prompt, no knowledge base' };
  }

  if (stepLower.includes('generated embedding') || stepLower.includes('understanding')) {
    // Show truncated query topic
    const topic = detail && detail.length > 3 ? `"${detail.substring(0, 40)}${detail.length > 40 ? '...' : ''}"` : '';
    return { step: topic ? `Understanding your question: ${topic}` : "Understanding what you're looking for..." };
  }
  
  if (stepLower.includes('searched knowledge') || stepLower.includes('searching')) {
    const data = parseDetail(detail);
    if (data?.total !== undefined && data?.breakdown) {
      const parts: string[] = [];
      if (data.breakdown.projectSmart > 0) parts.push(`Project SMART: ${data.breakdown.projectSmart}`);
      if (data.breakdown.learningTime > 0) parts.push(`Learning Time: ${data.breakdown.learningTime}`);
      if (data.breakdown.archives > 0) parts.push(`Archives: ${data.breakdown.archives}`);
      
      return { 
        step: `Found ${data.total} matches across knowledge bases`,
        detail: parts.length > 0 ? parts.join(' • ') : undefined
      };
    }
    return { step: 'Searching through knowledge archives...' };
  }
  
  if (stepLower.includes('selected best') || stepLower.includes('prioritized')) {
    const data = parseDetail(detail);
    if (data?.found !== undefined && data?.selected !== undefined) {
      return { step: `Reviewing ${data.found} sources, selected top ${data.selected} for relevance` };
    }
    const countMatch = detail?.match(/(\d+)\s*sources/i) || step.match(/(\d+)\s*sources/i);
    if (countMatch) {
      return { step: `Reviewing ${countMatch[1]} sources for relevance...` };
    }
    return { step: 'Reviewing sources for relevance...' };
  }
  
  if (stepLower.includes('found') && (stepLower.includes('source') || stepLower.includes('result') || stepLower.includes('match'))) {
    const countMatch = step.match(/(\d+)/);
    if (countMatch) {
      return { step: `Reviewing ${countMatch[1]} sources for relevance...` };
    }
    return { step: 'Reviewing sources for relevance...' };
  }
  
  if (stepLower.includes('generating response') || stepLower.includes('crafting')) {
    // Use branded model name from detail (e.g., "Daryle AI 1.0 Thinking")
    const modelName = detail || 'Daryle AI 1.0';
    return { step: `Crafting response with ${modelName}...` };
  }
  
  if (stepLower.includes('streaming') || stepLower.includes('starting')) {
    return { step: 'Weaving insights into your response...' };
  }
  
  if (stepLower.includes('connecting') || stepLower.includes('pinecone')) {
    return { step: "Connecting to Daryle's knowledge base..." };
  }
  
  // Default: return simplified version without technical details
  return { step: step.replace(/:\s*.*$/, '...').replace(/\[.*?\]/g, '').trim() || step };
};

// Initial connecting step
const createInitialConnectingStep = (useKnowledgebase: boolean): ThinkingStep => ({
  step: useKnowledgebase ? 'Connecting to Daryle\'s knowledge base...' : 'Preparing raw model response...',
  timestamp: Date.now(),
  completed: false
});

const ThinkingDropdown: React.FC<ThinkingDropdownProps> = ({ 
  subPrompts = [], 
  isHiding = false,
  thinkingSteps = [],
  isStreaming = false,
  isResponseStarted = false,
  isInstantMode = false,
  onExpandChange,
  currentMode,
  selectedModel,
  selectedPower,
  useKnowledgebase = true
}) => {
  const { activeBrand } = useBrand();
  const thinkingLabel = activeBrand ? 'Thinking...' : 'Daryle is reflecting...';
  const initialConnectingStep = useMemo(() => createInitialConnectingStep(useKnowledgebase), [useKnowledgebase]);
  const [shouldFadeOut, setShouldFadeOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [localSteps, setLocalSteps] = useState<ThinkingStep[]>([initialConnectingStep]);
  const hasReceivedBackendSteps = useRef(false);

  // Merge backend steps with initial step - keep linear sequence
  useEffect(() => {
    if (thinkingSteps.length > 0 && !hasReceivedBackendSteps.current) {
      hasReceivedBackendSteps.current = true;
      
      // Transform steps to user-friendly versions
      const transformedSteps = thinkingSteps.map(step => ({
        ...step,
        ...transformStepToUserFriendly(step.step, step.detail)
      }));
      
      // Prepend the initial connecting step (now completed) and add backend steps
      const mergedSteps: ThinkingStep[] = [
        { ...initialConnectingStep, completed: true, timestamp: Date.now() - 2000 },
        ...transformedSteps
      ];
      
      setLocalSteps(mergedSteps);
    } else if (thinkingSteps.length > 0) {
      // Update existing steps with new backend data
      const transformedSteps = thinkingSteps.map(step => ({
        ...step,
        ...transformStepToUserFriendly(step.step, step.detail)
      }));
      
      // Keep initial step, replace backend steps
      setLocalSteps(prev => {
        const initialStep = prev[0];
        return [
          { ...initialStep, completed: true },
          ...transformedSteps
        ];
      });
    }
  }, [thinkingSteps, initialConnectingStep]);

  // Trigger fade out as soon as response starts streaming (no delay)
  useEffect(() => {
    if (isResponseStarted && !shouldFadeOut) {
      setShouldFadeOut(true);
    }
  }, [isResponseStarted, shouldFadeOut]);

  // Also trigger fade out via isHiding prop
  useEffect(() => {
    if (isHiding) {
      setShouldFadeOut(true);
    }
  }, [isHiding]);

  // Reset when steps are cleared (new chat/query)
  useEffect(() => {
    if (thinkingSteps.length === 0) {
      hasReceivedBackendSteps.current = false;
      setLocalSteps([{ ...initialConnectingStep, timestamp: Date.now() }]);
      setShouldFadeOut(false);
    }
  }, [thinkingSteps.length, initialConnectingStep]);

  // Progressive completion: all steps before the last are completed
  // Only the last step shows spinner (unless response has started)
  const stepsWithStatus = useMemo(() => {
    return localSteps.map((step, index) => {
      const isLastStep = index === localSteps.length - 1;
      const isCompleted = isResponseStarted || !isLastStep || step.completed;
      
      return {
        ...step,
        completed: isCompleted
      };
    });
  }, [localSteps, isResponseStarted]);

  const hasSteps = localSteps.length > 0;

  return (
    <div 
      className={cn(
        "mb-6 w-full",
        shouldFadeOut 
          ? 'animate-thinking-fade-out pointer-events-none' 
          : 'animate-thinking-fade-in'
      )}
    >
      <div className="max-w-5xl mx-auto px-4">
        {isInstantMode ? (
          // Instant mode: Just show dots + text, no collapsible
          <div className="flex items-center gap-3 py-2">
            <div className="flex items-center space-x-1.5">
              <span className="typing-dot w-2 h-2 bg-brand-blue rounded-full animate-soft-pulse 
                             [animation-delay:0ms]"></span>
              <span className="typing-dot w-2 h-2 bg-brand-yellow rounded-full animate-soft-pulse 
                             [animation-delay:200ms]"></span>
              <span className="typing-dot w-2 h-2 bg-brand-blue rounded-full animate-soft-pulse 
                             [animation-delay:400ms]"></span>
            </div>
            <span className="text-muted-foreground text-sm">
              {thinkingLabel}
            </span>
            {(currentMode || selectedModel) && (
              <span className="text-xs text-muted-foreground/50">
                {formatMessageMetadata(currentMode, selectedModel, undefined, selectedPower)}
              </span>
            )}
          </div>
        ) : (
          // Non-instant modes: Full collapsible with "See details"
          <Collapsible open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            onExpandChange?.(open);
          }}>
            {/* Header - Always visible */}
            <CollapsibleTrigger 
              className={cn(
                "flex items-center gap-3 w-full text-left py-2 rounded-lg transition-all duration-200",
                hasSteps && "cursor-pointer hover:bg-muted/30"
              )}
            >
              <div className="flex items-center space-x-1.5">
                <span className="typing-dot w-2 h-2 bg-brand-blue rounded-full animate-soft-pulse 
                               [animation-delay:0ms]"></span>
                <span className="typing-dot w-2 h-2 bg-brand-yellow rounded-full animate-soft-pulse 
                               [animation-delay:200ms]"></span>
                <span className="typing-dot w-2 h-2 bg-brand-blue rounded-full animate-soft-pulse 
                               [animation-delay:400ms]"></span>
              </div>
              
              <span className="text-muted-foreground text-sm">
                {thinkingLabel}
              </span>
              
              {(currentMode || selectedModel) && (
                <span className="text-xs text-muted-foreground/50">
                  {formatMessageMetadata(currentMode, selectedModel, undefined, selectedPower)}
                </span>
              )}

              <div className="flex items-center gap-1.5 text-muted-foreground/50 ml-auto">
                <span className="text-xs opacity-70">See details</span>
                {isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200" />
                )}
              </div>
            </CollapsibleTrigger>

            {/* Dropdown content - linear step sequence */}
            <CollapsibleContent className="overflow-visible data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <div className="mt-2 py-2 pb-6 pl-1">
                <div className="relative">
                  {/* Vertical connector line */}
                  <div className="absolute left-[9px] top-3 bottom-3 w-px bg-border/50" />
                  
                  <div className="space-y-1">
                    {stepsWithStatus.map((step, index) => (
                      <div 
                        key={`${step.timestamp}-${index}`}
                        className={cn(
                          "flex items-center gap-3 text-sm py-1.5 pl-1 pr-2 rounded-md transition-all duration-300 relative",
                          step.completed 
                            ? "text-muted-foreground/70" 
                            : "text-foreground border-l-2 border-brand-blue ml-[-1px]",
                          "animate-thinking-step-fade"
                        )}
                        style={{
                          animationDelay: `${index * 150}ms`,
                          opacity: 0
                        }}
                      >
                        {/* Status icon with background to cover line */}
                        <div className="flex-shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center z-10 bg-background">
                          {step.completed ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-blue" />
                          )}
                        </div>
                        
                        <div className="flex flex-col">
                          <span className={cn(
                            "transition-opacity duration-300",
                            step.completed ? "opacity-70" : "font-medium"
                          )}>
                            {step.step}
                          </span>
                          {step.detail && (
                            <span className="text-xs text-muted-foreground/60 mt-0.5">
                              {step.detail}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
};

export default ThinkingDropdown;
