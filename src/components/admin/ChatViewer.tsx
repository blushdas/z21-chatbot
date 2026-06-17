import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MessageType } from '@/components/ChatInterface';
import EmbeddedChatViewer from './EmbeddedChatViewer';

interface ChatViewerProps {
  chatId: string | null;
}

interface ChatData {
  id: string;
  title: string;
  messages: any[];
  updated_at: string;
  created_at: string;
  user_id: string;
  mode: string;
  profiles: {
    name: string;
    email: string;
  } | null;
}

const ChatViewer: React.FC<ChatViewerProps> = ({ chatId }) => {
  const [chat, setChat] = useState<ChatData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChat = async () => {
      if (!chatId) {
        setChat(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from('chats')
          .select(`
            id,
            title,
            messages,
            updated_at,
            created_at,
            user_id,
            mode
          `)
          .eq('id', chatId)
          .single();

        if (error) {
          console.error('Error fetching chat:', error);
          setError('Failed to load chat');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', data.user_id)
          .maybeSingle();

        // Parse messages from JSON and transform to match UnifiedChatViewer format
        let parsedMessages: any[] = [];
        if (data.messages) {
          try {
            const rawMessages = Array.isArray(data.messages) 
              ? data.messages 
              : JSON.parse(data.messages as string);
            
            // Transform messages to match UnifiedChatViewer's expected format
            parsedMessages = rawMessages.map((msg: MessageType) => ({
              ...msg,
              sender: msg.sender === 'daryle' ? 'assistant' : msg.sender,
              timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : undefined
            }));
          } catch (parseError) {
            console.error('Error parsing messages:', parseError);
            parsedMessages = [];
          }
        }

        setChat({
          ...data,
          profiles: profile,
          messages: parsedMessages
        });
      } catch (error) {
        console.error('Error fetching chat:', error);
        setError('Failed to load chat');
      } finally {
        setLoading(false);
      }
    };

    fetchChat();
  }, [chatId]);


  if (!chatId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <p>Select a chat to view the conversation</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="flex items-center justify-center h-full text-destructive">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p>{error || 'Chat not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <EmbeddedChatViewer
        chat={chat}
        showMetadata={true}
      />
    </div>
  );
};

export default ChatViewer;
