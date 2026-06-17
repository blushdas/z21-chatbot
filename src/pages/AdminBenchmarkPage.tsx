import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Play, TrendingUp, CheckCircle2, XCircle, Loader2, Clock, Zap, Target } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface BenchmarkResult {
  runId: string;
  testName: string;
  endpoint: string;
  concurrencyLevel: number;
  percentiles: {
    p50: number;
    p95: number;
    p99: number;
    mean: number;
    min: number;
    max: number;
  };
  totalRequests: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  throughputRps: number;
  passP95Target: boolean;
  targetP95Ms: number;
  durationSeconds: number;
  startedAt: string;
  completedAt: string;
}

interface BenchmarkAggregate {
  id: string;
  run_id: string;
  test_name: string;
  endpoint: string;
  concurrency_level: number;
  p50_ms: number;
  p95_ms: number;
  p99_ms: number;
  mean_ms: number;
  min_ms: number;
  max_ms: number;
  total_requests: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  throughput_rps: number;
  target_p95_ms: number;
  pass_p95_target: boolean;
  started_at: string;
  completed_at: string;
  duration_seconds: number;
  created_at: string;
}

const ENDPOINTS = [
  { value: 'pinecone-rag-chat', label: 'RAG Chat (Core)' },
  { value: 'generate-chat-title', label: 'Generate Title' },
  { value: 'verify-2fa', label: 'Verify 2FA' },
  { value: 'generate-embedding', label: 'Generate Embedding' },
];

const AdminBenchmarkPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [endpoint, setEndpoint] = useState('pinecone-rag-chat');
  const [concurrency, setConcurrency] = useState(5);
  const [requestCount, setRequestCount] = useState(20);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [latestResult, setLatestResult] = useState<BenchmarkResult | null>(null);

  // Fetch historical benchmark aggregates
  const { data: aggregates, isLoading } = useQuery({
    queryKey: ['benchmark-aggregates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('benchmark_aggregates')
        .select('*')
        .order('completed_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as BenchmarkAggregate[];
    },
  });

  // Run benchmark mutation
  const runBenchmark = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `https://rptccafbujxprahkstmp.supabase.co/functions/v1/run-benchmark`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            endpoint,
            testName: `admin_${endpoint}_c${concurrency}`,
            concurrencyLevel: concurrency,
            requestCount,
            targetP95Ms: 3000,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Benchmark failed');
      }

      return response.json() as Promise<BenchmarkResult>;
    },
    onSuccess: (result) => {
      setLatestResult(result);
      setIsRunning(false);
      setProgress(100);
      queryClient.invalidateQueries({ queryKey: ['benchmark-aggregates'] });
      toast.success(`Benchmark complete: p95 = ${result.percentiles.p95}ms`);
    },
    onError: (error) => {
      setIsRunning(false);
      setProgress(0);
      toast.error(error instanceof Error ? error.message : 'Benchmark failed');
    },
  });

  // Simulate progress during benchmark run
  useEffect(() => {
    if (!isRunning) return;
    
    const interval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 95));
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning]);

  const handleRunBenchmark = () => {
    setIsRunning(true);
    setProgress(0);
    setLatestResult(null);
    runBenchmark.mutate();
  };

  // Prepare chart data (last 20 runs, sorted by time ascending)
  const chartData = aggregates
    ?.filter((a) => a.endpoint === endpoint)
    .slice(0, 20)
    .reverse()
    .map((a) => ({
      name: format(new Date(a.completed_at), 'MM/dd HH:mm'),
      p50: a.p50_ms,
      p95: a.p95_ms,
      p99: a.p99_ms,
    })) || [];

  return (
    <AdminLayout>
      <BackToAdminButton />
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Load Testing Benchmarks</h1>
            <p className="text-muted-foreground">
              Validate p95 latency targets for enterprise scaling (SCALE-01)
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            Target: p95 &lt; 3000ms
          </Badge>
        </div>

        {/* Run Benchmark Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Run Benchmark
            </CardTitle>
            <CardDescription>
              Configure and execute load tests against Edge Functions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Endpoint</Label>
                <Select value={endpoint} onValueChange={setEndpoint} disabled={isRunning}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ENDPOINTS.map((ep) => (
                      <SelectItem key={ep.value} value={ep.value}>
                        {ep.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Concurrency: {concurrency}</Label>
                <Slider
                  value={[concurrency]}
                  onValueChange={([val]) => setConcurrency(val)}
                  min={1}
                  max={50}
                  step={1}
                  disabled={isRunning}
                />
              </div>

              <div className="space-y-2">
                <Label>Request Count</Label>
                <Input
                  type="number"
                  value={requestCount}
                  onChange={(e) => setRequestCount(Number(e.target.value))}
                  min={5}
                  max={200}
                  disabled={isRunning}
                />
              </div>
            </div>

            {isRunning && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Running benchmark...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            <Button
              onClick={handleRunBenchmark}
              disabled={isRunning}
              className="w-full md:w-auto"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Latest Result Card */}
        {latestResult && (
          <Card className={latestResult.passP95Target ? 'border-primary/50' : 'border-destructive/50'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {latestResult.passP95Target ? (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                Latest Result
                <Badge variant={latestResult.passP95Target ? 'default' : 'destructive'}>
                  {latestResult.passP95Target ? 'PASS' : 'FAIL'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{latestResult.percentiles.p50}ms</div>
                  <div className="text-xs text-muted-foreground">p50</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-primary">{latestResult.percentiles.p95}ms</div>
                  <div className="text-xs text-muted-foreground">p95</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{latestResult.percentiles.p99}ms</div>
                  <div className="text-xs text-muted-foreground">p99</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{latestResult.successRate}%</div>
                  <div className="text-xs text-muted-foreground">Success</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{latestResult.throughputRps}</div>
                  <div className="text-xs text-muted-foreground">req/sec</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{latestResult.durationSeconds.toFixed(1)}s</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historical Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Latency Trends
            </CardTitle>
            <CardDescription>
              Historical p50/p95/p99 latency for {ENDPOINTS.find((e) => e.value === endpoint)?.label}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    className="fill-muted-foreground"
                    label={{ value: 'ms', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <ReferenceLine 
                    y={3000} 
                    stroke="hsl(var(--destructive))" 
                    strokeDasharray="5 5"
                    label={{ value: 'Target: 3000ms', position: 'right', fill: 'hsl(var(--destructive))' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="p50" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="p50"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="p95" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="p95"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="p99" 
                    stroke="hsl(var(--chart-3))" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="p99"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No benchmark data yet. Run a test to see trends.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Benchmark History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : aggregates && aggregates.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Endpoint</TableHead>
                    <TableHead className="text-center">C</TableHead>
                    <TableHead className="text-right">p50</TableHead>
                    <TableHead className="text-right">p95</TableHead>
                    <TableHead className="text-right">p99</TableHead>
                    <TableHead className="text-right">Success</TableHead>
                    <TableHead className="text-right">RPS</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aggregates.map((agg) => (
                    <TableRow key={agg.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(agg.completed_at), 'MM/dd HH:mm')}
                      </TableCell>
                      <TableCell>{agg.endpoint}</TableCell>
                      <TableCell className="text-center">{agg.concurrency_level}</TableCell>
                      <TableCell className="text-right">{agg.p50_ms}ms</TableCell>
                      <TableCell className="text-right font-medium">{agg.p95_ms}ms</TableCell>
                      <TableCell className="text-right">{agg.p99_ms}ms</TableCell>
                      <TableCell className="text-right">{agg.success_rate}%</TableCell>
                      <TableCell className="text-right">{agg.throughput_rps}</TableCell>
                      <TableCell className="text-center">
                        {agg.pass_p95_target ? (
                          <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                            PASS
                          </Badge>
                        ) : (
                          <Badge variant="destructive">FAIL</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No benchmark results yet. Run your first test above.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Targets Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Go/No-Go Performance Targets
            </CardTitle>
            <CardDescription>
              Enterprise scaling requirements per SECURITY_AUDIT_REPORT.md Gate 2
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">p95 Latency</div>
                <div className="text-xl font-bold">&lt; 3000ms</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">p99 Latency</div>
                <div className="text-xl font-bold">&lt; 5000ms</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Success Rate</div>
                <div className="text-xl font-bold">&gt; 99%</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="text-sm text-muted-foreground">Throughput</div>
                <div className="text-xl font-bold">&gt; 10 req/s</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminBenchmarkPage;
