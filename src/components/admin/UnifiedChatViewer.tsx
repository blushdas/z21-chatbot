import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquare, User, Bot, Calendar, ChevronDown, ChevronUp, Clock, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { parseMarkdownBold } from '@/utils/markdownParser';

interface ChatMessage {
  id?: string;
  sender: 'user' | 'daryle' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  citation?: any;
  mode?: string;
  model?: string;
  intent?: string;
  responseStyle?: string;
  knowledgeBaseEnabled?: boolean;
  sources?: any[];
  fileCitations?: any[];
  wasSharpened?: boolean;
  truncatedDocs?: boolean;
}

interface ChatData {
  id: string;
  title: string;
  messages: ChatMessage[];
  mode?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  profiles?: {
    name?: string;
    email?: string;
  } | null;
}

interface UnifiedChatViewerProps {
  isOpen: boolean;
  onClose: () => void;
  chat: ChatData | null;
  userName?: string;
  highlightMessageIndex?: number;
  showMetadata?: boolean;
  title?: string;
}

const UnifiedChatViewer: React.FC<UnifiedChatViewerProps> = ({
  isOpen,
  onClose,
  chat,
  userName,
  highlightMessageIndex,
  showMetadata = true,
  title
}) => {
  const [metadataOpen, setMetadataOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, chat?.messages]);

  const formatTimestamp = (timestamp: any): string => {
    try {
      let date: Date;
      
      if (timestamp instanceof Date) {
        date = timestamp;
      } else if (typeof timestamp === 'number') {
        date = new Date(timestamp);
      } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else {
        date = new Date();
      }
      
      if (isNaN(date.getTime())) {
        date = new Date();
      }
      
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(date);
    } catch (error) {
      return 'Unknown time';
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode?.toLowerCase()) {
      case 'coaching':
      case 'coach':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'family':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'investor':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ambassador':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'mentor':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'therapist':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-[var(--ui-bg-hover)] text-foreground/90 border-[var(--chat-border)]';
    }
  };

  const formatMessageContent = (content: string) => {
    return (
      <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {parseMarkdownBold(content)}
      </div>
    );
  };

  const getUserDisplayName = (message: ChatMessage) => {
    if (message.sender === 'user') {
      return userName || chat?.profiles?.name || 'User';
    }
    return 'Assistant';
  };

  if (!chat) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col" hideCloseButton={false} onClose={onClose}>
        <DialogHeader className="flex-shrink-0 pb-4 pr-20">
          <DialogTitle className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1">
              <MessageSquare className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <span className="text-lg font-semibold">
                  {title || chat.title || `${chat.mode || 'Chat'} Conversation`}
                </span>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  {chat.mode && (
                    <Badge className={getModeColor(chat.mode)}>
                      {chat.mode}
                    </Badge>
                  )}
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {chat.messages?.length || 0} messages
                  </span>
                  {chat.profiles?.name && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {chat.profiles.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0 mt-2">
              {showMetadata && (
                <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Details
                      {metadataOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
                    </Button>
                  </CollapsibleTrigger>
                </Collapsible>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                Exit
                <X className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </DialogTitle>
          
          {showMetadata && (
            <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
              <CollapsibleContent className="pt-3 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {chat.profiles?.email && (
                    <div>
                      <span className="font-medium text-foreground">Owner:</span>
                      <p className="text-muted-foreground">{chat.profiles.email}</p>
                    </div>
                  )}
                  {chat.created_at && (
                    <div>
                      <span className="font-medium text-foreground">Created:</span>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTimestamp(chat.created_at)}
                      </p>
                    </div>
                  )}
                  {chat.updated_at && (
                    <div>
                      <span className="font-medium text-foreground">Updated:</span>
                      <p className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(chat.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-foreground">Messages:</span>
                    <p className="text-muted-foreground">
                      {chat.messages.filter(m => m.sender === 'user').length} user, {' '}
                      {chat.messages.filter(m => m.sender === 'daryle' || m.sender === 'assistant').length} assistant
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 pb-4">
            {chat.messages?.length > 0 ? (
              chat.messages.map((message, index) => (
                <div 
                  key={message.id || index} 
                  className={`group ${
                    highlightMessageIndex === index ? 'ring-2 ring-primary ring-opacity-50 rounded-lg p-2' : ''
                  }`}
                >
                  {/* Message bubble */}
                  <div
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    } mb-2`}
                  >
                    {message.sender !== 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center flex-shrink-0 mr-3">
                        <Bot className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md [&_*]:!text-white [&_*]:!text-current'
                          : 'bg-muted text-foreground rounded-bl-md border'
                      }`}
                      style={message.sender === 'user' ? { color: 'white !important' } : {}}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-semibold uppercase tracking-wide ${
                          message.sender === 'user' 
                            ? '!text-white !opacity-80' 
                            : 'text-primary'
                        }`}>
                          {getUserDisplayName(message)}
                        </span>
                      </div>
                      
                      <div className={message.sender === 'user' ? '!text-white' : ''}>
                        {formatMessageContent(message.content)}
                      </div>
                      
                      {message.citation && (
                        <div className="mt-3 pt-3 border-t border-current/20 text-xs opacity-80">
                          <span className="font-medium">Source:</span>{' '}
                          {typeof message.citation === 'string' ? message.citation : message.citation.source}
                        </div>
                      )}
                    </div>
                    
                    {message.sender === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 ml-3">
                        <User className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Message metadata */}
                  <div
                    className={`flex items-center text-xs text-muted-foreground opacity-60 group-hover:opacity-100 transition-opacity mb-1 ${
                      message.sender === 'user' ? 'justify-end pr-11' : 'justify-start pl-11'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {message.timestamp && (
                        <>
                          <span>{formatTimestamp(message.timestamp)}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{message.content.length} chars</span>
                      {message.mode && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs capitalize py-0 px-1 h-auto">
                            {message.mode}
                          </Badge>
                        </>
                      )}
                      {message.sender !== 'user' && (
                        <>
                          {message.model && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs py-0 px-1 h-auto" title="Model">
                                {message.model}
                              </Badge>
                            </>
                          )}
                          {message.responseStyle && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs capitalize py-0 px-1 h-auto" title="Processing power / response style">
                                {message.responseStyle}
                              </Badge>
                            </>
                          )}
                          {message.intent && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs capitalize py-0 px-1 h-auto" title="Detected intent">
                                {message.intent}
                              </Badge>
                            </>
                          )}
                          {typeof message.knowledgeBaseEnabled === 'boolean' && (
                            <>
                              <span>•</span>
                              <Badge
                                variant="outline"
                                className={`text-xs py-0 px-1 h-auto ${message.knowledgeBaseEnabled ? 'border-emerald-300 text-emerald-700 dark:text-emerald-300' : 'border-muted-foreground/30'}`}
                                title="Knowledge base usage"
                              >
                                KB {message.knowledgeBaseEnabled ? 'on' : 'off'}
                                {Array.isArray(message.sources) && message.sources.length > 0 && ` · ${message.sources.length}`}
                              </Badge>
                            </>
                          )}
                          {Array.isArray(message.fileCitations) && message.fileCitations.length > 0 && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs py-0 px-1 h-auto" title="User document citations">
                                Files · {message.fileCitations.length}
                              </Badge>
                            </>
                          )}
                          {message.wasSharpened && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs py-0 px-1 h-auto border-amber-300 text-amber-700 dark:text-amber-300" title="Response was sharpened">
                                sharpened
                              </Badge>
                            </>
                          )}
                          {message.truncatedDocs && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs py-0 px-1 h-auto border-orange-300 text-orange-700 dark:text-orange-300" title="Some retrieved documents were truncated">
                                truncated
                              </Badge>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No messages in this conversation</p>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedChatViewer;