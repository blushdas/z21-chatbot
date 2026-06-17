import React, { useState, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MessageSquare, User, Bot, Calendar, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { parseMarkdownBold } from '@/utils/markdownParser';

interface ChatMessage {
  id?: string;
  sender: 'user' | 'daryle' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  citation?: any;
  mode?: string;
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

interface EmbeddedChatViewerProps {
  chat: ChatData | null;
  userName?: string;
  highlightMessageIndex?: number;
  showMetadata?: boolean;
  title?: string;
}

const EmbeddedChatViewer: React.FC<EmbeddedChatViewerProps> = ({
  chat,
  userName,
  highlightMessageIndex,
  showMetadata = true,
  title
}) => {
  const [metadataOpen, setMetadataOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chat?.messages && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat?.messages]);

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
      <div className="prose max-w-none whitespace-pre-wrap text-sm leading-relaxed">
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <MessageSquare className="w-5 h-5 text-primary" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {title || chat.title || `${chat.mode || 'Chat'} Conversation`}
              </h3>
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
        </div>
        
        {showMetadata && (
          <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
            <CollapsibleContent className="pt-3 border-t mt-3">
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
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {chat.messages?.length > 0 ? (
            chat.messages.map((message, index) => (
              <div 
                key={`${message.id || 'msg'}-${index}`}
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
    </div>
  );
};

export default EmbeddedChatViewer;
