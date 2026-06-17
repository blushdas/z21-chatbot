import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';

interface ConstructsFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  stateFilter: string;
  onStateFilterChange: (state: string) => void;
  tagFilters: string[];
  onTagFiltersChange: (tags: string[]) => void;
  availableTags: string[];
  sortBy: string;
  onSortChange: (sort: string) => void;
  totalCount: number;
  filteredCount: number;
}

const ConstructsFilterBar: React.FC<ConstructsFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  stateFilter,
  onStateFilterChange,
  tagFilters,
  onTagFiltersChange,
  availableTags,
  sortBy,
  onSortChange,
  totalCount,
  filteredCount,
}) => {
  const stateOptions = [
    { value: 'all', label: 'All States' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' },
  ];

  const sortOptions = [
    { value: 'updated-desc', label: 'Recently Updated' },
    { value: 'updated-asc', label: 'Oldest Updated' },
    { value: 'created-desc', label: 'Recently Created' },
    { value: 'created-asc', label: 'Oldest Created' },
    { value: 'title-asc', label: 'Title A-Z' },
    { value: 'title-desc', label: 'Title Z-A' },
  ];

  const handleTagToggle = (tag: string) => {
    const newTags = tagFilters.includes(tag)
      ? tagFilters.filter(t => t !== tag)
      : [...tagFilters, tag];
    onTagFiltersChange(newTags);
  };

  const clearAllFilters = () => {
    onSearchChange('');
    onStateFilterChange('all');
    onTagFiltersChange([]);
  };

  const hasActiveFilters = searchQuery || stateFilter !== 'all' || tagFilters.length > 0;

  return (
    <div className="space-y-4">
      {/* Search and main controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search constructs..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* State Filter */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                {stateOptions.find(s => s.value === stateFilter)?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Filter by State</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {stateOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onStateFilterChange(option.value)}
                  className={stateFilter === option.value ? 'bg-accent' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Tags Filter */}
          {availableTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  Tags
                  {tagFilters.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                      {tagFilters.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={tagFilters.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sortOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => onSortChange(option.value)}
                  className={sortBy === option.value ? 'bg-accent' : ''}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters & Results */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Active filters display */}
          {searchQuery && (
            <Badge variant="secondary" className="gap-1">
              Search: "{searchQuery}"
              <button
                onClick={() => onSearchChange('')}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}
          
          {stateFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              State: {stateOptions.find(s => s.value === stateFilter)?.label}
              <button
                onClick={() => onStateFilterChange('all')}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          )}

          {tagFilters.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => handleTagToggle(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          {hasActiveFilters ? (
            <>
              Showing {filteredCount} of {totalCount} constructs
            </>
          ) : (
            <>
              {totalCount} {totalCount === 1 ? 'construct' : 'constructs'}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConstructsFilterBar;