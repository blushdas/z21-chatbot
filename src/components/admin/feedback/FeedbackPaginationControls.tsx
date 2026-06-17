import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface FeedbackPaginationControlsProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number | 'unlimited';
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number | 'unlimited') => void;
  startIndex: number;
  endIndex: number;
}

export const FeedbackPaginationControls: React.FC<FeedbackPaginationControlsProps> = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  startIndex,
  endIndex
}) => {
  const [jumpToPage, setJumpToPage] = React.useState<string>('');

  const handleJumpToPage = () => {
    const pageNum = parseInt(jumpToPage);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setJumpToPage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  const isUnlimited = itemsPerPage === 'unlimited';

  return (
    <div className="space-y-4">
      {/* Items per page selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label htmlFor="items-per-page" className="text-sm font-medium">
            Show:
          </Label>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={(value) => onItemsPerPageChange(value === 'unlimited' ? 'unlimited' : parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="unlimited">All</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">entries</span>
        </div>

        {!isUnlimited && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Label htmlFor="jump-to-page" className="text-sm font-medium">
              Go to page:
            </Label>
            <Input
              id="jump-to-page"
              type="number"
              min="1"
              max={totalPages}
              value={jumpToPage}
              onChange={(e) => setJumpToPage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-20"
              placeholder="1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleJumpToPage}
              disabled={!jumpToPage || parseInt(jumpToPage) < 1 || parseInt(jumpToPage) > totalPages}
            >
              Go
            </Button>
          </div>
        )}
      </div>

      {/* Pagination info and controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {totalItems === 0 ? (
            'No entries found'
          ) : isUnlimited ? (
            `Showing all ${totalItems} entries`
          ) : (
            `Showing ${startIndex + 1}-${endIndex} of ${totalItems} entries`
          )}
        </div>

        {!isUnlimited && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};