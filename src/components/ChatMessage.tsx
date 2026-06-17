
import React, { memo } from 'react';
import MessageBubble from './MessageBubble';
import StreamingMessage from './StreamingMessage';
import SystemMessage from './SystemMessage';
import VerificationCompanionMessage from './VerificationCompanionMessage';

import { MessageType } from './ChatInterface';

interface ChatMessageProps {
  message: MessageType;
  previousMessage?: MessageType;
  isStreaming?: boolean;
  onStreamComplete?: () => void;
  messageIndex?: number;
  onRegenerate?: (index: number) => void;
  onEdit?: (index: number) => void;
  onReVerify?: (messageId: string) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  previousMessage, 
  isStreaming = false,
  onStreamComplete,
  messageIndex = 0,
  onRegenerate,
  onEdit,
  onReVerify
}) => {
  // Handle system messages
  if (message.sender === "system") {
    return <SystemMessage content={message.content} />;
  }

  // Handle verification companion messages
  if (message.sender === "verification") {
    let verificationResult = null;
    let isLoading = false;
    try {
      const parsed = JSON.parse(message.content);
      if (parsed.loading) {
        isLoading = true;
      } else {
        verificationResult = parsed;
      }
    } catch {
      verificationResult = {
        whatSeemssolid: message.content,
        whatToQuestion: '',
        whatToVerify: '',
        companionPerspective: '',
      };
    }
    return (
      <VerificationCompanionMessage
        result={verificationResult}
        loading={isLoading}
        error={null}
        onReVerify={onReVerify ? () => onReVerify(message.id) : undefined}
        timestamp={message.timestamp}
      />
    );
  }

  // Always use StreamingMessage for bot messages to get all the action buttons
  // Only use the streaming functionality when actually streaming
  if (message.sender === "daryle") {
    return (
      <div>
        <StreamingMessage 
          message={message} 
          messageIndex={messageIndex}
          onRegenerate={onRegenerate}
          onEdit={onEdit}
          isStreaming={isStreaming}
        />
      </div>
    );
  }

  // Use MessageBubble for user messages - pass messageIndex for favorites
  return (
    <MessageBubble 
      message={message}
      messageIndex={messageIndex}
      onRegenerate={onRegenerate}
      onEdit={onEdit}
    />
  );
};

export default memo(ChatMessage, (prevProps, nextProps) => {
  // Only re-render if message content or streaming state changes
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.message.sender === nextProps.message.sender &&
    prevProps.message.responseStyle === nextProps.message.responseStyle &&
    prevProps.message.model === nextProps.message.model &&
    prevProps.message.knowledgeBaseEnabled === nextProps.message.knowledgeBaseEnabled &&
    prevProps.message.intent === nextProps.message.intent &&
    prevProps.message.sources === nextProps.message.sources &&
    prevProps.message.citation === nextProps.message.citation &&
    prevProps.message.routeMetadata === nextProps.message.routeMetadata &&
    prevProps.isStreaming === nextProps.isStreaming &&
    prevProps.messageIndex === nextProps.messageIndex
  );
});
