
import { SavedChat } from '@/context/SavedChatsContext';
import { MessageType } from '@/components/ChatInterface';

export interface ChatSearchMetadata {
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  userMessageCount: number;
  assistantMessageCount: number;
  keywords: string[];
  topics: string[];
  duration: string; // e.g., "2 hours", "1 day ago"
  hasLongMessages: boolean;
  averageMessageLength: number;
}

export interface ContentSnippet {
  content: string;
  messageIndex: number;
  sender: string;
  startIndex: number;
  endIndex: number;
}

export interface EnhancedChatSearchResult extends SavedChat {
  searchMetadata: ChatSearchMetadata;
  matchScore: number;
  matchReasons: string[];
  contentSnippets: ContentSnippet[];
  updatedAt: number;
  createdAt: number;
  pinned: boolean;
  folder_id?: string | null;
  isDraft: boolean;
}

// Extract content snippets around search terms
export const extractContentSnippets = (
  messages: MessageType[],
  searchTerm: string,
  maxSnippets: number = 2
): ContentSnippet[] => {
  const snippets: ContentSnippet[] = [];
  const searchLower = searchTerm.toLowerCase();
  const snippetLength = 120; // Total snippet length
  const contextBefore = 40; // Characters before match
  const contextAfter = 40; // Characters after match

  for (let i = 0; i < messages.length && snippets.length < maxSnippets; i++) {
    const message = messages[i];
    const contentLower = message.content.toLowerCase();
    const matchIndex = contentLower.indexOf(searchLower);

    if (matchIndex !== -1) {
      // Calculate snippet bounds
      const start = Math.max(0, matchIndex - contextBefore);
      const end = Math.min(message.content.length, start + snippetLength);
      
      // Adjust start if needed to fit snippet length
      const adjustedStart = Math.max(0, end - snippetLength);
      
      let snippetContent = message.content.slice(adjustedStart, end);
      
      // Add ellipsis if truncated
      if (adjustedStart > 0) {
        snippetContent = '...' + snippetContent;
      }
      if (end < message.content.length) {
        snippetContent = snippetContent + '...';
      }

      snippets.push({
        content: snippetContent,
        messageIndex: i,
        sender: message.sender,
        startIndex: adjustedStart,
        endIndex: end
      });
    }
  }

  return snippets;
};

// Extract keywords from message content
export const extractKeywords = (content: string): string[] => {
  const commonWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'how', 'what', 'when', 'where', 'why', 'who', 'which', 'this', 'that', 'these', 'those',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
  ]);

  return content
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !commonWords.has(word))
    .slice(0, 10); // Limit to top 10 keywords
};

// Extract topics based on common business/coaching themes
export const extractTopics = (messages: MessageType[]): string[] => {
  const topicKeywords = {
    'leadership': ['leader', 'leadership', 'manage', 'team', 'direct', 'supervise', 'guide'],
    'strategy': ['strategy', 'plan', 'goal', 'objective', 'strategy', 'vision', 'mission'],
    'communication': ['communicate', 'feedback', 'conversation', 'discussion', 'meeting', 'talk'],
    'relationships': ['relationship', 'family', 'marriage', 'friend', 'trust', 'connection'],
    'growth': ['growth', 'develop', 'improve', 'learn', 'skill', 'progress', 'advancement'],
    'finance': ['money', 'financial', 'investment', 'budget', 'profit', 'revenue', 'cost'],
    'decision-making': ['decision', 'choose', 'option', 'alternative', 'evaluate', 'analyze'],
    'conflict': ['conflict', 'problem', 'issue', 'challenge', 'difficulty', 'disagreement'],
    'spirituality': ['faith', 'spiritual', 'prayer', 'god', 'belief', 'values', 'purpose'],
    'career': ['career', 'job', 'work', 'profession', 'business', 'opportunity', 'promotion']
  };

  const allContent = messages.map(m => m.content).join(' ').toLowerCase();
  const topics: string[] = [];

  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => allContent.includes(keyword))) {
      topics.push(topic);
    }
  }

  return topics;
};

