
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackTable, ColumnVisibility } from './FeedbackTable';
import { FeedbackColumnVisibilityControls, DEFAULT_COLUMN_VISIBILITY } from './FeedbackColumnVisibilityControls';
import { FeedbackPaginationControls } from './FeedbackPaginationControls';

interface FeedbackEntry {
  id: string;
  user_id: string | null;
  chat_id: string | null;
  message_id: string;
  role: string | null;
  original_message: string | null;
  edited_message: string | null;
  length_preference: string | null;
  rating: string | null;
  comment: string | null;
  created_at: string;
  profiles?: {
    name: string | null;
    id: string;
  } | null;
}

interface FeedbackTableContainerProps {
  filteredFeedback: FeedbackEntry[];
  isLoading: boolean;
  onSelectFeedback: (id: string) => void;
  onViewChat: (chatId: string) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number | 'unlimited';
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number | 'unlimited') => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export const FeedbackTableContainer: React.FC<FeedbackTableContainerProps> = ({
  filteredFeedback,
  isLoading,
  onSelectFeedback,
  onViewChat,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  onItemsPerPageChange,
  sortBy,
  sortDirection,
  onSort
}) => {
  const [visibleColumns, setVisibleColumns] = useState<ColumnVisibility>(DEFAULT_COLUMN_VISIBILITY);

  // Load column preferences from localStorage on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('feedbackTableColumns');
    if (savedPreferences) {
      try {
        setVisibleColumns(JSON.parse(savedPreferences));
      } catch (error) {
        console.error('Error loading column preferences:', error);
      }
    }
  }, []);

  // Save column preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('feedbackTableColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            Feedback Entries
          </CardTitle>
          <FeedbackColumnVisibilityControls 
            visibleColumns={visibleColumns}
            onVisibilityChange={setVisibleColumns}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <FeedbackPaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          startIndex={startIndex}
          endIndex={endIndex}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4"></div>
            <p>Loading feedback...</p>
          </div>
        ) : (
          <>
            <FeedbackTable 
              feedback={filteredFeedback} 
              onSelectFeedback={onSelectFeedback}
              onViewChat={onViewChat}
              visibleColumns={visibleColumns}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={onSort}
            />
            
            {totalPages > 1 && itemsPerPage !== 'unlimited' && (
              <FeedbackPaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={onPageChange}
                onItemsPerPageChange={onItemsPerPageChange}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
