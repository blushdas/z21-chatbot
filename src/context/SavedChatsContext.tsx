import React, { createContext, useContext, useEffect, useState } from "react";
import { MessageType } from "@/components/ChatInterface";
import { toast } from "sonner";
import logger from "@/utils/logger";

export type SavedChat = {
  id: string;
  title: string;
  mode: string;
  tone?: string;
  timestamp: Date;
  messages: MessageType[];
  summary: string[];
  tags?: string[];
  isPlaceholder?: boolean;
  isDraft?: boolean;
};

type SavedChatsContextType = {
  savedChats: SavedChat[];
  displayableChats: SavedChat[];
  currentChatId: string | null;
  addChat: (chat: Omit<SavedChat, "id" | "summary">) => string;
  updateChat: (id: string, updates: Partial<SavedChat>) => void;
  autoSaveChat: (chat: Partial<SavedChat> & { id: string }) => void;
  getChat: (id: string) => SavedChat | undefined;
  resumeChat: (id: string) => void;
  generateSummary: (messages: MessageType[]) => string[];
  shouldSaveChat: (chat: Partial<SavedChat>) => boolean;
  shouldDisplayChat: (chat: SavedChat) => boolean;
  isPlaceholderChat: (chat: SavedChat) => boolean;
  cleanupPlaceholderChats: () => void;
  removeDuplicateChats: () => void;
};

const SavedChatsContext = createContext<SavedChatsContextType | undefined>(undefined);

// Maximum number of saved chats to keep
const MAX_SAVED_CHATS = 50;

// Generate clean title from user prompt - completely exclude mode information
const generateTitleFromPrompt = (userPrompt: string): string => {
  if (!userPrompt || userPrompt.trim() === '') {
    return "New Conversation";
  }
  
  let cleanPrompt = userPrompt.trim();
  
  // Remove any mode prefixes (more comprehensive list)
  const modePrefixes = [
    'Coaching:', 'Coach:', 'Coaching Mode:', 
    'Family:', 'Family Mode:',
    'Coach Alpha:', 'Coach Mode [ALPHA]:', 
    'Ambassador:', 'Ambassador Mode:',
    'Faith:', 'Faith Mode:',
    'Leadership:', 'Leadership Mode:'
  ];
  
  // Remove mode prefixes (case insensitive)
  for (const prefix of modePrefixes) {
    const regex = new RegExp(`^${prefix.replace(':', '\\s*:')}\\s*`, 'i');
    if (regex.test(cleanPrompt)) {
      cleanPrompt = cleanPrompt.replace(regex, '').trim();
      break;
    }
  }
  
  // Remove any emoji prefixes and mode indicators
  cleanPrompt = cleanPrompt
    // Remove emojis from the beginning
    .replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})+\s*/gu, '')
    // Remove [Mode] style brackets
    .replace(/^\[[\w\s]+\]\s*/i, '')
    // Remove any remaining mode indicators
    .replace(/^(coaching|family|coachalpha|ambassador|faith|leadership)\s*[-:]\s*/i, '')
    .trim();
  
  // If we removed everything, try to extract the core question/topic
  if (!cleanPrompt) {
    // Look for question words or key topics in the original prompt
    const questionMatch = userPrompt.match(/\b(how|what|why|when|where|can|should|would|could|is|are|will)\s+.+/i);
    if (questionMatch) {
      cleanPrompt = questionMatch[0];
    } else {
      return "New Conversation";
    }
  }
  
  // Clean up and truncate if needed
  cleanPrompt = cleanPrompt
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  
  // Truncate if too long and add ellipsis
  if (cleanPrompt.length > 60) {
    // Try to truncate at a word boundary
    const truncated = cleanPrompt.substring(0, 57);
    const lastSpace = truncated.lastIndexOf(' ');
    cleanPrompt = (lastSpace > 30 ? truncated.substring(0, lastSpace) : truncated) + "...";
  }
  
  return cleanPrompt || "New Conversation";
};

