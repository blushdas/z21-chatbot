import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Info } from 'lucide-react';

const RetentionPolicyBanner: React.FC = () => {
  const { data: setting } = useQuery({
    queryKey: ['platform-setting', 'data_retention_days'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'data_retention_days')
        .single();
      if (error) throw error;
      return data;
    },
  });

  const config = setting?.value as { days?: number; enabled?: boolean } | null;

  if (!config?.enabled) return null;

  return (
    <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
      <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-blue-800 dark:text-blue-200">
          Data Retention Policy Active
        </p>
        <p className="text-blue-700 dark:text-blue-300 mt-0.5">
          Your chat history is retained for {config.days || 90} days. 
          Pin important chats to keep them permanently.
        </p>
      </div>
    </div>
  );
};

export default RetentionPolicyBanner;
