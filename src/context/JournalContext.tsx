import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatMode } from '@/components/ChatInterface';

export interface JournalEntry {
  id: string;
  botResponse: string;
  originalPrompt: string;
  mode: ChatMode;
  tags: string[];
  userNote: string;
  timestamp: Date;
  messageId?: string; // Reference to the original message
}

interface JournalContextType {
  journalEntries: JournalEntry[];
  addEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  updateEntry: (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'timestamp'>>) => void;
  deleteEntry: (id: string) => void;
  getEntryById: (id: string) => JournalEntry | undefined;
  filterEntriesByTag: (tag: string) => JournalEntry[];
  filterEntriesByMode: (mode: ChatMode | null) => JournalEntry[];
  filterEntriesByDate: (startDate: Date, endDate: Date) => JournalEntry[];
}

const JournalContext = createContext<JournalContextType | undefined>(undefined);

export const useJournal = () => {
  const context = useContext(JournalContext);
  if (!context) {
    return { entries: [], loading: false, addEntry: async ()=>{}, deleteEntry: async ()=>{} };
  }
  return context;
};

// Sample journal entries for testing
const sampleJournalEntries: JournalEntry[] = [
  {
    id: 'journal-1',
    botResponse: "Leadership is about making others better as a result of your presence. Think about how you can serve those around you.",
    originalPrompt: "What makes a good leader?",
    mode: "coach",
    tags: ["Leadership", "Growth"],
    userNote: "I need to focus more on empowering my team rather than micromanaging them.",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
  },
  {
    id: 'journal-2',
    botResponse: "Family should always be your highest priority. The legacy you leave is not just financial, but relational.",
    originalPrompt: "How do I balance work and family?",
    mode: "coach",
    tags: ["Balance", "Relationships"],
    userNote: "Schedule dedicated family time each week with no distractions.",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
  {
    id: 'journal-3',
    botResponse: "The best investments align profit with purpose. Look for opportunities where both can flourish.",
    originalPrompt: "What investment strategy should I follow?",
    mode: "coach",
    tags: ["Strategy", "Values"],
    userNote: "Research companies with strong ESG profiles that still deliver solid returns.",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
  }
];

interface JournalProviderProps {
  children: ReactNode;
}

export const JournalProvider: React.FC<JournalProviderProps> = ({ children }) => {
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Initialize with sample data or load from localStorage
  useEffect(() => {
    const savedEntries = localStorage.getItem('daryleBotJournalEntries');
    if (savedEntries) {
      try {
        // Parse stored entries and convert timestamp strings back to Date objects
        const parsedEntries = JSON.parse(savedEntries).map((entry: any) => ({
          ...entry,
          timestamp: new Date(entry.timestamp)
        }));
        setJournalEntries(parsedEntries);
      } catch (error) {
        console.error('Failed to parse saved journal entries', error);
        setJournalEntries(sampleJournalEntries);
      }
    } else {
      setJournalEntries(sampleJournalEntries);
    }
  }, []);

  // Save to localStorage whenever entries change
  useEffect(() => {
    localStorage.setItem('daryleBotJournalEntries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  // Add a new journal entry
  const addEntry = (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `journal-${Date.now()}`,
      timestamp: new Date(),
    };

    setJournalEntries((prev) => [newEntry, ...prev]);
  };

  // Update an existing journal entry
  const updateEntry = (id: string, updates: Partial<Omit<JournalEntry, 'id' | 'timestamp'>>) => {
    setJournalEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, ...updates } : entry
      )
    );
  };

  // Delete a journal entry
  const deleteEntry = (id: string) => {
    setJournalEntries((prev) => prev.filter((entry) => entry.id !== id));
  };

  // Get an entry by its ID
  const getEntryById = (id: string) => {
    return journalEntries.find((entry) => entry.id === id);
  };

  // Filter entries by tag
  const filterEntriesByTag = (tag: string) => {
    return journalEntries.filter((entry) => entry.tags.includes(tag));
  };

  // Filter entries by mode
  const filterEntriesByMode = (mode: ChatMode | null) => {
    if (!mode) return journalEntries;
    return journalEntries.filter((entry) => entry.mode === mode);
  };

  // Filter entries by date range
  const filterEntriesByDate = (startDate: Date, endDate: Date) => {
    return journalEntries.filter(
      (entry) => entry.timestamp >= startDate && entry.timestamp <= endDate
    );
  };

  const value = {
    journalEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    getEntryById,
    filterEntriesByTag,
    filterEntriesByMode,
    filterEntriesByDate,
  };

  return (
    <JournalContext.Provider value={value}>
      {children}
    </JournalContext.Provider>
  );
};
