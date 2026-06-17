import React from 'react';
import { MessageType, ChatMode } from '@/components/ChatInterface';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { VerifiedMark } from '@/components/VerifiedMark';
import { parseMarkdownBold } from '@/utils/markdownParser';
import { Edit } from 'lucide-react';
import { useEditAnswer } from '@/hooks/useEditAnswer';
import EditAnswerModal from '@/components/EditAnswerModal';

interface ChatMessagesContainerProps {
  messages: MessageType[];
  currentMode: ChatMode;
  showWelcome: boolean;
  isBotTyping: boolean;
  streamingMessageId: string | null;
  onStreamComplete: () => void;
}

const ChatMessagesContainer: React.FC<ChatMessagesContainerProps> = ({
  messages,
  currentMode,
  showWelcome,
  isBotTyping,
  streamingMessageId,
  onStreamComplete
}) => {
  const { editModalOpen, editingMessage, startEdit, closeEdit, submitEdit } = useEditAnswer();

  const renderMessageContent = (message: MessageType) => {
    if (message.sender === 'daryle') {
      return parseMarkdownBold(message.content);
    }
    return message.content;
  };

  return (
    <>
      {showWelcome && (
        <div className="text-center text-[var(--chat-muted)] mt-6">
          Start a conversation! Choose a prompt below or type your question.
        </div>
      )}

      {messages.map((message, index) => (
        <div key={message.id} className="mb-4 group">
          <div className="flex items-start space-x-2 max-w-4xl mx-auto">
            {message.sender === 'daryle' ? (
              <>
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/daryle-avatar.png" alt="Daryle Avatar" />
                  <AvatarFallback>DY</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-1">
                    <span className="text-sm font-semibold text-[var(--chat-text)]">
                      Daryle
                    </span>
                    <VerifiedMark />
                    <span className="text-xs text-[var(--chat-muted)]">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="prose prose-sm w-full break-words text-[var(--chat-text)]">
                    {renderMessageContent(message)}
                    {message.sources && message.sources.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-[var(--chat-muted)] cursor-pointer">
                          Sources
                        </summary>
                        <ul className="list-disc pl-5 mt-1">
                          {message.sources.map((source, i) => (
                            <li key={i} className="text-sm text-[var(--chat-muted)]">
                              {source.title}
                              {source.url && (
                                <a href={source.url} target="_blank" rel="noopener noreferrer" className="ml-1 text-brand-blue hover:underline">
                                  (Link)
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => startEdit(message)}
                  className="text-[var(--chat-muted)] hover:text-[var(--chat-text)] focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Avatar className="w-8 h-8">
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-[var(--chat-text)]">
                      You
                    </span>
                    <span className="text-xs text-[var(--chat-muted)]">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="prose prose-sm w-full break-words text-[var(--chat-text)]">
                    {renderMessageContent(message)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ))}

      {isBotTyping && (
        <div className="mb-4">
          <div className="flex items-start space-x-2 max-w-4xl mx-auto">
            <Avatar className="w-8 h-8">
              <AvatarImage src="/daryle-avatar.png" alt="Daryle Avatar" />
              <AvatarFallback>DY</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-1">
                <span className="text-sm font-semibold text-[var(--chat-text)]">
                  Daryle
                </span>
                <VerifiedMark />
              </div>
              <div className="text-[var(--chat-text)]">
                Thinking...
              </div>
            </div>
          </div>
        </div>
      )}
      
      <EditAnswerModal
        isOpen={editModalOpen}
        onClose={closeEdit}
        originalMessage={editingMessage?.content || ''}
        messageId={editingMessage?.id || ''}
        chatId={editingMessage?.chatId}
        onSubmit={submitEdit}
      />
    </>
  );
};

export default ChatMessagesContainer;
