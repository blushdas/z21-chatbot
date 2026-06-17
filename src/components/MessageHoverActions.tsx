
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Edit, Copy, Check, FileText, MessageSquare, LayoutTemplate } from 'lucide-react';
import { toast as sonnerToast } from 'sonner';
import { createCanvasFromMarkdown } from '@/hooks/useCanvas';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { feedbackService } from '@/services/feedbackService';
import FeedbackModal from './FeedbackModal';
import FavoriteButton from './favorites/FavoriteButton';
import { useCitationVisibility } from '@/context/CitationVisibilityContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface MessageHoverActionsProps {
  message: {
    id: string;
    chatId?: string | null;
    text?: string;
    content?: string;
    role?: string;
    sender?: string;
    sources?: any[];
  };
  messageIndex: number;
  onRegenerate?: (index: number) => void;
  onViewSources?: () => void;
  isAssistant?: boolean;
}

const MessageHoverActions = ({ 
  message, 
  messageIndex, 
  onRegenerate, 
  onViewSources,
  isAssistant = false
}: MessageHoverActionsProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { citationsVisible, toggleCitationsVisibility } = useCitationVisibility();
  const navigate = useNavigate();
  const { chatId: routeChatId } = useParams<{ chatId: string }>();
  const [openingCanvas, setOpeningCanvas] = useState(false);
  const [confirmCanvasOpen, setConfirmCanvasOpen] = useState(false);

  const handleTurnIntoCanvas = async () => {
    if (!user || openingCanvas) return;
    const chatId =
      message.chatId ||
      routeChatId ||
      (window.location.pathname.match(/^\/chat\/([^/?#]+)/)?.[1] ?? null);
    if (!chatId) {
      sonnerToast.error('Open a chat first to create a canvas');
      return;
    }
    setOpeningCanvas(true);
    const canvas = await createCanvasFromMarkdown({
      ownerId: user.id,
      markdown: messageText,
      chatId,
      createdFromMessageId: message.id,
    });
    setOpeningCanvas(false);
    if (!canvas) {
      sonnerToast.error('Could not create canvas');
      return;
    }
    sonnerToast.success('Canvas (Alpha) created from message');
    navigate(`/chat/${chatId}?canvas=${canvas.id}`, { state: { canvasOpened: true } });
  };

  const messageText = message.text || message.content || '';
  const hasSources = message.sources && message.sources.length > 0;

  // Load existing feedback when component mounts
  useEffect(() => {
    const loadExistingFeedback = async () => {
      if (!user || !isAssistant) return;
      
      setIsLoadingFeedback(true);
      
      try {
        const { data, error } = await supabase
          .from('feedback_logs')
          .select('rating')
          .eq('user_id', user.id)
          .eq('message_id', message.id)
          .in('rating', ['thumbs_up', 'thumbs_down'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error loading existing feedback:', error);
          return;
        }

        if (data && (data.rating === 'thumbs_up' || data.rating === 'thumbs_down')) {
          setCurrentFeedback(data.rating);
        }
      } catch (error) {
        console.error('Error loading existing feedback:', error);
      } finally {
        setIsLoadingFeedback(false);
      }
    };

    loadExistingFeedback();
  }, [user, message.id, isAssistant]);

  const handleCopyToClipboard = () => {
    // Strip citation markers from copied text
    const textToCopy = messageText.replace(/\[\d+\]/g, '');
    
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFeedbackToggle = async (rating: 'thumbs_up' | 'thumbs_down') => {
    if (!user || isLoadingFeedback) return;
    
    setIsLoadingFeedback(true);
    
    try {
      // If clicking the same button that's currently active, toggle it off (remove feedback)
      if (currentFeedback === rating) {
        const { error } = await supabase
          .from('feedback_logs')
          .delete()
          .eq('user_id', user.id)
          .eq('message_id', message.id)
          .eq('rating', rating);

        if (error) {
          console.error('Error removing feedback:', error);
          return;
        }

        setCurrentFeedback(null);
        toast({
          title: "Feedback removed",
          description: "Your feedback has been removed",
        });
      } else {
        // If there's existing feedback, delete it first
        if (currentFeedback) {
          await supabase
            .from('feedback_logs')
            .delete()
            .eq('user_id', user.id)
            .eq('message_id', message.id)
            .eq('rating', currentFeedback);
        }

        // Insert new feedback using feedbackService
        await feedbackService.submitFeedback({
          user_id: user.id,
          chat_id: message.chatId || null,
          message_id: message.id,
          role: isAssistant ? 'bot' : 'user',
          original_message: messageText,
          rating: rating,
          comment: null
        });


        setCurrentFeedback(rating);
        
        const wasSwitch = currentFeedback && currentFeedback !== rating;
        toast({
          title: wasSwitch ? "Feedback updated" : "Thanks for your feedback!",
          description: wasSwitch 
            ? `Switched to ${rating === 'thumbs_up' ? 'helpful' : 'not helpful'}`
            : `Marked as ${rating === 'thumbs_up' ? 'helpful' : 'not helpful'}`,
        });
      }
    } catch (error) {
      console.error('Error handling feedback toggle:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update feedback. Please try again.",
      });
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  return (
    <>
      {/* Toolbar - Seamlessly blended with background */}
      <div className="flex items-center space-x-1 bg-transparent">
        {/* Copy Button */}
        <button
          onClick={handleCopyToClipboard}
          className="p-1.5 text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] focus:outline-none transition-colors rounded-md"
          aria-label="Copy message"
          title="Copy"
        >
          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>

        {/* Favorite Button (for all messages if user is authenticated) */}
        {user && message.chatId && (
          <FavoriteButton
            chatId={message.chatId}
            messageIndex={messageIndex}
            messageContent={messageText}
            messageRole={message.role || message.sender || 'user'}
            className="p-1.5 text-[var(--chat-muted)] hover:text-brand-yellow hover:bg-[var(--ui-bg-hover)] rounded-md transition-colors"
          />
        )}

        {/* Regenerate Button (only for assistant messages) */}
        {isAssistant && onRegenerate && (
          <button
            onClick={() => onRegenerate(messageIndex)}
            className="p-1.5 text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] focus:outline-none transition-colors rounded-md"
            aria-label="Regenerate response"
            title="Regenerate"
          >
            <Edit className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Rate & Improve Response Button (combined feedback + edit) */}
        {isAssistant && user && (
          <button
            onClick={() => setShowFeedbackModal(true)}
            className={cn(
              "p-1.5 rounded-md hover:bg-[var(--ui-bg-hover)] transition-colors",
              currentFeedback === 'thumbs_up'
                ? 'text-green-600 dark:text-green-400'
                : currentFeedback === 'thumbs_down'
                ? 'text-red-600 dark:text-red-400'
                : 'text-[var(--chat-muted)] hover:text-[var(--chat-text)]'
            )}
            aria-label="Rate or improve this response"
            title={
              currentFeedback === 'thumbs_up'
                ? 'Feedback: helpful'
                : currentFeedback === 'thumbs_down'
                ? 'Feedback: not helpful'
                : 'Rate or improve this response'
            }
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>
        )}

        {/* Turn into Canvas (only for assistant messages) */}
        {isAssistant && user && (
          <>
            <button
              onClick={() => setConfirmCanvasOpen(true)}
              disabled={openingCanvas}
              className="p-1.5 text-[var(--chat-muted)] hover:text-brand-yellow hover:bg-[var(--ui-bg-hover)] focus:outline-none transition-colors rounded-md disabled:opacity-50"
              aria-label="Turn into Canvas (Alpha)"
              title="Turn into Canvas (Alpha)"
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
            </button>
            <AlertDialog open={confirmCanvasOpen} onOpenChange={setConfirmCanvasOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Turn this message into a canvas?</AlertDialogTitle>
                  <AlertDialogDescription>
                    A new canvas will be created from this message's content and
                    opened in this chat. You can keep editing it from there.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setConfirmCanvasOpen(false);
                      void handleTurnIntoCanvas();
                    }}
                  >
                    Create canvas
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {/* Citation Toggle Button */}
        {hasSources && (
          <button
            onClick={toggleCitationsVisibility}
            className={cn(
              "px-2 py-1 rounded-md text-xs font-normal transition-colors",
              citationsVisible 
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-500/15 dark:hover:bg-blue-500/20' 
                : 'text-[var(--chat-muted)] bg-[var(--ui-bg-hover)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)]'
            )}
            aria-label={citationsVisible ? "Hide citations" : "Show citations"}
            title={citationsVisible ? "Hide citations" : "Show citations"}
          >
            [1]
          </button>
        )}

        {/* View Sources Button (only when sources exist) */}
        {hasSources && onViewSources && (
          <button
            onClick={onViewSources}
            className="p-1.5 text-[var(--chat-muted)] hover:text-[var(--chat-text)] hover:bg-[var(--ui-bg-hover)] focus:outline-none transition-colors rounded-md"
            aria-label="View sources"
            title={`View sources (${message.sources?.length || 0})`}
          >
            <FileText className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          messageId={message.id}
          originalMessage={messageText}
          messageRole={isAssistant ? 'bot' : 'user'}
          onSubmitted={(rating) => setCurrentFeedback(rating)}
        />
      )}
    </>
  );
};

export default MessageHoverActions;
