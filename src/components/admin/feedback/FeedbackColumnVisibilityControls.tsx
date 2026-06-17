import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Settings, Eye, EyeOff } from 'lucide-react';

export interface ColumnVisibility {
  category: boolean;
  user: boolean;
  rating: boolean;
  originalMessage: boolean;
  editedMessage: boolean;
  lengthPreference: boolean;
  comment: boolean;
  chat: boolean;
  date: boolean;
}

export const DEFAULT_COLUMN_VISIBILITY: ColumnVisibility = {
  category: true, // Always visible
  user: true,
  rating: true,
  originalMessage: true,
  editedMessage: false,
  lengthPreference: false,
  comment: false,
  chat: true,
  date: true,
};

interface FeedbackColumnVisibilityControlsProps {
  visibleColumns: ColumnVisibility;
  onVisibilityChange: (columns: ColumnVisibility) => void;
}

export const FeedbackColumnVisibilityControls: React.FC<FeedbackColumnVisibilityControlsProps> = ({
  visibleColumns,
  onVisibilityChange
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const columnLabels = {
    user: 'User',
    rating: 'Rating',
    originalMessage: 'Original Message',
    editedMessage: 'Edited Message',
    lengthPreference: 'Length Preference',
    comment: 'Comment',
    chat: 'Chat',
    date: 'Date',
  };

  const handleColumnToggle = (column: keyof ColumnVisibility, checked: boolean) => {
    onVisibilityChange({
      ...visibleColumns,
      [column]: checked
    });
  };

  const handleShowAll = () => {
    const allVisible = Object.keys(columnLabels).reduce((acc, key) => ({
      ...acc,
      [key]: true
    }), { category: true } as ColumnVisibility);
    onVisibilityChange(allVisible);
  };

  const handleHideAll = () => {
    const essentialVisible = Object.keys(columnLabels).reduce((acc, key) => ({
      ...acc,
      [key]: false
    }), { category: true } as ColumnVisibility);
    onVisibilityChange(essentialVisible);
  };

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
  const totalCount = Object.keys(visibleColumns).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          Columns ({visibleCount}/{totalCount})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Column Visibility</h4>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleShowAll}
                className="h-7 px-2 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                All
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleHideAll}
                className="h-7 px-2 text-xs"
              >
                <EyeOff className="h-3 w-3 mr-1" />
                None
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            {/* Category is always visible */}
            <div className="flex items-center space-x-2 opacity-50">
              <Checkbox checked={true} disabled />
              <label className="text-sm">Category (required)</label>
            </div>
            
            {/* Other columns */}
            {Object.entries(columnLabels).map(([key, label]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  checked={visibleColumns[key as keyof ColumnVisibility]}
                  onCheckedChange={(checked) => 
                    handleColumnToggle(key as keyof ColumnVisibility, checked as boolean)
                  }
                />
                <label className="text-sm cursor-pointer flex-1">
                  {label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
