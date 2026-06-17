import React, { useState } from 'react';
import { Search, Filter, X, Calendar, Hash, MessageSquare, Tag, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChatFilters, DATE_PRESETS, SORT_OPTIONS, FilterStats } from '@/types/chatFilters';
import { format } from 'date-fns';

interface AdvancedChatFiltersProps {
  filters: ChatFilters;
  filterStats: FilterStats;
  onUpdateFilters: (filters: Partial<ChatFilters>) => void;
  onUpdateSearchTerm: (term: string) => void;
  onApplyDatePreset: (preset: string) => void;
  onToggleMode: (mode: string) => void;
  onToggleTopic: (topic: string) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const AdvancedChatFilters: React.FC<AdvancedChatFiltersProps> = ({
  filters,
  filterStats,
  onUpdateFilters,
  onUpdateSearchTerm,
  onApplyDatePreset,
  onToggleMode,
  onToggleTopic,
  onClearFilters,
  hasActiveFilters
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateRangeSelect = (range: { from?: Date; to?: Date }) => {
    onUpdateFilters({
      dateRange: {
        start: range.from,
        end: range.to
      },
      datePreset: undefined
    });
  };

  return (
    <div className="border-b border-muted bg-background p-4 space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search chats, topics, or content..."
            value={filters.searchTerm}
            onChange={(e) => onUpdateSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Button
          variant={isExpanded ? "default" : "outline"}
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {[
                filters.modes.length,
                filters.topics.length,
                filters.dateRange.start || filters.dateRange.end ? 1 : 0,
                filters.messageCountRange.min !== undefined || filters.messageCountRange.max !== undefined ? 1 : 0
              ].filter(Boolean).length}
            </Badge>
          )}
          {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {filterStats.filteredChats} of {filterStats.totalChats} chats
        </span>
        
        <div className="flex items-center gap-2">
          <span>Sort by:</span>
          <Select
            value={filters.sortBy}
            onValueChange={(value) => onUpdateFilters({ sortBy: value as any })}
          >
            <SelectTrigger className="w-auto border-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onUpdateFilters({ 
              sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
            })}
            className="p-1"
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Date Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Range
              </label>
              
              <div className="space-y-2">
                <Select
                  value={filters.datePreset || ''}
                  onValueChange={onApplyDatePreset}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATE_PRESETS.map(preset => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {filters.datePreset === 'custom' && (
                  <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        {filters.dateRange.start ? (
                          filters.dateRange.end ? (
                            `${format(filters.dateRange.start, 'MMM dd')} - ${format(filters.dateRange.end, 'MMM dd')}`
                          ) : (
                            format(filters.dateRange.start, 'MMM dd, yyyy')
                          )
                        ) : (
                          "Pick date range"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="range"
                        selected={{
                          from: filters.dateRange.start,
                          to: filters.dateRange.end
                        }}
                        onSelect={handleDateRangeSelect}
                        numberOfMonths={2}
                      />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Mode Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Modes ({filters.modes.length} selected)
              </label>
              
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {filterStats.availableModes.map(mode => (
                  <div key={mode.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mode-${mode.value}`}
                      checked={filters.modes.includes(mode.value)}
                      onCheckedChange={() => onToggleMode(mode.value)}
                    />
                    <label
                      htmlFor={`mode-${mode.value}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {mode.label} ({mode.count})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Topics Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Topics ({filters.topics.length} selected)
              </label>
              
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {filterStats.availableTopics.slice(0, 10).map(topic => (
                  <div key={topic.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`topic-${topic.value}`}
                      checked={filters.topics.includes(topic.value)}
                      onCheckedChange={() => onToggleTopic(topic.value)}
                    />
                    <label
                      htmlFor={`topic-${topic.value}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {topic.label} ({topic.count})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Count Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Message Count
              </label>
              
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.messageCountRange.min || ''}
                  onChange={(e) => onUpdateFilters({
                    messageCountRange: {
                      ...filters.messageCountRange,
                      min: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.messageCountRange.max || ''}
                  onChange={(e) => onUpdateFilters({
                    messageCountRange: {
                      ...filters.messageCountRange,
                      max: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Character Count Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Content Length
              </label>
              
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Min chars"
                  value={filters.characterCountRange.min || ''}
                  onChange={(e) => onUpdateFilters({
                    characterCountRange: {
                      ...filters.characterCountRange,
                      min: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Max chars"
                  value={filters.characterCountRange.max || ''}
                  onChange={(e) => onUpdateFilters({
                    characterCountRange: {
                      ...filters.characterCountRange,
                      max: e.target.value ? Number(e.target.value) : undefined
                    }
                  })}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Additional Filters */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Filters</label>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pinned"
                    checked={filters.isPinned === true}
                    onCheckedChange={(checked) => 
                      onUpdateFilters({ isPinned: checked ? true : undefined })
                    }
                  />
                  <label htmlFor="pinned" className="text-sm cursor-pointer">
                    Pinned chats only
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="drafts"
                    checked={filters.isDraft === true}
                    onCheckedChange={(checked) => 
                      onUpdateFilters({ isDraft: checked ? true : undefined })
                    }
                  />
                  <label htmlFor="drafts" className="text-sm cursor-pointer">
                    Draft chats only
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="long-messages"
                    checked={filters.hasLongMessages === true}
                    onCheckedChange={(checked) => 
                      onUpdateFilters({ hasLongMessages: checked ? true : undefined })
                    }
                  />
                  <label htmlFor="long-messages" className="text-sm cursor-pointer">
                    Has long messages
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-folders"
                    checked={filters.hasFolder === true}
                    onCheckedChange={(checked) => 
                      onUpdateFilters({ hasFolder: checked ? true : undefined })
                    }
                  />
                  <label htmlFor="in-folders" className="text-sm cursor-pointer">
                    In folders
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 pt-2">
              {filters.modes.map(mode => (
                <Badge key={`mode-${mode}`} variant="secondary" className="flex items-center gap-1">
                  Mode: {mode}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onToggleMode(mode)}
                  />
                </Badge>
              ))}
              
              {filters.topics.map(topic => (
                <Badge key={`topic-${topic}`} variant="secondary" className="flex items-center gap-1">
                  {topic}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onToggleTopic(topic)}
                  />
                </Badge>
              ))}
              
              {(filters.dateRange.start || filters.dateRange.end) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Date: {filters.dateRange.start && format(filters.dateRange.start, 'MMM dd')}
                  {filters.dateRange.start && filters.dateRange.end && ' - '}
                  {filters.dateRange.end && format(filters.dateRange.end, 'MMM dd')}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => onUpdateFilters({ dateRange: {}, datePreset: undefined })}
                  />
                </Badge>
              )}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AdvancedChatFilters;