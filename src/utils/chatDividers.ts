import { MessageType, ChatMode } from '@/components/ChatInterface';

export interface DividerInfo {
  show: boolean;
  label: string;
  variant: 'simple' | 'labeled';
}

export const shouldShowDivider = (
  message: MessageType,
  previousMessage: MessageType | undefined,
  index: number
): DividerInfo => {
  // Don't show divider for first message - removed per user feedback
  if (index === 0) {
    return { show: false, label: "", variant: "simple" };
  }

  if (!previousMessage) {
    return { show: false, label: "", variant: "simple" };
  }

  // Mode/persona change - show mode transition divider
  if (message.mode !== previousMessage.mode) {
    const modeLabels: Record<ChatMode, string> = {
      coach: "Daryle AI",
      advisor: "Advisor"
    };

    return {
      show: true,
      label: `Switched to ${modeLabels[message.mode] || message.mode}`,
      variant: "labeled"
    };
  }

  // Significant time gap (more than 1 hour) - show time-based divider
  const messageTime = new Date(message.timestamp || Date.now());
  const previousTime = new Date(previousMessage.timestamp || Date.now());
  const timeDiff = messageTime.getTime() - previousTime.getTime();
  const hoursDiff = timeDiff / (1000 * 60 * 60);

  if (hoursDiff > 1) {
    const today = new Date();
    const messageDate = new Date(messageTime);
    
    // Check if it's from today, yesterday, or earlier
    const diffDays = Math.floor((today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let label = "Earlier";
    if (diffDays === 0) {
      label = "Today";
    } else if (diffDays === 1) {
      label = "Yesterday"; 
    } else if (diffDays < 7) {
      label = messageDate.toLocaleDateString('en-US', { weekday: 'long' });
    } else {
      label = messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    return {
      show: true,
      label,
      variant: "labeled"
    };
  }

  return { show: false, label: "", variant: "simple" };
};