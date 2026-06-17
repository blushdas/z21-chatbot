
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Eye, Calendar } from 'lucide-react';
import UnifiedChatViewer from '@/components/admin/UnifiedChatViewer';

interface UserChatsTabProps {
  userId: string;
  userName?: string;
}

interface ChatMessage {
  sender: 'user' | 'daryle' | 'system';
  content: string;
  timestamp?: string;
}

const UserChatsTab: React.FC<UserChatsTabProps> = ({ userId, userName }) => {
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const { data: chats = [], isLoading } = useQuery({
    queryKey: ['user-chats', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'coach':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300';
      case 'mentor':
        return 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300';
      case 'therapist':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleViewChat = (chat: any) => {
    setSelectedChat(chat);
    setShowChatModal(true);
  };


  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <p>Loading chats...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <UnifiedChatViewer
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        chat={selectedChat}
        userName={userName}
        showMetadata={true}
      />

      {/* Chat List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            User Chats ({chats.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chats.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No chats found for this user</p>
            </div>
          ) : (
            <div className="space-y-4">
              {chats.map((chat) => (
                <div key={chat.id} className="border rounded-lg p-4 hover:bg-muted transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">{chat.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Created: {new Date(chat.created_at).toLocaleString()}
                        {chat.updated_at !== chat.created_at && (
                          <span>• Updated: {new Date(chat.updated_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getModeColor(chat.mode)}>
                        {chat.mode}
                      </Badge>
                      {chat.pinned && (
                        <Badge variant="secondary">Pinned</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Messages: {Array.isArray(chat.messages) ? chat.messages.length : 0}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewChat(chat)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Chat
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default UserChatsTab;
