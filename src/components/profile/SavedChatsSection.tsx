
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatManagement } from '@/hooks/useChatManagement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import SavedChatCard from '@/components/saved-chats/SavedChatCard';
import SavedChatView from '@/components/saved-chats/SavedChatView';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, MessageSquare, Tag } from 'lucide-react';
import { searchChats, formatSearchMetadata, EnhancedChatSearchResult } from '@/utils/chatSearch';
import { SavedChat } from '@/context/SavedChatsContext';

const SavedChatsSection: React.FC = () => {
  const navigate = useNavigate();
  const { savedChats, currentChatId, resumeChat } = useChatManagement();
  const [viewingChatId, setViewingChatId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showSearchDetails, setShowSearchDetails] = useState<boolean>(false);
  
  // Convert Chat[] to SavedChat[] for search compatibility
  const convertedSavedChats: SavedChat[] = useMemo(() => {
    return savedChats.map(chat => ({
      id: chat.id,
      title: chat.title,
      mode: chat.mode,
      timestamp: new Date(chat.updatedAt || chat.createdAt || Date.now()),
      messages: chat.messages,
      summary: [], // Chat type doesn't have summary, so use empty array
      tags: [], // Chat type doesn't have tags, so use empty array
      isDraft: false,
      isPlaceholder: false
    }));
  }, [savedChats]);
  
  const viewingChat = viewingChatId 
    ? savedChats.find(chat => chat.id === viewingChatId) 
    : null;

  // Enhanced search with metadata
  const searchResults = useMemo(() => {
    return searchChats(convertedSavedChats, searchTerm, {
      includeContent: true,
      includeKeywords: true,
      includeTopics: true,
      includeMetadata: true,
      minScore: 0
    });
  }, [convertedSavedChats, searchTerm]);

  // Apply sorting to search results
  const sortedResults = useMemo(() => {
    const results = [...searchResults];
    
    switch (sortBy) {
      case "newest":
        return results.sort((a, b) => 
          searchTerm ? b.matchScore - a.matchScore : 
          b.updatedAt - a.updatedAt
        );
      case "oldest":
        return results.sort((a, b) => a.updatedAt - b.updatedAt);
      case "most-messages":
        return results.sort((a, b) => 
          b.searchMetadata.messageCount - a.searchMetadata.messageCount
        );
      case "relevance":
        return results.sort((a, b) => b.matchScore - a.matchScore);
      default:
        return results;
    }
  }, [searchResults, sortBy, searchTerm]);

  const handleViewInChat = (id: string) => {
    // Navigate directly to main chat interface like admin side
    navigate(`/?chat=${id}`);
  };
  
  const handleBackToList = () => {
    setViewingChatId(null);
  };
  
  const handleResumeChat = (id: string) => {
    resumeChat(id);
    navigate("/");
  };

  const renderSearchResult = (result: EnhancedChatSearchResult) => (
    <div key={result.id} className="space-y-2">
      <SavedChatCard
        chat={{
          id: result.id,
          title: result.title,
          mode: result.mode,
          timestamp: new Date(result.updatedAt),
          messages: result.messages,
          summary: result.summary || [],
          tags: result.tags || [],
          isDraft: result.isDraft || false,
          isPlaceholder: false
        }}
        isActive={result.id === currentChatId}
        onView={handleViewInChat}
        onResume={handleResumeChat}
      />
      
      {/* Search metadata */}
      {searchTerm && (showSearchDetails || result.matchScore > 0) && (
        <div className="ml-4 space-y-1">
          {result.matchScore > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-medium">Match Score: {result.matchScore}</span>
              {result.matchReasons.length > 0 && (
                <span>({result.matchReasons.join(', ')})</span>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            <span>{result.searchMetadata.duration}</span>
            <MessageSquare className="w-3 h-3 ml-2" />
            <span>{result.searchMetadata.messageCount} messages</span>
          </div>
          
          {result.searchMetadata.topics.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              <Tag className="w-3 h-3 text-gray-400" />
              {result.searchMetadata.topics.slice(0, 3).map(topic => (
                <Badge key={topic} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          )}
          
          {result.searchMetadata.keywords.length > 0 && (
            <div className="text-xs text-gray-400">
              Keywords: {result.searchMetadata.keywords.slice(0, 5).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
  
  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-brand-green">Saved Conversations</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 flex-1 flex flex-col">
        {!viewingChat ? (
          <>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search conversations, topics, keywords..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="most-messages">Most Messages</SelectItem>
                  {searchTerm && <SelectItem value="relevance">Most Relevant</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Search summary */}
            {searchTerm && (
              <div className="flex items-center justify-between mb-3 p-2 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-700">
                  Found {sortedResults.length} conversation{sortedResults.length !== 1 ? 's' : ''} 
                  {sortedResults.filter(r => r.matchScore > 0).length > 0 && (
                    <span> ({sortedResults.filter(r => r.matchScore > 0).length} with matches)</span>
                  )}
                </div>
                <button
                  onClick={() => setShowSearchDetails(!showSearchDetails)}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showSearchDetails ? 'Hide' : 'Show'} details
                </button>
              </div>
            )}
            
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-[330px] pr-4">
                {sortedResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {searchTerm ? (
                      <div>
                        <p>No conversations match your search</p>
                        <p className="text-sm mt-2">Try different keywords or topics</p>
                      </div>
                    ) : (
                      <>
                        <p>No saved chats yet</p>
                        <p className="text-sm mt-2">Your conversations will appear here</p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedResults.map(renderSearchResult)}
                  </div>
                )}
              </ScrollArea>
            </div>
          </>
        ) : (
          <SavedChatView 
            chat={{
              id: viewingChat.id,
              title: viewingChat.title,
              mode: viewingChat.mode,
              timestamp: new Date(viewingChat.updatedAt || viewingChat.createdAt || Date.now()),
              messages: viewingChat.messages,
              summary: [], // Chat type doesn't have summary
              tags: [], // Chat type doesn't have tags
              isDraft: false,
              isPlaceholder: false
            }}
            onBack={handleBackToList}
            onResume={handleResumeChat}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default SavedChatsSection;
