import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { subscribeToAllCompletions } from '@/utils/activeStreamingTracker';

/**
 * Hook that shows a toast notification when a background streaming chat completes.
 * Similar to ChatGPT's behavior - notifies users when a response finishes while they're away.
 */
export const useStreamingCompletionToast = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const unsubscribe = subscribeToAllCompletions((chatId, finalState) => {
      // Get the chat ID from current route
      const currentChatId = location.pathname.match(/\/chat\/([^/]+)/)?.[1];
      
      // Only show toast if user is NOT currently viewing this chat
      if (currentChatId !== chatId) {
        const chatTitle = finalState.chatTitle;
        const firstUserMessage = finalState.messages.find(m => m.sender === 'user')?.content;
        
        // Determine display text - prefer title, fallback to first message preview
        const displayTitle = chatTitle && chatTitle !== 'New Chat' 
          ? chatTitle.length > 50 ? chatTitle.slice(0, 50) + '...' : chatTitle
          : firstUserMessage 
            ? `"${firstUserMessage.slice(0, 40)}${firstUserMessage.length > 40 ? '...' : ''}"`
            : 'Your chat';
        
        console.log('🔔 Showing completion toast for background chat:', chatId);
        
        toast.success('Response ready', {
          description: displayTitle,
          action: {
            label: 'View',
            onClick: () => navigate(`/chat/${chatId}?refresh=true`)
          }
        });
      }
    });
    
    return unsubscribe;
  }, [navigate, location.pathname]);
};
