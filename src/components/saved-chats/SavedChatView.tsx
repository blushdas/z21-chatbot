
import React from "react";
import { format } from "date-fns";
import { SavedChat } from "@/context/SavedChatsContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CornerDownLeft } from "lucide-react";
import MessageBubble from "@/components/MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SourceDrawerProvider } from "@/hooks/useSourceDrawer";

interface SavedChatViewProps {
  chat: SavedChat;
  onBack: () => void;
  onResume: (id: string) => void;
}

const SavedChatView: React.FC<SavedChatViewProps> = ({ chat, onBack, onResume }) => {
  // Get mode emoji
  const getModeEmoji = (mode: string) => {
    switch (mode) {
      case "Coaching":
        return "🌿";
      case "Family":
        return "❤️";
      case "Investor":
        return "💼";
      case "Ambassador":
        return "🕊️";
      default:
        return "💬";
    }
  };

  return (
    <SourceDrawerProvider>
      <div className="flex flex-col h-full">
        <div className="border-b border-[var(--chat-border)] dark:border-gray-700 p-4 flex items-center justify-between bg-[var(--chat-card)] dark:bg-gray-800">
          <Button
            variant="ghost" 
            size="sm"
            className="flex items-center gap-1.5" 
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <div className="flex flex-col items-center">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <span>{getModeEmoji(chat.mode)}</span>
              {chat.title || `${chat.mode} Chat`}
            </h2>
            <p className="text-xs text-[var(--chat-muted)]">
              {format(new Date(chat.timestamp), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5"
            onClick={() => onResume(chat.id)}
          >
            <CornerDownLeft className="h-4 w-4" />
            <span>Resume</span>
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {chat.messages.map((message, index) => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                messageIndex={index}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </SourceDrawerProvider>
  );
};

export default SavedChatView;
