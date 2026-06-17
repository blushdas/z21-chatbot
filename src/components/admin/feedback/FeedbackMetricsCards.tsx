
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface FeedbackMetrics {
  total: number;
  thumbsUp: number;
  thumbsDown: number;
  edits: number;
  comments: number;
}

interface FeedbackMetricsCardsProps {
  metrics: FeedbackMetrics;
}

export const FeedbackMetricsCards: React.FC<FeedbackMetricsCardsProps> = ({ metrics }) => {
  const getSatisfactionRate = () => {
    const total = metrics.thumbsUp + metrics.thumbsDown;
    if (total === 0) return 0;
    return Math.round((metrics.thumbsUp / total) * 100);
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-brand-blue dark:text-foreground">{metrics.total}</div>
            <div className="text-sm text-muted-foreground">Total Feedback</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{metrics.thumbsUp}</div>
            <div className="text-sm text-muted-foreground">Thumbs Up</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{metrics.thumbsDown}</div>
            <div className="text-sm text-muted-foreground">Thumbs Down</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{metrics.edits}</div>
            <div className="text-sm text-muted-foreground">Edits</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{metrics.comments}</div>
            <div className="text-sm text-muted-foreground">Comments</div>
          </CardContent>
        </Card>
      </div>

      {/* Satisfaction Rate */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
              <div className="text-3xl font-bold text-brand-blue dark:text-foreground">{getSatisfactionRate()}%</div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              Based on {metrics.thumbsUp + metrics.thumbsDown} ratings
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
