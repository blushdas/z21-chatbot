export interface DateRange {
  start?: Date;
  end?: Date;
}

export interface LengthRange {
  min?: number;
  max?: number;
}

export interface ChatFilters {
  // Search
  searchTerm: string;
  
  // Date filters
  dateRange: DateRange;
  datePreset?: 'today' | 'yesterday' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear' | 'custom';
  
  // Mode filters
  modes: string[];
  
  // Length filters (based on message count or total characters)
  messageCountRange: LengthRange;
  characterCountRange: LengthRange;
  
  // Topic filters
  topics: string[];
  
  // Additional filters
  hasLongMessages?: boolean;
  isPinned?: boolean;
  isDraft?: boolean;
  hasFolder?: boolean;
  folderId?: string;
  
  // Sorting
  sortBy: 'relevance' | 'date' | 'title' | 'messageCount' | 'lastUpdated';
  sortOrder: 'asc' | 'desc';
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

export interface FilterStats {
  totalChats: number;
  filteredChats: number;
  availableTopics: FilterOption[];
  availableModes: FilterOption[];
  dateRanges: {
    earliest: Date;
    latest: Date;
  };
}

export const DEFAULT_FILTERS: ChatFilters = {
  searchTerm: '',
  dateRange: {},
  modes: [],
  messageCountRange: {},
  characterCountRange: {},
  topics: [],
  sortBy: 'lastUpdated',
  sortOrder: 'desc'
};

export const DATE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'thisWeek', label: 'This Week' },
  { value: 'thisMonth', label: 'This Month' },
  { value: 'lastMonth', label: 'Last Month' },
  { value: 'last3Months', label: 'Last 3 Months' },
  { value: 'last6Months', label: 'Last 6 Months' },
  { value: 'thisYear', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' }
];

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'date', label: 'Date Created' },
  { value: 'lastUpdated', label: 'Last Updated' },
  { value: 'title', label: 'Title' },
  { value: 'messageCount', label: 'Message Count' }
];