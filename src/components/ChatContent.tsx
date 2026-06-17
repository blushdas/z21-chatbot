import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChatMessage from '@/components/ChatMessage';
import ChatDivider from '@/components/ChatDivider';
import ModeChangeDivider from '@/components/ModeChangeDivider';
import ModelChangeDivider from '@/components/ModelChangeDivider';
import PowerChangeDivider from '@/components/PowerChangeDivider';
import KbChangeDivider from '@/components/KbChangeDivider';
import BlueprintChangeDivider from '@/components/BlueprintChangeDivider';
import ThinkingDropdown, { ThinkingStep } from '@/components/ThinkingDropdown';
import { DualResponseComparison } from '@/components/DualResponseComparison';
import CommentaryPrompt from '@/components/commentary/CommentaryPrompt';
import CommentaryBlock from '@/components/commentary/CommentaryBlock';
import { KbStatusBanner } from '@/components/KbStatusBanner';
import { MessageType, ChatMode, ResponseMode } from '@/components/ChatInterface';
import { shouldShowDivider } from '@/utils/chatDividers';
import { useComposerHeight } from '@/hooks/useComposerHeight';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBrand } from '@/context/BrandContext';
import { cn } from '@/lib/utils';
import type { UseCommentaryLayerReturn } from '@/hooks/useCommentaryLayer';

interface ChatContentProps {
  messages: MessageType[];
  currentMode: ChatMode;
  chatId?: string;
  folderId?: string | null;
  isBotTyping: boolean;
  streamingMessageId: string | null;
  highlightedMessageIndex: number | null;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  subPrompts: string[];
  onStreamComplete: () => void;
  modeChangeDividers: Array<{id: string, mode: ChatMode, timestamp: Date}>;
  modelChangeDividers: Array<{id: string, model: string, timestamp: Date}>;
  powerChangeDividers?: Array<{id: string, value: string, timestamp: Date}>;
  kbChangeDividers?: Array<{id: string, label: string, enabled: boolean, timestamp: Date}>;
  blueprintChangeDividers?: Array<{id: string, mode: ResponseMode, timestamp: Date}>;
  typingHiding?: boolean;
  pendingDualResponse?: {
    responseA: string;
    responseB: string;
    sourcesA?: any[];
    sourcesB?: any[];
    citationA?: string;
    citationB?: string;
    modelA?: string;
    modelB?: string;
  };
  onDualResponseSelect?: (preference: 'a' | 'b' | 'tie') => void;
  thinkingSteps?: ThinkingStep[];
  selectedModel?: string;
  selectedPower?: string;
  useKnowledgebase?: boolean;
  onReVerify?: (messageId: string) => void;
  onPromoteMessage?: (content: string) => void;
  commentaryLayer?: UseCommentaryLayerReturn;
  chatLoadingState?: 'loading' | 'loaded' | 'new';
}