// Sample saved chats with realistic conversations for guest users
const SAMPLE_SAVED_CHATS: SavedChat[] = [
  {
    id: "chat-example-complete",
    title: "Managing Team Productivity and Accountability",
    mode: "coach",
    tone: "wise_direct",
    timestamp: new Date("2025-06-17T14:30:00Z"),
    summary: [
      "Complete example conversation about managing team productivity issues.",
      "Explored strategies for addressing missed deadlines constructively.",
      "Discussed progressive accountability measures and formal consequences.",
      "Covered documentation, PIPs, and when to make difficult decisions."
    ],
    messages: [
      { 
        id: "1", 
        sender: "user", 
        content: "I'm struggling with managing my team's productivity. Some members are consistently missing deadlines and I'm not sure how to address this without being too harsh.", 
        timestamp: new Date("2025-06-17T14:30:00Z"), 
        mode: "coach" 
      },
      { 
        id: "2", 
        sender: "daryle", 
        content: "Managing team productivity while maintaining positive relationships is a delicate balance that many leaders face. Let me share some strategies that can help you address this constructively.\n\n**Start with Understanding**: Before taking action, have one-on-one conversations with the team members who are missing deadlines. Ask open-ended questions like \"What challenges are you facing with these projects?\" or \"What support do you need to meet these timelines?\" Sometimes the root cause is unclear expectations, resource constraints, or personal challenges.\n\n**Set Clear Expectations**: Ensure that deadlines are realistic and clearly communicated. Consider implementing a project management system where everyone can see timelines, dependencies, and progress. This creates transparency and accountability without feeling punitive.\n\n**Implement Regular Check-ins**: Instead of waiting until deadlines are missed, schedule weekly progress reviews. This allows you to identify potential delays early and provide support or adjust timelines as needed.\n\n**Focus on Solutions, Not Blame**: When addressing missed deadlines, frame the conversation around problem-solving rather than fault-finding. Say something like \"I notice the deadline was missed. Let's figure out how we can prevent this in the future\" rather than \"You missed another deadline.\"\n\n**Provide Development Opportunities**: Consider if team members need additional training in time management, project planning, or specific technical skills. Investing in their development shows you care about their success.\n\nRemember, consistent accountability paired with genuine support typically yields better results than punitive measures alone.", 
        timestamp: new Date("2025-06-17T14:32:00Z"), 
        mode: "coach" 
      },
      { 
        id: "3", 
        sender: "user", 
        content: "That's helpful, but what if I've already tried having those conversations and the behavior hasn't changed? At what point do I need to consider more formal consequences?", 
        timestamp: new Date("2025-06-17T14:35:00Z"), 
        mode: "coach" 
      },
      { 
        id: "4", 
        sender: "daryle", 
        content: "You're right to escalate when informal approaches haven't worked. Here's a structured approach for progressive accountability:\n\n**Document Everything**: Start keeping detailed records of missed deadlines, the conversations you've had, and any support or resources you've provided. This documentation protects both you and the employee.\n\n**Set a Performance Improvement Plan (PIP)**: This formal step involves:\n• Clearly stating the performance issues\n• Setting specific, measurable goals with deadlines\n• Outlining the consequences if improvement doesn't occur\n• Providing a timeline (typically 30-90 days)\n• Scheduling regular check-ins during this period\n\n**Involve HR Early**: Before implementing a PIP, consult with your HR department to ensure you're following proper procedures and protecting the organization legally.\n\n**Consider the Impact on Others**: Chronic poor performance affects team morale. Other team members may become frustrated if they see no consequences for consistently missed deadlines.\n\n**Know When to Make the Difficult Decision**: If performance doesn't improve during the PIP period, you may need to consider termination. This isn't a failure on your part as a leader – sometimes people aren't in the right role or organization.\n\n**Communicate with the Team**: When you do take action, communicate appropriately with the rest of the team. You don't need to share details, but acknowledging that you take performance seriously helps maintain credibility.\n\nThe key is being fair but firm. Give people genuine opportunities to improve, but don't let poor performance drag down the entire team.", 
        timestamp: new Date("2025-06-17T14:38:00Z"), 
        mode: "coach" 
      }
    ],
    tags: ["Leadership", "Team Management", "Performance", "Example"],
    isDraft: false
  },
  {
    id: "chat-001",
    title: "Giving Hard Feedback with Grace",
    mode: "coach",
    tone: "wise_direct",
    timestamp: new Date("2025-05-29T10:15:00Z"),
    summary: [
      "Discussion about delivering difficult feedback while maintaining relationships.",
      "Explored approaches for handling defensive responses from team members.",
      "Emphasized truth wrapped in trust as a core leadership principle."
    ],
    messages: [
      { id: "1", sender: "user", content: "How do I give hard feedback to a direct report without discouraging them?", timestamp: new Date("2025-05-29T10:15:00Z"), mode: "coach" },
      { id: "2", sender: "daryle", content: "Start with truth wrapped in trust. Begin with what you observed, invite their perspective, and speak with clarity. A good leader never sacrifices relationship for truth or truth for comfort.", timestamp: new Date("2025-05-29T10:16:00Z"), mode: "coach" },
      { id: "3", sender: "user", content: "What if they're defensive?", timestamp: new Date("2025-05-29T10:17:00Z"), mode: "coach" },
      { id: "4", sender: "daryle", content: "That's natural. Try saying, 'I want to share something because I care about your growth, not because I'm frustrated.' Reframe the tension.", timestamp: new Date("2025-05-29T10:18:00Z"), mode: "coach" }
    ],
    tags: ["Feedback", "Leadership", "Communication"],
    isDraft: false
  },
  {
    id: "chat-002",
    title: "Why Daryle Believed in Generosity",
    mode: "coach",
    tone: "warm_reflective",
    timestamp: new Date("2025-05-28T18:42:00Z"),
    summary: [
      "Exploration of Daryle's spiritual approach to generosity and stewardship.",
      "Discussion of key Scripture passages that shaped his giving philosophy.",
      "Insight into viewing generosity as discipline rather than obligation."
    ],
    messages: [
      { id: "1", sender: "user", content: "Why did Daryle put so much emphasis on generosity?", timestamp: new Date("2025-05-28T18:42:00Z"), mode: "coach" },
      { id: "2", sender: "daryle", content: "For Daryle, generosity was a spiritual discipline — not a financial decision. He believed that you don't own what you won't give away. His generosity flowed from his belief that all things are God's, not ours.", timestamp: new Date("2025-05-28T18:43:00Z"), mode: "coach" },
      { id: "3", sender: "user", content: "Did he have a favorite Scripture around this?", timestamp: new Date("2025-05-28T18:44:00Z"), mode: "coach" },
      { id: "4", sender: "daryle", content: "'To whom much is given, much is required' (Luke 12:48) was often quoted. He also loved 2 Corinthians 9:6–7 — God loves a cheerful giver.", timestamp: new Date("2025-05-28T18:45:00Z"), mode: "coach" }
    ],
    tags: ["Family", "Faith", "Generosity"],
    isDraft: false
  },
  {
    id: "chat-003",
    title: "A Story About Daryle's First Business",
    mode: "coach",
    tone: "warm_reflective",
    timestamp: new Date("2025-05-27T09:50:00Z"),
    summary: [
      "Early business story about choosing values over profit.",
      "Example of principled leadership in challenging circumstances.",
      "Demonstration of how integrity creates long-term opportunities."
    ],
    messages: [
      { id: "1", sender: "user", content: "Do you have a story from Daryle's early business years?", timestamp: new Date("2025-05-27T09:50:00Z"), mode: "coach" },
      { id: "2", sender: "daryle", content: "Yes — when Daryle was just starting out, he once gave up a profitable client because they wanted him to compromise on his values. It was a defining moment that shaped how he led every company after.", timestamp: new Date("2025-05-27T09:51:00Z"), mode: "coach" },
      { id: "3", sender: "user", content: "What did he do instead?", timestamp: new Date("2025-05-27T09:52:00Z"), mode: "coach" },
      { id: "4", sender: "daryle", content: "He wrote a handwritten note thanking them for the opportunity, but respectfully declined. That client came back two years later — this time ready to work on Daryle's terms.", timestamp: new Date("2025-05-27T09:53:00Z"), mode: "coach" }
    ],
    tags: ["Family", "Legacy", "Values"],
    isDraft: false
  },
  {
    id: "chat-004",
    title: "Philanthropic Equity Explained Simply",
    mode: "coach",
    tone: "analytical_warm",
    timestamp: new Date("2025-05-25T14:23:00Z"),
    summary: [
      "Clear explanation of AE's philanthropic equity approach.",
      "Distinction between traditional CSR and integrated impact investing.",
      "Philosophy of profit as fuel rather than the end goal."
    ],
    messages: [
      { id: "1", sender: "user", content: "Can you explain AE's concept of philanthropic equity in plain language?", timestamp: new Date("2025-05-25T14:23:00Z"), mode: "coach" },
      { id: "2", sender: "daryle", content: "Philanthropic equity is our belief that financial returns and community impact are not competing outcomes — they're linked. We invest in people and places, not just in products and profit.", timestamp: new Date("2025-05-25T14:24:00Z"), mode: "coach" },
      { id: "3", sender: "user", content: "How is that different from CSR?", timestamp: new Date("2025-05-25T14:25:00Z"), mode: "coach" },
      { id: "4", sender: "daryle", content: "CSR is often what you do after you've made money. AE's approach is to bake purpose into the model from day one. Profit is fuel — not the finish line.", timestamp: new Date("2025-05-25T14:26:00Z"), mode: "coach" }
    ],
    tags: ["Investment", "Impact", "Strategy"],
    isDraft: false
  },
  {
    id: "chat-005",
    title: "What Does Ambassador Enterprises Actually Do?",
    mode: "coach",
    tone: "professional_warm",
    timestamp: new Date("2025-05-24T08:10:00Z"),
    summary: [
      "Overview of Ambassador Enterprises' unique business model.",
      "Explanation of culture-building alongside capital investment.",
      "Distinction from traditional venture capital approaches."
    ],
    messages: [
      { id: "1", sender: "user", content: "What exactly does Ambassador Enterprises do?", timestamp: new Date("2025-05-24T08:10:00Z"), mode: "coach" },
      { id: "2", sender: "daryle", content: "We're a legacy-minded private equity firm based in Fort Wayne, Indiana. We invest in companies and communities — and reinvest profits into leadership development, nonprofit work, and long-term vision.", timestamp: new Date("2025-05-24T08:11:00Z"), mode: "coach" },
      { id: "3", sender: "user", content: "So you're not just a VC firm?", timestamp: new Date("2025-05-24T08:12:00Z"), mode: "coach" },
      { id: "4", sender: "daryle", content: "Correct. AE is unique. We're builders of culture as much as capital.", timestamp: new Date("2025-05-24T08:13:00Z"), mode: "coach" }
    ],
    tags: ["Ambassador", "Business Model", "Culture"],
    isDraft: false
  },
  {
    id: "chat-006",
    title: "How to Lead When You're the Youngest Person in the Room",
    mode: "coach",
    tone: "wise_direct",
    timestamp: new Date("2025-05-23T17:30:00Z"),
    summary: [
      "Guidance for young leaders facing age-related challenges.",
      "Balance of humility and confidence in leadership roles.",
      "Practical advice for earning respect through preparation and value."
    ],
    messages: [
      { id: "1", sender: "user", content: "How do I lead effectively when I'm the youngest person on the team?", timestamp: new Date("2025-05-23T17:30:00Z"), mode: "coach" },
      { id: "2", sender: "daryle", content: "Lead with humility, but don't shrink back. Daryle would say: 'Age doesn't entitle you — but neither does it disqualify you.' Show up prepared. Listen well. Add value.", timestamp: new Date("2025-05-23T17:31:00Z"), mode: "coach" }
    ],
    tags: ["Leadership", "Age", "Confidence"],
    isDraft: false
  },
  {
    id: "chat-007",
    title: "Dealing with Disappointment as a Leader",
    mode: "coach",
    tone: "reflective_caring",
    timestamp: new Date("2025-05-21T11:50:00Z"),
    summary: [
      "Spiritual perspective on handling disappointment in leadership.",
      "Reframing setbacks as divine redirection opportunities.",
      "Importance of drawing closer to God during difficult times."
    ],
    messages: [
      { id: "1", sender: "user", content: "How do I handle disappointment spiritually?", timestamp: new Date("2025-05-21T11:50:00Z"), mode: "coach" },
      { id: "2", sender: "daryle", content: "Start by acknowledging that disappointment is often divine redirection. Daryle believed we learn more in failure than in ease. Let it draw you closer to God, not push you into isolation.", timestamp: new Date("2025-05-21T11:51:00Z"), mode: "coach" }
    ],
    tags: ["Faith", "Disappointment", "Growth"],
    isDraft: false
  },
  {
    id: "chat-008",
    title: "How AE Thinks About Long-Term Success",
    mode: "coach",
    tone: "analytical_warm",
    timestamp: new Date("2025-05-20T09:00:00Z"),
    summary: [
      "Definition of long-term success beyond financial metrics.",
      "Focus on transformation across generations.",
      "Measuring fruit and impact alongside traditional results."
    ],
    messages: [
      { id: "1", sender: "user", content: "How do you define long-term success at Ambassador?", timestamp: new Date("2025-05-20T09:00:00Z"), mode: "coach" },
      { id: "2", sender: "daryle", content: "Long-term success means transformation: in companies, communities, and people. It's not just EBITDA — it's impact across generations. We measure fruit, not just results.", timestamp: new Date("2025-05-20T09:01:00Z"), mode: "coach" }
    ],
    tags: ["Success", "Impact", "Legacy"],
    isDraft: false
  },
  {
    id: "chat-009",
    title: "Daryle's Advice to His Kids",
    mode: "coach",
    tone: "warm_reflective",
    timestamp: new Date("2025-05-18T07:20:00Z"),
    summary: [
      "Personal insights into Daryle's parenting philosophy.",
      "Emphasis on living a life worth imitating.",
      "Importance of faith demonstrated through daily habits."
    ],
    messages: [
      { id: "1", sender: "user", content: "What advice did Daryle give his kids growing up?", timestamp: new Date("2025-05-18T07:20:00Z"), mode: "coach" },
      { id: "2", sender: "daryle", content: "He often told them: 'Live a life worth imitating.' He emphasized integrity, work ethic, and generosity. Faith came first — not in speech, but in daily habits.", timestamp: new Date("2025-05-18T07:21:00Z"), mode: "coach" }
    ],
    tags: ["Family", "Parenting", "Values"],
    isDraft: false
  },
  {
    id: "chat-010",
    title: "Navigating a Company Reorg with Clarity",
    mode: "coach",
    tone: "wise_direct",
    timestamp: new Date("2025-05-17T16:45:00Z"),
    summary: [
      "Leadership guidance for managing organizational change.",
      "Importance of honest, early communication during transitions.",
      "Building trust through transparency and care for team members."
    ],
    messages: [
      { id: "1", sender: "user", content: "How should I lead my team through an upcoming reorg?", timestamp: new Date("2025-05-17T16:45:00Z"), mode: "coach" },
      { id: "2", sender: "daryle", content: "Be honest early. People don't need spin — they need clarity and care. Communicate the why. Share what you know and what you don't. Invite feedback. Steward their trust.", timestamp: new Date("2025-05-17T16:46:00Z"), mode: "coach" }
    ],
    tags: ["Change Management", "Communication", "Trust"],
    isDraft: false
  }
];

