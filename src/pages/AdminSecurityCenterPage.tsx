import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useHasRole } from '@/hooks/useHasRole';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import SecurityMetricsCards from '@/components/admin/SecurityMetricsCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  ArrowLeft, 
  Database, 
  Users, 
  Zap, 
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Clock,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SAMPLE_EDGE_LOGS, SAMPLE_DB_LOGS, SAMPLE_AUTH_LOGS } from '@/data/sampleSecurityLogs';

interface LogEntry {
  id: string;
  timestamp: number;
  event_message: string;
  error_severity?: string;
  level?: string;
  status?: string;
  path?: string;
  msg?: string;
  error?: string;
  status_code?: number;
  method?: string;
  function_id?: string;
  execution_time_ms?: number;
  deployment_id?: string;
  version?: string;
}

const AdminSecurityCenterPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const { hasRole: isSuperadmin, isLoading: roleLoading } = useHasRole('superadmin');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('functions'); // Start with functions tab
  const [logLimit, setLogLimit] = useState('100');
  const [selectedFunction, setSelectedFunction] = useState<string>('all');

  // Check permissions
  React.useEffect(() => {
    if (!loading && !roleLoading && user && profile) {
      if (!isSuperadmin) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive"
        });
        navigate('/admin');
        return;
      }
    } else if (!loading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, profile, loading, roleLoading, isSuperadmin, navigate, toast]);

  // Fetch database logs
  const { data: dbLogs = [], isLoading: dbLoading } = useQuery({
    queryKey: ['admin-db-logs', logLimit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-analytics-logs', {
        body: { 
          logType: 'database',
          limit: parseInt(logLimit)
        }
      });
      
      if (error) {
        console.error('Database logs error:', error);
        return [];
      }
      
      return data?.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        event_message: log.event_message,
        error_severity: log.error_severity,
      })) || [];
    },
    enabled: !!user && isSuperadmin
  });

  // Fetch auth logs
  const { data: authLogs = [], isLoading: authLoading } = useQuery({
    queryKey: ['admin-auth-logs', logLimit],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-analytics-logs', {
        body: { 
          logType: 'auth',
          limit: parseInt(logLimit)
        }
      });
      
      if (error) {
        console.error('Auth logs error:', error);
        return [];
      }
      
      return data?.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        event_message: log.event_message,
        level: log.level,
        status: log.status,
        path: log.path,
        msg: log.msg,
        error: log.error,
      })) || [];
    },
    enabled: !!user && isSuperadmin
  });

  // Fetch edge function logs with enhanced filtering
  const { data: edgeLogs = [], isLoading: edgeLoading } = useQuery({
    queryKey: ['admin-edge-logs', logLimit, selectedFunction],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('get-analytics-logs', {
        body: { 
          logType: 'functions',
          limit: parseInt(logLimit),
          functionFilter: selectedFunction
        }
      });
      
      if (error) {
        console.error('Edge function logs error:', error);
        return [];
      }
      
      return data?.map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        event_message: log.event_message,
        status_code: log.status_code,
        method: log.method,
        function_id: log.function_id,
        execution_time_ms: log.execution_time_ms,
        deployment_id: log.deployment_id,
        version: log.version,
      })) || [];
    },
    enabled: !!user && isSuperadmin
  });

  // Get unique function names for filtering
  const availableFunctions = [...new Set(edgeLogs.map(log => log.function_id).filter(Boolean))]
    .sort()
    .filter((name): name is string => typeof name === 'string' && name.length > 0);

  // Fall back to sample data when live analytics returns empty.
  const displayEdge: LogEntry[] = edgeLogs.length ? edgeLogs : (SAMPLE_EDGE_LOGS as LogEntry[]);
  const displayDb: LogEntry[] = dbLogs.length ? dbLogs : (SAMPLE_DB_LOGS as LogEntry[]);
  const displayAuth: LogEntry[] = authLogs.length ? authLogs : (SAMPLE_AUTH_LOGS as LogEntry[]);
  const edgeIsSample = !edgeLoading && edgeLogs.length === 0;
  const dbIsSample = !dbLoading && dbLogs.length === 0;
  const authIsSample = !authLoading && authLogs.length === 0;

  // Focus on OpenAI/RAG functions
  const priorityFunctions = availableFunctions.filter((name: string) => 
    name.includes('openai') || 
    name.includes('rag') || 
    name.includes('chat') ||
    name.includes('pinecone')
  );

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp / 1000); // Convert from microseconds
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'error':
      case 'fatal':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
      case 'log':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: any) => {
    if (!status) return null;
    
    const isError = status >= 400;
    return (
      <Badge variant={isError ? "destructive" : "secondary"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || !profile || !isSuperadmin) {
    return null;
  }

  return (
    <AdminLayout>
      <BackToAdminButton />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/admin" className="hover:text-brand-blue dark:text-foreground">Admin Dashboard</Link>
            <span>/</span>
            <span className="text-brand-blue dark:text-foreground font-medium">Security Center</span>
          </div>

          {/* Header */}
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Shield className="w-8 h-8 text-blue-600" />
                Security Center
              </h1>
              <p className="text-muted-foreground mt-2">
                Monitor system security through audit logs and access patterns
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/admin/security-settings">
                <Settings className="w-4 h-4 mr-2" />
                Security Settings
              </Link>
            </Button>
          </div>

          <SecurityMetricsCards />

          {/* Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Select value={logLimit} onValueChange={setLogLimit}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 logs</SelectItem>
                  <SelectItem value="100">100 logs</SelectItem>
                  <SelectItem value="200">200 logs</SelectItem>
                  <SelectItem value="500">500 logs</SelectItem>
                </SelectContent>
              </Select>
              
              {activeTab === 'functions' && (
                <Select value={selectedFunction} onValueChange={setSelectedFunction}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Functions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Functions</SelectItem>
                    {priorityFunctions.length > 0 && (
                      <>
                        <SelectItem disabled value="">— Priority Functions —</SelectItem>
                        {priorityFunctions.map((func: string) => (
                          <SelectItem key={func} value={func}>
                            {func}
                          </SelectItem>
                        ))}
                      </>
                    )}
                    {availableFunctions.filter((f: string) => !priorityFunctions.includes(f)).length > 0 && (
                      <>
                        <SelectItem disabled value="">— Other Functions —</SelectItem>
                        {availableFunctions.filter((f: string) => !priorityFunctions.includes(f)).map((func: string) => (
                          <SelectItem key={func} value={func}>
                            {func}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Log Tabs - Functions first for easier access */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="functions" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Edge Functions
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Database Logs
              </TabsTrigger>
              <TabsTrigger value="auth" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Auth Logs
              </TabsTrigger>
            </TabsList>

            {/* Edge Function Logs - Now first */}
            <TabsContent value="functions">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Edge Function Logs
                    {selectedFunction !== 'all' && (
                      <Badge variant="outline" className="ml-2">
                        {selectedFunction}
                      </Badge>
                    )}
                    {edgeIsSample && (
                      <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600">
                        Sample data
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {edgeLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {displayEdge.map((log: LogEntry) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          <Zap className={`w-4 h-4 mt-1 ${
                            log.function_id?.includes('openai') || log.function_id?.includes('rag') 
                              ? 'text-green-500' 
                              : 'text-purple-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <div className="flex gap-2">
                                {log.function_id && (
                                  <Badge 
                                    variant={
                                      log.function_id.includes('openai') || log.function_id.includes('rag') 
                                        ? "default" 
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {log.function_id}
                                  </Badge>
                                )}
                                {log.method && (
                                  <Badge variant="outline" className="text-xs">{log.method}</Badge>
                                )}
                                {log.status_code && getStatusBadge(log.status_code)}
                                {log.execution_time_ms && (
                                  <Badge 
                                    variant={log.execution_time_ms > 5000 ? "destructive" : "secondary"}
                                    className="text-xs"
                                  >
                                    {log.execution_time_ms}ms
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 mb-1 font-mono text-wrap break-all">
                              {log.event_message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Database Logs */}
            <TabsContent value="database">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database Activity Logs
                    {dbIsSample && (
                      <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600">
                        Sample data
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dbLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {displayDb.map((log: LogEntry) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          {getSeverityIcon(log.error_severity || 'info')}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-foreground">
                                {log.error_severity && (
                                  <Badge variant={log.error_severity === 'ERROR' ? 'destructive' : 'secondary'} className="mr-2">
                                    {log.error_severity}
                                  </Badge>
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 font-mono text-wrap break-all">
                              {log.event_message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Auth Logs */}
            <TabsContent value="auth">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Authentication Logs
                    {authIsSample && (
                      <Badge variant="outline" className="ml-2 border-amber-500 text-amber-600">
                        Sample data
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {authLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {displayAuth.map((log: LogEntry) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                          {getSeverityIcon(log.level || 'info')}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex gap-2">
                                {log.level && (
                                  <Badge variant="secondary">{log.level}</Badge>
                                )}
                                {log.status && getStatusBadge(log.status)}
                              </div>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTimestamp(log.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground/90 mb-1">
                              {log.msg || log.event_message}
                            </p>
                            {log.path && (
                              <p className="text-xs text-muted-foreground font-mono">
                                Path: {log.path}
                              </p>
                            )}
                            {log.error && (
                              <p className="text-xs text-red-600 font-mono">
                                Error: {log.error}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </AdminLayout>
  );
};

export default AdminSecurityCenterPage;