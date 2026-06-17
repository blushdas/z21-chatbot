
import React from "react";
import { format } from "date-fns";
import { SavedChat } from "@/context/SavedChatsContext";
import { ArrowRight, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cleanTitle, getDisplayTitle } from "@/utils/titleUtils";

interface SavedChatCardProps {
  chat: SavedChat;
  onView: (id: string) => void;
  onResume: (id: string) => void;
  isActive?: boolean;
}

const SavedChatCard: React.FC<SavedChatCardProps> = ({
  chat,
  onView,
  onResume,
  isActive = false
}) => {
  // Use consistent title display logic
  const displayTitle = cleanTitle(chat.title) || `${chat.mode} Chat`;

  return (
    <div 
      className={`bg-[var(--chat-card)] rounded-xl shadow-sm p-4 transition-all duration-200 border ${
        isActive ? "border-brand-green ring-1 ring-brand-green" : "border-[var(--chat-border)]"
      } hover:shadow-md`}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-base font-medium">
          {displayTitle}
        </h3>
      </div>
      
      <p className="text-sm text-[var(--chat-muted)] mb-3">
        {format(new Date(chat.timestamp), "MMM d, yyyy 'at' h:mm a")}
      </p>
      
      <div className="mb-4">
        <ul className="text-sm text-[var(--chat-text)] space-y-1">
          {chat.summary.map((point, index) => (
            <li key={index} className="line-clamp-2">• {point}</li>
          ))}
        </ul>
      </div>
      
      <div className="flex justify-between items-center gap-2 mt-auto">
        <Button
          variant="outline"
          size="sm"
          className="text-[var(--chat-text-secondary)] flex items-center gap-1.5 flex-1 justify-center"
          onClick={() => onView(chat.id)}
        >
          <FolderOpen className="h-4 w-4" />
          <span>View in Chat</span>
        </Button>
        <Button
          variant="default"
          size="sm"
          className="bg-brand-green hover:bg-brand-green/90 flex items-center gap-1.5 flex-1 justify-center"
          onClick={() => onResume(chat.id)}
        >
          <ArrowRight className="h-4 w-4" />
          <span>Resume</span>
        </Button>
      </div>
    </div>
  );
};

export default SavedChatCard;