// Generate search metadata for a chat
export const generateChatSearchMetadata = (chat: SavedChat): ChatSearchMetadata => {
  const now = new Date();
  const createdAt = new Date(chat.timestamp);
  const updatedAt = new Date(chat.timestamp);
  
  const userMessages = chat.messages.filter(m => m.sender === 'user');
  const assistantMessages = chat.messages.filter(m => m.sender === 'daryle');
  
  const allContent = chat.messages.map(m => m.content).join(' ');
  const keywords = extractKeywords(allContent);
  const topics = extractTopics(chat.messages);
  
  const totalLength = chat.messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const averageMessageLength = chat.messages.length > 0 ? totalLength / chat.messages.length : 0;
  
  // Calculate duration string
  const diffMs = now.getTime() - createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  let duration: string;
  if (diffDays > 0) {
    duration = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffHours > 0) {
    duration = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffMinutes > 0) {
    duration = `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  } else {
    duration = 'Just now';
  }

  return {
    createdAt,
    updatedAt,
    messageCount: chat.messages.length,
    userMessageCount: userMessages.length,
    assistantMessageCount: assistantMessages.length,
    keywords,
    topics,
    duration,
    hasLongMessages: chat.messages.some(m => m.content.length > 500),
    averageMessageLength
  };
};

// Enhanced search function with scoring
export const searchChats = (
  chats: SavedChat[],
  searchTerm: string,
  options: {
    includeContent?: boolean;
    includeKeywords?: boolean;
    includeTopics?: boolean;
    includeMetadata?: boolean;
    minScore?: number;
  } = {}
): EnhancedChatSearchResult[] => {
  const {
    includeContent = true,
    includeKeywords = true,
    includeTopics = true,
    includeMetadata = true,
    minScore = 0
  } = options;

  if (!searchTerm.trim()) {
    return chats.map(chat => ({
      ...chat,
      searchMetadata: generateChatSearchMetadata(chat),
      matchScore: 0,
      matchReasons: [],
      contentSnippets: [],
      updatedAt: typeof chat.timestamp === 'number' ? chat.timestamp : new Date(chat.timestamp).getTime(),
      createdAt: typeof chat.timestamp === 'number' ? chat.timestamp : new Date(chat.timestamp).getTime(),
      pinned: (chat as any).pinned || false,
      folder_id: (chat as any).folder_id || null,
      isDraft: chat.isDraft || false
    }));
  }

  const searchLower = searchTerm.toLowerCase();
  const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);

  return chats
    .map(chat => {
      const metadata = generateChatSearchMetadata(chat);
      let score = 0;
      const matchReasons: string[] = [];

      // Title matching with partial support
      const titleLower = chat.title.toLowerCase();
      
      // Exact match
      if (titleLower.includes(searchLower)) {
        score += 20;
        matchReasons.push('Title match');
      }
      
      // Partial word matching (e.g., "dari" matches "Daryle")
      const titleWords = titleLower.split(/\s+/);
      searchWords.forEach(searchWord => {
        titleWords.forEach(titleWord => {
          if (titleWord.startsWith(searchWord) && searchWord.length >= 3) {
            score += 15;
            matchReasons.push('Partial title match');
          } else if (titleWord.includes(searchWord) && searchWord.length >= 2) {
            score += 10;
            matchReasons.push('Substring title match');
          }
        });
      });

      // Mode match
      if (chat.mode.toLowerCase().includes(searchLower)) {
        score += 5;
        matchReasons.push('Mode match');
      }

      // Content search
      if (includeContent) {
        const contentMatches = chat.messages.filter(m => 
          m.content.toLowerCase().includes(searchLower)
        ).length;
        if (contentMatches > 0) {
          score += contentMatches * 2;
          matchReasons.push(`${contentMatches} content match${contentMatches > 1 ? 'es' : ''}`);
        }
      }

      // Keywords search
      if (includeKeywords) {
        const keywordMatches = metadata.keywords.filter(keyword => 
          searchWords.some(word => keyword.includes(word))
        ).length;
        if (keywordMatches > 0) {
          score += keywordMatches;
          matchReasons.push(`${keywordMatches} keyword match${keywordMatches > 1 ? 'es' : ''}`);
        }
      }

      // Topics search
      if (includeTopics) {
        const topicMatches = metadata.topics.filter(topic => 
          searchWords.some(word => topic.includes(word))
        ).length;
        if (topicMatches > 0) {
          score += topicMatches * 3;
          matchReasons.push(`${topicMatches} topic match${topicMatches > 1 ? 'es' : ''}`);
        }
      }

      // Metadata search (date, duration, etc.)
      if (includeMetadata) {
        if (metadata.duration.toLowerCase().includes(searchLower)) {
          score += 1;
          matchReasons.push('Time period match');
        }
      }

      // Extract content snippets for matches
      const contentSnippets = score > 0 ? extractContentSnippets(chat.messages, searchTerm) : [];

      return {
        ...chat,
        searchMetadata: metadata,
        matchScore: score,
        matchReasons,
        contentSnippets,
        updatedAt: typeof chat.timestamp === 'number' ? chat.timestamp : new Date(chat.timestamp).getTime(),
        createdAt: typeof chat.timestamp === 'number' ? chat.timestamp : new Date(chat.timestamp).getTime(),
        pinned: (chat as any).pinned || false,
        folder_id: (chat as any).folder_id || null,
        isDraft: chat.isDraft || false
      };
    })
    .filter(result => result.matchScore >= minScore)
    .sort((a, b) => b.matchScore - a.matchScore);
};

// Format search metadata for display
export const formatSearchMetadata = (metadata: ChatSearchMetadata): string => {
  const parts: string[] = [];
  
  parts.push(`${metadata.messageCount} messages`);
  parts.push(metadata.duration);
  
  if (metadata.topics.length > 0) {
    parts.push(`Topics: ${metadata.topics.slice(0, 3).join(', ')}`);
  }
  
  if (metadata.keywords.length > 0) {
    parts.push(`Keywords: ${metadata.keywords.slice(0, 3).join(', ')}`);
  }

  return parts.join(' • ');
};