export const useSavedChats = () => {
  const context = useContext(SavedChatsContext);
  if (!context) {
    throw new Error("useSavedChats must be used within a SavedChatsProvider");
  }
  return context;
};

// Helper function to save chats to localStorage with error handling and throttling
let saveToStorageTimeout: NodeJS.Timeout | null = null;

const saveChatsToStorage = (chats: SavedChat[]) => {
  // Throttle saves to prevent excessive localStorage writes
  if (saveToStorageTimeout) {
    clearTimeout(saveToStorageTimeout);
  }
  
  saveToStorageTimeout = setTimeout(() => {
    try {
      // Filter out placeholder chats before saving
      const chatsToSave = chats.filter(chat => chat.messages.length > 0 || chat.isDraft);
      
      // Deduplicate before saving
      const uniqueChatsToStore: SavedChat[] = Array.from(
        new Map(chatsToSave.map(chat => [chat.id, {
          ...chat,
          messages: chat.messages.slice(0, 30)
        }])).values()
      );

      // Keep only the most recent chats if we exceed our maximum
      const limitedChats = uniqueChatsToStore.slice(0, MAX_SAVED_CHATS);
      
      localStorage.setItem("daryleBot_savedChats", JSON.stringify(limitedChats));
      logger.debug(`Saved ${limitedChats.length} chats to localStorage`);
    } catch (error) {
      logger.error("Error saving chats to localStorage:", error);
      
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        try {
          // Reduce number of chats by half
          const reducedChats = chats.slice(0, Math.max(10, Math.floor(chats.length / 2)));
          
          // Further reduce the message count per chat
          const compressedChats = reducedChats.map(chat => ({
            ...chat,
            messages: chat.messages.slice(0, 15)
          }));
          
          localStorage.setItem("daryleBot_savedChats", JSON.stringify(compressedChats));
          
          toast.warning("Chat storage limit reached. Some older conversations were removed.", {
            duration: 5000
          });
        } catch (fallbackError) {
          logger.error("Failed to save even with reduced chats:", fallbackError);
          toast.error("Unable to save chats. Local storage is full.", {
            duration: 5000
          });
        }
      }
    }
  }, 500); // Throttle saves to every 500ms
};

export const SavedChatsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [savedChats, setSavedChats] = useState<SavedChat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Check if a chat is a placeholder (empty or incomplete) - LESS RESTRICTIVE
  const isPlaceholderChat = (chat: SavedChat): boolean => {
    // Only consider it placeholder if it has NO messages at all AND is not a draft
    return chat.messages.length === 0 && !chat.isDraft;
  };

  // Remove duplicate chats based on title and similar content
  const removeDuplicateChats = () => {
    setSavedChats(prevChats => {
      const uniqueChats = new Map<string, SavedChat>();
      
      // Sort by timestamp descending to keep the most recent version of duplicates
      const sortedChats = [...prevChats].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      for (const chat of sortedChats) {
        // Create a key based on title and first user message for duplicate detection
        const firstUserMessage = chat.messages.find(m => m.sender === "user")?.content || "";
        const key = `${chat.title}-${firstUserMessage.substring(0, 100)}`;
        
        // Only keep the first occurrence (most recent due to sorting)
        if (!uniqueChats.has(key)) {
          uniqueChats.set(key, chat);
        }
      }
      
      const uniqueChatsArray = Array.from(uniqueChats.values());
      const removedCount = prevChats.length - uniqueChatsArray.length;
      
      if (removedCount > 0) {
        logger.debug(`Removed ${removedCount} duplicate chats`);
        toast.success(`Cleaned up ${removedCount} duplicate conversations`);
      }
      
      return uniqueChatsArray;
    });
  };

  // Clean up placeholder chats
  const cleanupPlaceholderChats = () => {
    setSavedChats(prevChats => {
      const cleanedChats = prevChats.filter(chat => !isPlaceholderChat(chat));
      const removedCount = prevChats.length - cleanedChats.length;
      
      if (removedCount > 0) {
        logger.debug(`Cleaned up ${removedCount} placeholder chats`);
      }
      
      return cleanedChats;
    });
  };

  // Check if a chat should be displayed in the sidebar (more permissive)
  const shouldDisplayChat = (chat: SavedChat): boolean => {
    // Show all chats including drafts
    return chat.messages.length > 0 || chat.isDraft || chat.id === currentChatId;
  };

  // FIXED: Simple sorting that preserves order unless there are actual updates
  const getSortedChats = (chats: SavedChat[]): SavedChat[] => {
    // Separate drafts and active chats
    const draftChats = chats.filter(chat => chat.isDraft);
    const activeChats = chats.filter(chat => !chat.isDraft);
    
    // Keep drafts in their original order (no sorting)
    // Keep active chats in their current order (no automatic resorting)
    return [...activeChats, ...draftChats];
  };

  // Filter chats to only show meaningful conversations in sidebar, with custom sorting
  const displayableChats = getSortedChats(savedChats.filter(shouldDisplayChat));

  // Check if a chat should be saved (very permissive)
  const shouldSaveChat = (chat: Partial<SavedChat>): boolean => {
    // Save any chat that has been created, even without messages
    return true;
  };

  // Load saved chats from localStorage on mount
  useEffect(() => {
    const loadSavedChats = () => {
      const storedChats = localStorage.getItem("daryleBot_savedChats");
      if (storedChats) {
        try {
          const parsedChats: SavedChat[] = JSON.parse(storedChats, (key, value) => {
            if (key === "timestamp") {
              return new Date(value);
            }
            return value;
          });
          
          // Clean titles of any existing mode prefixes and deduplicate
          const uniqueChats: SavedChat[] = Array.from(
            new Map(parsedChats.map((chat: SavedChat) => [chat.id, {
              ...chat,
              title: generateTitleFromPrompt(chat.title), // Clean existing titles
              isDraft: (chat.isDraft ?? false)
            }])).values()
          );
          
          // Filter out placeholder chats on load
          const cleanedChats = uniqueChats.filter(chat => !isPlaceholderChat(chat));
          
          setSavedChats(cleanedChats);
        } catch (error) {
          console.error("Error parsing saved chats:", error);
          setSavedChats(SAMPLE_SAVED_CHATS);
        }
      } else {
        setSavedChats(SAMPLE_SAVED_CHATS);
      }
      setInitialized(true);
    };

    loadSavedChats();
  }, []);

  // Save to localStorage whenever savedChats changes with error handling and throttling
  useEffect(() => {
    if (!initialized) return;

    if (savedChats.length > 0) {
      saveChatsToStorage(savedChats);
    }
  }, [savedChats, initialized]);

  // Auto-cleanup placeholder chats and duplicates periodically
  useEffect(() => {
    if (!initialized) return;
    
    // Clean up placeholders and duplicates on initial load
    const timer = setTimeout(() => {
      cleanupPlaceholderChats();
      removeDuplicateChats();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [initialized]);

  // Generate a simple summary based on the chat messages
  const generateSummary = (messages: MessageType[]): string[] => {
    const daryleMessages = messages.filter(msg => msg.sender === "daryle");
    
    if (daryleMessages.length === 0) {
      return ["No conversation content available"];
    }
    
    const topics = new Set<string>();
    const keywords = [
      "leadership", "family", "investment", "mission", "stewardship", 
      "values", "integrity", "purpose", "vision", "growth", "legacy"
    ];
    
    daryleMessages.forEach(msg => {
      keywords.forEach(keyword => {
        if (msg.content.toLowerCase().includes(keyword.toLowerCase())) {
          topics.add(keyword.charAt(0).toUpperCase() + keyword.slice(1));
        }
      });
    });
    
    const summary: string[] = [];
    
    summary.push(`Conversation with ${messages.length} messages, discussing ${
      topics.size > 0 
        ? Array.from(topics).slice(0, 3).join(", ")
        : "various topics"
    }.`);
    
    const mode = messages[0]?.mode;
    if (mode) {
      summary.push(`Chat conducted in ${mode} mode, focusing on related insights.`);
    }
    
    if (summary.length < 3 && daryleMessages.length > 0) {
      const sampleMessage = daryleMessages[Math.floor(daryleMessages.length / 2)];
      const shortenedContent = sampleMessage.content.length > 60 
        ? sampleMessage.content.substring(0, 60) + "..." 
        : sampleMessage.content;
      summary.push(`Key insight: "${shortenedContent}"`);
    }
    
    return summary;
  };

  // Updated auto-save that only updates timestamp for actual content changes
  const autoSaveChat = (chatUpdate: Partial<SavedChat> & { id: string }) => {
    setSavedChats(prevChats => {
      const existingChatIndex = prevChats.findIndex(chat => chat.id === chatUpdate.id);
      
      if (existingChatIndex >= 0) {
        // Update existing chat
        const updatedChats = [...prevChats];
        const existingChat = updatedChats[existingChatIndex];
        
        // Check if there are NEW messages (not just auto-save updates)
        const hasNewMessages = chatUpdate.messages && 
          chatUpdate.messages.length > existingChat.messages.length;
        
        // Check if this is the first user message (promote from draft)
        const shouldPromote = hasNewMessages && existingChat.isDraft && 
          chatUpdate.messages?.some(m => m.sender === "user");
        
        // Only update if there are actual changes
        const hasChanges = (
          hasNewMessages ||
          (chatUpdate.title && chatUpdate.title !== existingChat.title) ||
          (chatUpdate.mode && chatUpdate.mode !== existingChat.mode)
        );
        
        if (!hasChanges) {
          return prevChats; // No changes, don't update
        }
        
        const updatedChat = {
          ...existingChat,
          ...chatUpdate,
          // Only update timestamp if promoting or has new messages
          timestamp: (shouldPromote || hasNewMessages) ? new Date() : existingChat.timestamp,
          isDraft: shouldPromote ? false : existingChat.isDraft
        };
        
        // IMPORTANT: Don't change the position in the array unless promoting
        if (shouldPromote) {
          // Remove from current position and add to beginning for promoted chats
          updatedChats.splice(existingChatIndex, 1);
          updatedChats.unshift(updatedChat);
        } else {
          // Keep in same position for non-promoted updates
          updatedChats[existingChatIndex] = updatedChat;
        }
        
        logger.debug(`Auto-saved chat ${chatUpdate.id} - ${shouldPromote ? 'promoted to active' : hasNewMessages ? 'with new messages' : 'metadata only'}`);
        return updatedChats;
      } else {
        // Create new chat entry
        const firstUserMessage = chatUpdate.messages?.find(m => m.sender === "user")?.content || "";
        const potentialTitle = firstUserMessage ? generateTitleFromPrompt(firstUserMessage) : "Untitled Conversation";
        
        const newChat: SavedChat = {
          title: potentialTitle,
          mode: "coach",
          messages: [],
          summary: [],
          timestamp: new Date(),
          isDraft: true, // All new chats start as drafts
          isPlaceholder: false,
          ...chatUpdate,
        };
        
        logger.debug(`Creating new draft chat ${chatUpdate.id} with title: ${newChat.title}`);
        return [...prevChats, newChat].slice(0, MAX_SAVED_CHATS);
      }
    });
  };

  // Updated addChat function - IMMEDIATELY saves to localStorage
  const addChat = (chat: Omit<SavedChat, "id" | "summary">): string => {
    const id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const firstUserMessage = chat.messages.find(msg => msg.sender === "user");
    const cleanTitle = firstUserMessage ? generateTitleFromPrompt(firstUserMessage.content) : chat.title || "Untitled Conversation";
    
    const summary = generateSummary(chat.messages);
    
    const newChat: SavedChat = {
      ...chat,
      id,
      title: cleanTitle,
      summary,
      isPlaceholder: false,
      isDraft: (chat.messages.length === 0 || (chat.isDraft ?? true)) // Default to draft for new chats
    };
    
    setSavedChats(prevChats => {
      const uniquePrevChats: SavedChat[] = Array.from(
        new Map(prevChats.map(chat => [chat.id, chat])).values()
      );
      
      // Append to end instead of forcing to top
      const updatedChats = [...uniquePrevChats, newChat];
      logger.debug(`Added new ${newChat.isDraft ? 'draft' : 'active'} chat: ${newChat.title} (${newChat.id}) - saving immediately`);
      
      // Immediately save to localStorage
      saveChatsToStorage(updatedChats);
      
      return updatedChats.slice(0, MAX_SAVED_CHATS);
    });
    
    return id;
  };

  // Update existing chat - ONLY updates timestamp for real content changes
  const updateChat = (id: string, updates: Partial<SavedChat>) => {
    setSavedChats(prevChats => {
      return prevChats.map(chat => {
        if (chat.id === id) {
          // Check if there are actual content changes that should promote the chat
          const hasNewMessages = updates.messages && updates.messages.length > chat.messages.length;
          const shouldPromote = hasNewMessages && chat.isDraft && 
            updates.messages?.some(m => m.sender === "user");
          
          const hasContentChanges = (
            hasNewMessages ||
            (updates.title && updates.title !== chat.title) ||
            (updates.mode && updates.mode !== chat.mode)
          );
          
          return { 
            ...chat, 
            ...updates,
            // Clean title if it's being updated
            title: updates.title ? generateTitleFromPrompt(updates.title) : chat.title,
            // Only update timestamp if promoting or there are actual content changes
            timestamp: (shouldPromote || hasContentChanges) ? new Date() : chat.timestamp,
            // Promote to active if it gets user messages
            isDraft: shouldPromote ? false : ((updates.isDraft !== undefined) ? updates.isDraft : chat.isDraft)
          };
        }
        return chat;
      });
    });
  };

  // Get a specific chat by ID
  const getChat = (id: string): SavedChat | undefined => {
    return savedChats.find(chat => chat.id === id);
  };

  // Resume a previous chat - NEVER update timestamp, just set as current
  const resumeChat = (id: string) => {
    setCurrentChatId(id);
    // DO NOT update the chat's timestamp or any other properties
  };

  return (
    <SavedChatsContext.Provider
      value={{
        savedChats,
        displayableChats,
        currentChatId,
        addChat,
        updateChat,
        autoSaveChat,
        getChat,
        resumeChat,
        generateSummary,
        shouldSaveChat,
        shouldDisplayChat,
        isPlaceholderChat,
        cleanupPlaceholderChats,
        removeDuplicateChats
      }}
    >
      {children}
    </SavedChatsContext.Provider>
  );
};
