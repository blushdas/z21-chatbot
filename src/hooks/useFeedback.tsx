
import { useCallback } from 'react';
import { feedbackService, FeedbackData } from '@/services/feedbackService';
import { useChatManagement } from './useChatManagement';

interface LegacyFeedbackData {
  messageId: string;
  isPositive: boolean;
  messageContent: string;
  mode?: string;
}

export const useFeedback = () => {
  const { currentChatId } = useChatManagement();

  const submitFeedback = useCallback(async (feedback: LegacyFeedbackData) => {
    console.log('Legacy feedback submitted:', {
      messageId: feedback.messageId,
      isPositive: feedback.isPositive,
      messageContent: feedback.messageContent,
      mode: feedback.mode,
      timestamp: new Date().toISOString()
    });
    
    // Store feedback in localStorage for backward compatibility
    const existingFeedback = JSON.parse(localStorage.getItem('feedbackLogs') || '[]');
    const newFeedbackEntry = {
      ...feedback,
      timestamp: new Date().toISOString(),
    };
    
    const updatedFeedback = [newFeedbackEntry, ...existingFeedback];
    localStorage.setItem('feedbackLogs', JSON.stringify(updatedFeedback));

    // Also submit to Supabase with new structure
    try {
      const supabaseFeedback: FeedbackData = {
        chat_id: currentChatId || undefined,
        message_id: feedback.messageId,
        role: 'bot', // Legacy feedback is always for bot messages
        original_message: feedback.messageContent,
        rating: feedback.isPositive ? 'thumbs_up' : 'thumbs_down',
      };

      await feedbackService.submitFeedback(supabaseFeedback);
    } catch (error) {
      console.error('Failed to submit feedback to Supabase:', error);
      // Don't throw error to maintain backward compatibility
    }
  }, [currentChatId]);

  const submitDetailedFeedback = useCallback(async (feedbackData: FeedbackData) => {
    try {
      return await feedbackService.submitFeedback({
        ...feedbackData,
        chat_id: currentChatId || undefined,
      });
    } catch (error) {
      console.error('Failed to submit detailed feedback:', error);
      throw error;
    }
  }, [currentChatId]);

  return {
    submitFeedback,
    submitDetailedFeedback
  };
};