const ChatContent: React.FC<ChatContentProps> = ({
  messages,
  currentMode,
  isBotTyping,
  streamingMessageId,
  highlightedMessageIndex,
  messagesContainerRef,
  subPrompts,
  onStreamComplete,
  modeChangeDividers,
  modelChangeDividers,
  powerChangeDividers = [],
  kbChangeDividers = [],
  blueprintChangeDividers = [],
  typingHiding = false,
  pendingDualResponse,
  onDualResponseSelect,
  chatId,
  folderId,
  thinkingSteps = [],
  selectedModel,
  selectedPower,
  useKnowledgebase = true,
  onReVerify,
  onPromoteMessage,
  commentaryLayer,
  chatLoadingState = 'loaded',
}) => {
  const { brandText } = useBrand();
  const composerH = useComposerHeight();
  const isMobile = useIsMobile();

  // Track ThinkingDropdown expansion state for dynamic height reservation
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(false);

  // Compute whether the streaming response has started producing content
  const isResponseStarted = !!streamingMessageId && messages.some(m => m.id === streamingMessageId && m.content?.length > 0);

  // Reset expansion when response starts so container collapses
  useEffect(() => {
    if (isResponseStarted) {
      setIsThinkingExpanded(false);
    }
  }, [isResponseStarted]);

  // Auto-scroll when ThinkingDropdown expands to show full content
  const handleThinkingExpand = (isOpen: boolean) => {
    setIsThinkingExpanded(isOpen);
    if (isOpen && messagesContainerRef.current) {
      setTimeout(() => {
        messagesContainerRef.current?.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  };
  
  return (
    <>
      <div
        className="flex-1 overflow-y-auto px-4 sm:px-6 scroll-smooth bg-[var(--chat-bg)]"
        ref={messagesContainerRef}
        style={{ scrollBehavior: 'smooth', paddingBottom: `${(composerH || 72) + 96}px` }}
      >
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6">
        <KbStatusBanner enabled={useKnowledgebase} />
      </div>
      <div className="max-w-3xl mx-auto pt-20 sm:pt-24">
        {isMobile && messages.length === 0 && !isBotTyping && (
          <div className="flex flex-col items-center text-center py-10">
            <h2 className="text-2xl font-semibold text-brand-blue mb-2">What would you like to ask?</h2>
            <p className="text-sm text-gray-600 mb-6">{brandText('Ask Daryle AI anything')} - get wisdom, guidance, and insights.</p>
          </div>
        )}
        {messages.map((message, index) => {
          const previousMessage = index > 0 ? messages[index - 1] : undefined;
          const dividerInfo = shouldShowDivider(message, previousMessage, index);
          
          // Find mode change dividers that should appear before this message
          const relevantModeDividers = modeChangeDividers.filter(divider => {
            const messageTime = message.timestamp.getTime();
            const dividerTime = divider.timestamp.getTime();
            const previousMessageTime = previousMessage ? previousMessage.timestamp.getTime() : 0;
            
            return dividerTime > previousMessageTime && dividerTime <= messageTime;
          });

          // Find model change dividers that should appear before this message
          const relevantModelDividers = modelChangeDividers.filter(divider => {
            const messageTime = message.timestamp.getTime();
            const dividerTime = divider.timestamp.getTime();
            const previousMessageTime = previousMessage ? previousMessage.timestamp.getTime() : 0;
            
            return dividerTime > previousMessageTime && dividerTime <= messageTime;
          });

          // Find knowledge-base change dividers that should appear before this message
          const relevantKbDividers = kbChangeDividers.filter(divider => {
            const messageTime = message.timestamp.getTime();
            const dividerTime = divider.timestamp.getTime();
            const previousMessageTime = previousMessage ? previousMessage.timestamp.getTime() : 0;
            return dividerTime > previousMessageTime && dividerTime <= messageTime;
          });

          // Find processing-power change dividers that should appear before this message
          const relevantPowerDividers = powerChangeDividers.filter(divider => {
            const messageTime = message.timestamp.getTime();
            const dividerTime = divider.timestamp.getTime();
            const previousMessageTime = previousMessage ? previousMessage.timestamp.getTime() : 0;
            return dividerTime > previousMessageTime && dividerTime <= messageTime;
          });

          // Find blueprint (response mode) change dividers
          const relevantBlueprintDividers = blueprintChangeDividers.filter(divider => {
            const messageTime = message.timestamp.getTime();
            const dividerTime = divider.timestamp.getTime();
            const previousMessageTime = previousMessage ? previousMessage.timestamp.getTime() : 0;
            return dividerTime > previousMessageTime && dividerTime <= messageTime;
          });
          
          return (
            <div key={message.id} className="animate-fade-in">
              {/* Show mode change dividers before this message */}
              {relevantModeDividers.map(divider => (
                <ModeChangeDivider
                  key={divider.id}
                  mode={divider.mode}
                  timestamp={divider.timestamp}
                />
              ))}
              
              {/* Show model change dividers before this message */}
              {relevantModelDividers.map(divider => (
                <ModelChangeDivider
                  key={divider.id}
                  model={divider.model}
                  timestamp={divider.timestamp}
                />
              ))}

              {/* Show processing-power change dividers before this message */}
              {relevantPowerDividers.map(divider => (
                <PowerChangeDivider
                  key={divider.id}
                  value={divider.value}
                  timestamp={divider.timestamp}
                />
              ))}

              {/* Show knowledge-base change dividers before this message */}
              {relevantKbDividers.map(divider => (
                <KbChangeDivider
                  key={divider.id}
                  label={divider.label}
                  enabled={divider.enabled}
                  timestamp={divider.timestamp}
                />
              ))}

              {/* Show blueprint (response mode) change dividers before this message */}
              {relevantBlueprintDividers.map(divider => (
                <BlueprintChangeDivider
                  key={divider.id}
                  mode={divider.mode}
                  timestamp={divider.timestamp}
                />
              ))}
              
              {/* Show divider if needed */}
              {dividerInfo.show && (
                <ChatDivider 
                  label={dividerInfo.label}
                  variant={dividerInfo.variant}
                />
              )}
              
              {/* Message content */}
              <div 
                data-message-index={index}
                className={cn(
                  'relative group/message',
                  highlightedMessageIndex === index
                    ? 'animate-pulse bg-brand-yellow/10 rounded-xl p-3 -m-1 mb-1 border border-brand-yellow/30 transition-all duration-1000'
                    : ''
                )}
              >
                <ChatMessage
                  message={message}
                  previousMessage={previousMessage}
                  isStreaming={streamingMessageId === message.id}
                  onStreamComplete={onStreamComplete}
                  messageIndex={index}
                  onReVerify={onReVerify}
                />
                {folderId && message.sender === 'daryle' && streamingMessageId !== message.id && onPromoteMessage && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 p-0 opacity-0 group-hover/message:opacity-100 transition-opacity text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]"
                    onClick={event => { event.stopPropagation(); onPromoteMessage(message.content); }}
                    aria-label="Promote message to knowledge"
                  >
                    <BookMarked className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Commentary Layer: inline prompt + block after daryle messages */}
              {commentaryLayer && commentaryLayer.displayMode === 'inline' && message.sender === 'daryle' && streamingMessageId !== message.id && (
                <AnimatePresence mode="wait">
                  {/* Show offer prompt */}
                  {commentaryLayer.currentOffer?.messageId === message.id && commentaryLayer.phase === 'offered' && (
                    <CommentaryPrompt
                      key={`prompt-${message.id}`}
                      voice={commentaryLayer.activeVoice}
                      onAccept={commentaryLayer.acceptOffer}
                      onDecline={commentaryLayer.declineOffer}
                    />
                  )}

                  {/* Show streaming commentary */}
                  {commentaryLayer.currentOffer?.messageId === message.id && commentaryLayer.phase === 'generating' && (
                    <CommentaryBlock
                      key={`streaming-${message.id}`}
                      voice={commentaryLayer.activeVoice}
                      isStreaming
                      streamingContent={commentaryLayer.streamingContent}
                    />
                  )}

                  {/* Show completed commentary */}
                  {commentaryLayer.commentaryMap[message.id] && (
                    <CommentaryBlock
                      key={`complete-${message.id}`}
                      entry={commentaryLayer.commentaryMap[message.id]}
                      voice={commentaryLayer.activeVoice}
                      onDismiss={() => commentaryLayer.dismissCommentary(message.id)}
                    />
                  )}
                </AnimatePresence>
              )}
            </div>
          );
        })}
        
        {/* Show any remaining dividers at the end - sorted by timestamp */}
        {(() => {
          const lastMessageTime = messages.length > 0 
            ? messages[messages.length - 1].timestamp.getTime() 
            : 0;
          
          return [
            ...modeChangeDividers
              .filter(d => d.timestamp.getTime() > lastMessageTime)
              .map(d => ({ ...d, type: 'mode' as const })),
            ...modelChangeDividers
              .filter(d => d.timestamp.getTime() > lastMessageTime)
              .map(d => ({ ...d, type: 'model' as const })),
            ...powerChangeDividers
              .filter(d => d.timestamp.getTime() > lastMessageTime)
              .map(d => ({ ...d, type: 'power' as const })),
            ...kbChangeDividers
              .filter(d => d.timestamp.getTime() > lastMessageTime)
              .map(d => ({ ...d, type: 'kb' as const })),
            ...blueprintChangeDividers
              .filter(d => d.timestamp.getTime() > lastMessageTime)
              .map(d => ({ ...d, type: 'blueprint' as const })),
          ]
            .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
            .map(divider => {
              if (divider.type === 'mode') {
                return <ModeChangeDivider key={divider.id} mode={divider.mode} timestamp={divider.timestamp} />;
              }
              if (divider.type === 'model') {
                return <ModelChangeDivider key={divider.id} model={divider.model} timestamp={divider.timestamp} />;
              }
              if (divider.type === 'power') {
                return <PowerChangeDivider key={divider.id} value={divider.value} timestamp={divider.timestamp} />;
              }
              if (divider.type === 'blueprint') {
                return <BlueprintChangeDivider key={divider.id} mode={divider.mode} timestamp={divider.timestamp} />;
              }
              return <KbChangeDivider key={divider.id} label={divider.label} enabled={divider.enabled} timestamp={divider.timestamp} />;
            });
        })()}

        {/* Dual Response Comparison - integrated inline with fade animation */}
        {pendingDualResponse && onDualResponseSelect && (
          <div className="py-6 animate-fade-in">
            <DualResponseComparison
              responseA={pendingDualResponse.responseA}
              responseB={pendingDualResponse.responseB}
              sourceA={pendingDualResponse.sourcesA}
              sourceB={pendingDualResponse.sourcesB}
              citationA={pendingDualResponse.citationA}
              citationB={pendingDualResponse.citationB}
              showModelNames={true}
              modelNameA={pendingDualResponse.modelA}
              modelNameB={pendingDualResponse.modelB}
              onPreferenceSelect={onDualResponseSelect}
            />
          </div>
        )}

        {/* Thinking indicator container - dynamic height based on expansion */}
        <div className={cn(
          "relative transition-all duration-300",
          isResponseStarted || typingHiding
            ? "min-h-0"
            : isThinkingExpanded
              ? "min-h-[320px]"
              : "min-h-[80px]"
        )}>
          <div 
            className={cn(
              "absolute inset-x-0 top-0 transition-opacity duration-300 ease-out",
              // ✅ FIX: typingHiding takes precedence - when true, fade regardless of isBotTyping
              (!typingHiding && !isResponseStarted && chatLoadingState !== 'loading' && (isBotTyping || streamingMessageId))
                ? "opacity-100"
                : "opacity-0 pointer-events-none"
            )}
          >
            {chatLoadingState !== 'loading' && (isBotTyping || streamingMessageId) && !isResponseStarted && (
              <ThinkingDropdown 
                subPrompts={subPrompts} 
                isHiding={typingHiding}
                thinkingSteps={thinkingSteps}
                isStreaming={!!streamingMessageId}
                isResponseStarted={!!streamingMessageId && messages.some(m => m.id === streamingMessageId && m.content?.length > 0)}
                isInstantMode={selectedModel === 'grounded'}
                onExpandChange={handleThinkingExpand}
                currentMode={subPrompts[0]}
                selectedModel={selectedModel}
                selectedPower={selectedPower}
                useKnowledgebase={useKnowledgebase}
              />
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ChatContent;
