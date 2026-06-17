import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Database, 
  FileText, 
  Mic, 
  FolderArchive,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface NamespaceInfo {
  namespace: string;
  label: string;
  vectorCount: number;
}

interface PineconeStats {
  namespaces: NamespaceInfo[];
  totalVectorCount: number;
  dimension: number;
  indexFullness: number;
  timestamp: string;
}

const getNamespaceIcon = (namespace: string) => {
  if (namespace.includes('Articles') || namespace.includes('Smart')) {
    return <FileText className="h-5 w-5" />;
  }
  if (namespace.includes('Transcripts') || namespace.includes('Learning')) {
    return <Mic className="h-5 w-5" />;
  }
  if (namespace.includes('Folders') || namespace.includes('Archives')) {
    return <FolderArchive className="h-5 w-5" />;
  }
  return <Database className="h-5 w-5" />;
};

const getNamespaceColor = (namespace: string): string => {
  if (namespace.includes('Articles') || namespace.includes('Smart')) {
    return 'bg-blue-500/10 text-blue-600 dark:text-blue-400';
  }
  if (namespace.includes('Transcripts') || namespace.includes('Learning')) {
    return 'bg-purple-500/10 text-purple-600 dark:text-purple-400';
  }
  if (namespace.includes('Folders') || namespace.includes('Archives')) {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
  }
  return 'bg-muted text-muted-foreground';
};

const PineconeStatsCards: React.FC = () => {
  const { data: stats, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['pinecone-stats'],
    queryFn: async (): Promise<PineconeStats> => {
      // Use getUser() for fresh auth validation instead of getSession() which can be stale
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Not authenticated');
      }

      // Get the current session for the access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Session expired');
      }

      const response = await fetch(
        'https://rptccafbujxprahkstmp.supabase.co/functions/v1/get-pinecone-stats',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch stats');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  if (error) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>Failed to load Pinecone stats: {error.message}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Vector Index Overview</h2>
          {stats && (
            <Badge variant="outline" className="ml-2">
              {stats.totalVectorCount.toLocaleString()} total vectors
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {stats?.timestamp && (
            <span className="text-sm text-muted-foreground">
              Updated {formatDistanceToNow(new Date(stats.timestamp), { addSuffix: true })}
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : stats?.namespaces ? (
          <>
            {stats.namespaces.map((ns) => (
              <Card key={ns.namespace} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span className={`p-1.5 rounded ${getNamespaceColor(ns.namespace)}`}>
                      {getNamespaceIcon(ns.namespace)}
                    </span>
                    {ns.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {ns.vectorCount.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    vectors indexed
                  </p>
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <Card className="col-span-full">
            <CardContent className="pt-6 text-center text-muted-foreground">
              No namespace data available
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PineconeStatsCards;
