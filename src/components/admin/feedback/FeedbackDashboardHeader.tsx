
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface FeedbackDashboardHeaderProps {
  onExportCSV: () => void;
}

export const FeedbackDashboardHeader: React.FC<FeedbackDashboardHeaderProps> = ({
  onExportCSV
}) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl font-heading text-brand-blue dark:text-foreground">Feedback Dashboard</h1>
        <p className="text-muted-foreground mt-2">Monitor and analyze user feedback across all interactions</p>
      </div>
      <Button onClick={onExportCSV} className="flex items-center gap-2">
        <Download className="w-4 h-4" />
        Export CSV
      </Button>
    </div>
  );
};
