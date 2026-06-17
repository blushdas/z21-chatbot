
import React, { useState } from 'react';
import { Copy, Check, ThumbsUp, ThumbsDown, RotateCcw, Edit3, FileText } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useFeedback } from '@/hooks/useFeedback';
import { useEditAnswer } from '@/hooks/useEditAnswer';
import { useAuth } from '@/context/SupabaseAuthContext';
import { createCanvasFromMarkdown } from '@/hooks/useCanvas';
import { toast } from 'sonner';
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

interface MessageActionsProps {
  messageId: string;
  messageContent: string;
  messageMode?: string;
}

const MessageActions: React.FC<MessageActionsProps> = ({ 
  messageId, 
  messageContent, 
  messageMode 
}) => {
  const [copied, setCopied] = useState(false);
  const { submitFeedback } = useFeedback();
  const { openEditModal } = useEditAnswer();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { chatId: routeChatId } = useParams<{ chatId: string }>();
  const [opening, setOpening] = useState(false);
  const [confirmCanvasOpen, setConfirmCanvasOpen] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(messageContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Failed to copy, user will not see feedback
    }
  };

  const handleFeedback = (isPositive: boolean) => {
    submitFeedback({
      messageId,
      isPositive,
      messageContent,
      mode: messageMode
    });
  };

  const handleEdit = () => {
    openEditModal({
      messageId,
      currentContent: messageContent,
      mode: messageMode
    });
  };

  const handleRegenerate = () => {
    // Regeneration not yet available
  };

  const handleOpenInCanvas = async () => {
    if (!user || opening) return;
    // Canvases are chat-native — must have a parent chat.
    const chatId =
      routeChatId ||
      (window.location.pathname.match(/^\/chat\/([^/?#]+)/)?.[1] ?? null);
    if (!chatId) {
      toast.error('Open a chat first to create a canvas');
      return;
    }
    setOpening(true);
    const canvas = await createCanvasFromMarkdown({
      ownerId: user.id,
      markdown: messageContent,
      chatId,
      createdFromMessageId: messageId,
    });
    setOpening(false);
    if (!canvas) {
      toast.error('Could not open canvas');
      return;
    }
    toast.success('Canvas (Alpha) created from chat');
    navigate(`/chat/${chatId}?canvas=${canvas.id}`, { state: { canvasOpened: true } });
  };

  return (
    <div className="flex items-center gap-1 mt-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyToClipboard}
              className="h-8 w-8 p-0 hover:bg-[var(--ui-bg-hover)]"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{copied ? 'Copied!' : 'Copy response'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback(true)}
              className="h-8 w-8 p-0 hover:bg-[var(--ui-bg-hover)]"
            >
              <ThumbsUp className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Good response</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleFeedback(false)}
              className="h-8 w-8 p-0 hover:bg-[var(--ui-bg-hover)]"
            >
              <ThumbsDown className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Poor response</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0 hover:bg-[var(--ui-bg-hover)]"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit response</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              className="h-8 w-8 p-0 hover:bg-[var(--ui-bg-hover)]"
            >
              <RotateCcw className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Regenerate response</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirmCanvasOpen(true)}
              disabled={opening}
              className="h-8 w-8 p-0 hover:bg-[var(--ui-bg-hover)]"
            >
              <FileText className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Create canvas from chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialog open={confirmCanvasOpen} onOpenChange={setConfirmCanvasOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Turn this message into a canvas?</AlertDialogTitle>
            <AlertDialogDescription>
              A new canvas will be created from this message's content and opened
              in this chat. You can keep editing it from there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmCanvasOpen(false);
                void handleOpenInCanvas();
              }}
            >
              Create canvas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MessageActions;
