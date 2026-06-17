
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Star, Calendar, MessageCircle } from 'lucide-react';
import { parseMarkdownBold } from '@/utils/markdownParser';

interface UserFavoritesTabProps {
  userId: string;
}

const UserFavoritesTab: React.FC<UserFavoritesTabProps> = ({ userId }) => {
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['user-favorites', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const handleViewInChat = async (chatId: string, messageIndex: number) => {
    // Fetch full chat data
    const { data: chat, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (error || !chat) {
      alert('Chat not found or has been deleted.');
      return;
    }

    setSelectedChat({ ...chat, highlightMessageIndex: messageIndex });
    setShowChatModal(true);
  };

  const formatMessageContent = (content: string) => {
    return <div className="prose max-w-none whitespace-pre-wrap">{parseMarkdownBold(content)}</div>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <p>Loading favorites...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          User Favorites ({favorites.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {favorites.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No favorites found for this user</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="border rounded-lg p-4 hover:bg-muted transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Favorited: {new Date(favorite.created_at).toLocaleString()}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewInChat(favorite.chat_id, favorite.message_index)}
                  >
                    <MessageCircle className="w-4 h-4 mr-1" />
                    View Chat
                  </Button>
                </div>
                
                <div className="bg-muted rounded p-3 mb-3">
                  <div className="text-sm text-foreground">
                    {formatMessageContent(favorite.content)}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Chat: {favorite.chat_id.slice(0, 8)}... • Message #{favorite.message_index}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Chat Modal */}
      <Dialog open={showChatModal} onOpenChange={setShowChatModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Chat Conversation - {selectedChat?.title || `${selectedChat?.mode} Chat`}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] p-4">
            {selectedChat?.messages?.map((message: any, index: number) => {
              const isHighlighted = index === selectedChat.highlightMessageIndex;
              return (
                <div 
                  key={message.id} 
                  className={`mb-6 p-4 rounded-lg transition-colors ${
                    isHighlighted 
                      ? 'bg-yellow-50 border-2 border-yellow-200 dark:border-yellow-500/20' 
                      : 'bg-muted'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-medium px-2 py-1 rounded ${
                      message.sender === 'user' 
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300' 
                        : 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300'
                    }`}>
                      {message.sender === 'user' ? 'User' : 'Assistant'}
                    </span>
                    {isHighlighted && (
                      <span className="text-xs bg-yellow-200 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300 px-2 py-1 rounded">
                        Favorited Message
                      </span>
                    )}
                  </div>
                  <div className="text-foreground leading-relaxed">
                    {formatMessageContent(message.content)}
                  </div>
                  {message.timestamp && (
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(message.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default UserFavoritesTab;
