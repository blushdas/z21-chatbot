
import React, { useState } from 'react';
import { useJournal } from '@/context/JournalContext';
import { MessageType } from '@/components/ChatInterface';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';

interface JournalEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: MessageType;
  userPrompt?: string;
}

const JournalEntryModal: React.FC<JournalEntryModalProps> = ({
  open,
  onOpenChange,
  message,
  userPrompt = ""
}) => {
  const { addEntry } = useJournal();
  const { toast } = useToast();
  const [userNote, setUserNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      e.preventDefault();
      if (!tags.includes(currentTag.trim())) {
        setTags([...tags, currentTag.trim()]);
      }
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSaveEntry = () => {
    // Use the message mode or default to Coaching
    const mode = message.mode as any || "Coaching";
    
    // Create default tags if none were added
    const finalTags = tags.length > 0 
      ? tags 
      : mode === "Coaching" ? ["Leadership", "Growth"]
        : mode === "Family" ? ["Relationships", "Legacy"]
        : mode === "Investor" ? ["Strategy", "Value"]
        : ["Mission", "Representation"];
    
    addEntry({
      botResponse: message.content,
      originalPrompt: userPrompt,
      mode: mode,
      tags: finalTags,
      userNote: userNote,
      messageId: message.id,
    });
    
    toast({
      title: "Saved to Journal",
      description: "Your reflection has been added to your memory journal.",
      duration: 3000,
    });
    
    setUserNote("");
    setTags([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-brand-green">Save to Memory Journal</DialogTitle>
          <DialogDescription>
            Record your thoughts on this insight for future reference
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[var(--chat-text)]">Original prompt:</h4>
            <div className="border-l-4 border-brand-green pl-3 py-1 italic text-sm text-[var(--chat-text-secondary)]">
              "{userPrompt}"
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[var(--chat-text)]">Darylen Bot's response:</h4>
            <div className="bg-[var(--ui-bg-hover)] rounded p-3 font-serif text-sm max-h-[100px] overflow-y-auto">
              {message.content}
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="reflection" className="text-sm font-medium text-[var(--chat-text)]">
              What stood out to you?
            </label>
            <Textarea
              id="reflection"
              placeholder="Record your thoughts, insights, or action items based on this conversation..."
              value={userNote}
              onChange={(e) => setUserNote(e.target.value)}
              className="h-24 resize-none focus:border-brand-green focus:ring-brand-green"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="tags" className="text-sm font-medium text-[var(--chat-text)]">
              Tags (press Enter to add)
            </label>
            <Input
              id="tags"
              placeholder="Add tags..."
              value={currentTag}
              onChange={(e) => setCurrentTag(e.target.value)}
              onKeyDown={handleAddTag}
              className="focus:border-brand-green focus:ring-brand-green"
            />
            
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <div 
                  key={tag}
                  className="bg-[var(--ui-bg-hover)] text-[var(--chat-text-secondary)] text-xs px-2 py-1 rounded flex items-center"
                >
                  {tag}
                  <button 
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-[var(--chat-muted)] hover:text-red-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              
              {tags.length === 0 && (
                <span className="text-xs text-[var(--chat-muted)] italic">Default tags will be added based on mode</span>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handleSaveEntry} disabled={userNote.trim().length === 0}>
            Save to Journal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JournalEntryModal;
