import React, { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import SavedChatCard from "./SavedChatCard";
import SavedChatView from "./SavedChatView";
import { useSavedChats, SavedChat } from "@/context/SavedChatsContext";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

interface SavedChatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeChat: (chat: SavedChat) => void;
}

const SavedChatsPanel: React.FC<SavedChatsPanelProps> = ({ isOpen, onClose, onResumeChat }) => {
  const { savedChats, currentChatId } = useSavedChats();
  const [viewingChatId, setViewingChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  const viewingChat = viewingChatId 
    ? savedChats.find(chat => chat.id === viewingChatId)
    : null;

  // Clean title by removing emoji prefixes
  const cleanTitle = (title: string) => {
    // Remove emojis from the beginning of the title using Unicode regex
    return title.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/gu, '').trim();
  };
  
  // Filter chats based on search term
  const filteredChats = savedChats.filter(chat => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const cleanedTitle = cleanTitle(chat.title);
    return (
      cleanedTitle.toLowerCase().includes(searchLower) ||
      chat.mode.toLowerCase().includes(searchLower) ||
      chat.summary.some(point => point.toLowerCase().includes(searchLower))
    );
  });
  
  const handleViewChat = (id: string) => {
    setViewingChatId(id);
  };
  
  const handleBackToList = () => {
    setViewingChatId(null);
  };
  
  const handleResumeChat = (id: string) => {
    const chat = savedChats.find(chat => chat.id === id);
    if (chat) {
      onResumeChat(chat);
      onClose();
    }
  };
  
  const renderContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Saved Chats</h2>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose}
          className="rounded-full hover:bg-[var(--ui-bg-hover)] dark:hover:bg-gray-800"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>
      
      {!viewingChat ? (
        <>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--chat-muted)]" />
              <Input 
                placeholder="Search saved chats..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-hidden">
            {savedChats.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-lg font-medium mb-1 text-[var(--chat-text)]">No saved chats yet</h3>
                <p className="text-[var(--chat-muted)] mb-4">Your conversations will appear here</p>
                <Button onClick={onClose} variant="outline">Start a conversation</Button>
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="text-center py-12 text-[var(--chat-muted)]">
                <p>No saved chats match your search</p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-210px)]">
                <div className="space-y-4 pr-4 pb-6">
                  {filteredChats.map((chat) => (
                    <SavedChatCard
                      key={chat.id}
                      chat={chat}
                      isActive={chat.id === currentChatId}
                      onView={handleViewChat}
                      onResume={handleResumeChat}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t dark:border-gray-800 text-center">
            <Link to="/profile" className="text-sm text-brand-green hover:underline">
              Manage all saved chats in My Profile
            </Link>
          </div>
        </>
      ) : (
        <SavedChatView 
          chat={viewingChat} 
          onBack={handleBackToList}
          onResume={handleResumeChat}
        />
      )}
    </div>
  );
  
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DrawerContent className="px-4 pt-4 pb-6 max-w-md mx-auto h-[85vh] rounded-t-lg">
          {renderContent()}
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent 
        side="right" 
        className="w-[28rem] max-w-full p-6 overflow-hidden flex flex-col"
        hideCloseButton={true}
      >
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
};

export default SavedChatsPanel;
