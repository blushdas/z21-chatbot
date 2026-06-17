
import { supabase } from "@/integrations/supabase/client";

export interface FeedbackData {
  user_id?: string;
  chat_id?: string;
  message_id: string;
  role?: 'user' | 'bot';
  original_message?: string;
  edited_message?: string;
  length_preference?: 'short' | 'medium' | 'long' | 'daryle_long';
  rating?: 'thumbs_up' | 'thumbs_down';
  comment?: string;
}

export const feedbackService = {
  async submitFeedback(feedbackData: FeedbackData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const feedbackEntry = {
        ...feedbackData,
        user_id: user?.id || null,
      };

      const { data, error } = await supabase
        .from('feedback_logs')
        .insert([feedbackEntry])
        .select()
        .single();

      if (error) {
        console.error('Error submitting feedback:', error);
        throw error;
      }

      console.log('Feedback submitted successfully:', data);
      return data;
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  },

  async submitCommentFeedback(data: {
    messageId: string;
    chatId: string;
    messageRole: 'user' | 'bot';
    originalMessage: string;
    isHelpful: boolean;
    comment?: string;
  }) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const feedbackEntry = {
        user_id: user?.id || null,
        chat_id: data.chatId,
        message_id: data.messageId,
        role: data.messageRole,
        original_message: data.originalMessage,
        rating: data.isHelpful ? 'thumbs_up' : 'thumbs_down',
        comment: data.comment || null,
      };

      const { data: result, error } = await supabase
        .from('feedback_logs')
        .insert([feedbackEntry])
        .select()
        .single();

      if (error) {
        console.error('Error submitting comment feedback:', error);
        throw error;
      }

      console.log('Comment feedback submitted successfully:', result);
      return result;
    } catch (error) {
      console.error('Failed to submit comment feedback:', error);
      throw error;
    }
  },

  async getFeedbackForAdmin() {
    try {
      const { data, error } = await supabase
        .from('feedback_logs')
        .select(`
          *,
          profiles:user_id (
            name,
            id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching feedback:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
      throw error;
    }
  },

  async getFeedbackMetrics() {
    try {
      const { data, error } = await supabase
        .from('feedback_logs')
        .select('rating, length_preference, edited_message, comment');

      if (error) {
        console.error('Error fetching feedback metrics:', error);
        throw error;
      }

      const metrics = {
        total: data?.length || 0,
        thumbsUp: data?.filter(f => f.rating === 'thumbs_up').length || 0,
        thumbsDown: data?.filter(f => f.rating === 'thumbs_down').length || 0,
        edits: data?.filter(f => f.edited_message).length || 0,
        comments: data?.filter(f => f.comment).length || 0,
      };

      return metrics;
    } catch (error) {
      console.error('Failed to fetch feedback metrics:', error);
      throw error;
    }
  }
};
