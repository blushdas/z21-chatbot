
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, Calendar, ThumbsUp, ThumbsDown, Edit3 } from 'lucide-react';
import FeedbackDetailModal from '@/components/admin/feedback/FeedbackDetailModal';
import { useToast } from '@/hooks/use-toast';
import UnifiedChatViewer from '@/components/admin/UnifiedChatViewer';

interface UserFeedbackTabProps {
  userId: string;
}

interface FeedbackEntry {
  id: string;
  user_id: string | null;
  chat_id: string | null;
  message_id: string;
  role: string | null;
  original_message: string | null;
  edited_message: string | null;
  length_preference: string | null;
  rating: string | null;
  comment: string | null;
  created_at: string;
  profiles?: {
    name: string | null;
    id: string;
  } | null;
  chats?: {
    title: string;
    id: string;
  } | null;
}

const UserFeedbackTab: React.FC<UserFeedbackTabProps> = ({ userId }) => {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const { toast } = useToast();

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['user-feedback', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_logs')
        .select(`
          *,
          chats!feedback_logs_chat_id_fkey (
            id,
            title
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    }
  });

  const onSelectFeedback = async (id: string) => {
    try {
      console.log('Fetching feedback details for ID:', id);
      
      const { data, error } = await supabase
        .from('feedback_logs')
        .select(`
          *,
          profiles!feedback_logs_user_id_fkey (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching feedback details:', error);
        toast({
          title: "Error",
          description: "Failed to load feedback details",
          variant: "destructive"
        });
        return;
      }

      console.log('Fetched feedback details:', data);
      
      // Handle profiles data properly with null checking
      let profilesData = null;
      
      if (data.profiles && 
          typeof data.profiles === 'object' && 
          !Array.isArray(data.profiles)) {
        // Type assertion since we know the structure from the query
        const profile = data.profiles as { id: string; name: string | null };
        profilesData = {
          id: profile.id,
          name: profile.name
        };
      }
      
      const feedbackData: FeedbackEntry = {
        ...data,
        profiles: profilesData
      };
      setSelectedFeedback(feedbackData);
      setDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching feedback details:', error);
      toast({
        title: "Error",
        description: "Failed to load feedback details",
        variant: "destructive"
      });
    }
  };

  const handleCloseModal = () => {
    setDetailModalOpen(false);
    setSelectedFeedback(null);
  };

  const handleViewInChat = async (chatId: string) => {
    // Fetch full chat data
    const { data: chat, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (error || !chat) {
      toast({
        title: "Error",
        description: "Chat not found or has been deleted.",
        variant: "destructive"
      });
      return;
    }

    setSelectedChat(chat);
    setShowChatModal(true);
  };


  const getFeedbackCategoryBadge = (entry: any) => {
    if (entry.edited_message) {
      return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-500/10 dark:text-yellow-300 border-yellow-200 dark:border-yellow-500/20"><Edit3 className="w-3 h-3 mr-1" />Rewrite</Badge>;
    }
    if (entry.rating === 'thumbs_up' || entry.rating === 'helpful') {
      return <Badge className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-300 border-green-200 dark:border-green-500/20"><ThumbsUp className="w-3 h-3 mr-1" />Helpful</Badge>;
    }
    if (entry.rating === 'thumbs_down' || entry.rating === 'not_helpful') {
      return <Badge className="bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-300 border-red-200 dark:border-red-500/20"><ThumbsDown className="w-3 h-3 mr-1" />Not Helpful</Badge>;
    }
    if (entry.comment && !entry.edited_message) {
      return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300 border-blue-200 dark:border-blue-500/20"><MessageCircle className="w-3 h-3 mr-1" />Comment</Badge>;
    }
    return <Badge variant="outline">Other</Badge>;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <p>Loading feedback...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            User Feedback ({feedback.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No feedback found for this user</p>
            </div>
          ) : (
            <div className="space-y-4">
              {feedback.map((item) => (
                <div 
                  key={item.id} 
                  className="border rounded-lg p-4 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => onSelectFeedback(item.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      {getFeedbackCategoryBadge(item)}
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                    {item.chat_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          handleViewInChat(item.chat_id);
                        }}
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        View Chat
                      </Button>
                    )}
                  </div>

                  {item.chats?.title && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-foreground mb-1">Chat Title:</div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 rounded p-2 text-sm">
                        {item.chats.title}
                      </div>
                    </div>
                  )}

                  {item.original_message && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-foreground mb-1">Original Message:</div>
                      <div className="bg-muted rounded p-3 text-sm truncate">
                        {item.original_message.length > 100 
                          ? `${item.original_message.substring(0, 100)}...` 
                          : item.original_message}
                      </div>
                    </div>
                  )}

                  {item.edited_message && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-foreground mb-1">Edited Message:</div>
                      <div className="bg-yellow-50 dark:bg-yellow-950/30 text-yellow-900 dark:text-yellow-100 rounded p-3 text-sm truncate">
                        {item.edited_message.length > 100 
                          ? `${item.edited_message.substring(0, 100)}...` 
                          : item.edited_message}
                      </div>
                    </div>
                  )}

                  {item.comment && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-foreground mb-1">Comment:</div>
                      <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 rounded p-3 text-sm truncate">
                        {item.comment.length > 100 
                          ? `${item.comment.substring(0, 100)}...` 
                          : item.comment}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-4">
                      {item.length_preference && (
                        <span>Length: {item.length_preference}</span>
                      )}
                      {item.role && (
                        <span>Role: {item.role}</span>
                      )}
                    </div>
                    <span>Message: {item.message_id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FeedbackDetailModal
        feedback={selectedFeedback}
        isOpen={detailModalOpen}
        onClose={handleCloseModal}
      />

      <UnifiedChatViewer
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        chat={selectedChat}
        showMetadata={true}
      />
    </>
  );
};

export default UserFeedbackTab;
