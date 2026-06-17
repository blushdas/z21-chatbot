import React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Settings2, Eye, EyeOff } from 'lucide-react';

export interface UserFeedbackColumnConfig {
  key: string;
  label: string;
  defaultVisible: boolean;
}

export const USER_FEEDBACK_COLUMNS: UserFeedbackColumnConfig[] = [
  { key: 'category', label: 'Category', defaultVisible: true },
  { key: 'message', label: 'Message', defaultVisible: true },
  { key: 'rating', label: 'Rating', defaultVisible: true },
  { key: 'comment', label: 'Comment', defaultVisible: false },
  { key: 'chat', label: 'Chat', defaultVisible: false },
  { key: 'date', label: 'Date', defaultVisible: true },
];

interface UserFeedbackColumnVisibilityControlsProps {
  visibleColumns: Record<string, boolean>;
  onToggleColumn: (columnKey: string) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

const UserFeedbackColumnVisibilityControls: React.FC<UserFeedbackColumnVisibilityControlsProps> = ({
  visibleColumns,
  onToggleColumn,
  onShowAll,
  onHideAll
}) => {
  const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
  const totalCount = USER_FEEDBACK_COLUMNS.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="h-9 px-3"
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Columns ({visibleCount}/{totalCount})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Show/Hide Columns</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onShowAll}
                className="h-7 px-2 text-xs"
              >
                <Eye className="w-3 h-3 mr-1" />
                Show All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onHideAll}
                className="h-7 px-2 text-xs"
              >
                <EyeOff className="w-3 h-3 mr-1" />
                Hide All
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-3">
            <div className="space-y-3">
              {USER_FEEDBACK_COLUMNS.map((column) => {
                const isChecked = visibleColumns[column.key];
                const isDisabled = column.key === 'category'; // Category always visible
                
                return (
                  <div 
                    key={column.key}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={`column-${column.key}`}
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={() => !isDisabled && onToggleColumn(column.key)}
                      className="h-4 w-4"
                    />
                    <label
                      htmlFor={`column-${column.key}`}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        isDisabled ? 'text-muted-foreground' : 'cursor-pointer'
                      }`}
                    >
                      {column.label}
                      {isDisabled && (
                        <span className="text-xs text-muted-foreground ml-1">(Always shown)</span>
                      )}
                    </label>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default UserFeedbackColumnVisibilityControls;