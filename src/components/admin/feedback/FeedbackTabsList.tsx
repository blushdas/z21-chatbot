
import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface TabCounts {
  all: number;
  rewrite: number;
  positive: number;
  negative: number;
  comment: number;
}

interface FeedbackTabsListProps {
  tabCounts: TabCounts;
}

export const FeedbackTabsList: React.FC<FeedbackTabsListProps> = ({ 
  tabCounts 
}) => {
  return (
    <TabsList className="grid grid-cols-5 w-full">
      <TabsTrigger value="all" className="flex items-center gap-2">
        All
        <Badge variant="secondary" className="ml-1">{tabCounts.all}</Badge>
      </TabsTrigger>
      <TabsTrigger value="rewrite" className="flex items-center gap-2">
        ✍️ Rewrite
        <Badge variant="secondary" className="ml-1">{tabCounts.rewrite}</Badge>
      </TabsTrigger>
      <TabsTrigger value="positive" className="flex items-center gap-2">
        👍 Positive
        <Badge variant="secondary" className="ml-1">{tabCounts.positive}</Badge>
      </TabsTrigger>
      <TabsTrigger value="negative" className="flex items-center gap-2">
        👎 Negative
        <Badge variant="secondary" className="ml-1">{tabCounts.negative}</Badge>
      </TabsTrigger>
      <TabsTrigger value="comment" className="flex items-center gap-2">
        💬 Comment
        <Badge variant="secondary" className="ml-1">{tabCounts.comment}</Badge>
      </TabsTrigger>
    </TabsList>
  );
};
