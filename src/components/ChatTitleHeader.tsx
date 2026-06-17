
import React, { useState, useRef, useEffect } from "react";
import { Pencil } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { getDisplayTitle, shouldShowTitle } from "@/utils/titleUtils";

interface ChatTitleHeaderProps {
  title?: string;
  onUpdateTitle: (newTitle: string) => void;
  sessionStartedAt: Date;
  chatCreatedAt?: Date; // Add optional chat creation timestamp
}

const ChatTitleHeader: React.FC<ChatTitleHeaderProps> = ({
  title = "Untitled Conversation",
  onUpdateTitle,
  sessionStartedAt,
  chatCreatedAt,
}) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update internal title when prop changes
  useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  // When entering edit mode, focus the input
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEditing = () => {
    setIsEditing(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedTitle(e.target.value);
  };

  const saveTitle = () => {
    // Don't allow empty titles
    const newTitle = editedTitle.trim() || "Untitled Conversation";
    
    // Truncate if too long
    const truncatedTitle = newTitle.length > 50 
      ? newTitle.substring(0, 47) + "..." 
      : newTitle;
    
    if (truncatedTitle !== title) {
      onUpdateTitle(truncatedTitle);
      toast({
        description: "Chat title updated",
        duration: 2000,
      });
    }
    
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveTitle();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditedTitle(title);
    }
  };

  // Use chat creation time if available, otherwise fall back to session start time
  const formattedDate = formatDate(chatCreatedAt || sessionStartedAt);

  // Use consistent title display - show full title in header (including emojis if any)
  const displayTitle = getDisplayTitle(title, "New Conversation");

  return (
    <div className="flex flex-col items-center text-center min-w-0 max-w-full">
      {isEditing ? (
        <div className="flex items-center">
          <input
            ref={inputRef}
            type="text"
            className="text-lg font-semibold text-center border-b border-brand-green focus:outline-none focus:ring-0 bg-transparent"
            value={editedTitle}
            onChange={handleTitleChange}
            onBlur={saveTitle}
            onKeyDown={handleKeyDown}
            maxLength={50}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 max-w-full">
          <h1 className="text-lg font-semibold text-brand-green truncate flex-1 min-w-0" title={displayTitle}>
            {displayTitle}
          </h1>
          <button
            className="text-[var(--chat-muted)] hover:text-brand-yellow flex-shrink-0 focus-ring rounded"
            aria-label="Edit Title"
            onClick={handleStartEditing}
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      )}
      <p className="text-xs text-[var(--chat-text-secondary)] mt-1">Started {formattedDate}</p>
    </div>
  );
};

export default ChatTitleHeader;
