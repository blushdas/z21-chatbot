import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, format, parse } from 'date-fns';
import { SUPABASE_URL } from '@/integrations/supabase/client';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

/* ─── Constants ──────────────────────────────────────────────── */
const PAGE_SIZE = 25;
const SERVICES = ['openai', 'pinecone'] as const;

// Gold matching existing MetricSparkline brand color
const OPENAI_COLOR = 'hsl(43,39%,49%)';
// Blue consistent with AdminDualResponseAnalytics
const PINECONE_COLOR = '#3b82f6';

/* ─── Types ──────────────────────────────────────────────────── */
interface ServiceHealthRow {
  id: string;
  checked_at: string;
  service: string;
  status: string;
  latency_ms: number | null;
  http_status: number | null;
  error_message: string | null;
}

interface TrendRawRow {
  checked_at: string;
  service: string;
  latency_ms: number | null;
  status: string;
}

/* ─── Donut chart types ──────────────────────────────────────── */
interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface ServiceBreakdown {
  openai: DonutSlice[];
  pinecone: DonutSlice[];
}

interface ChartDataPoint {
  hourKey: string;   // 'yyyy-MM-dd HH:00' — used for bucketing
  hourLabel: string; // 'MMM d, HH:mm'     — displayed on axis
  openai?: number;
  pinecone?: number;
}

/* ─── Status config ──────────────────────────────────────────── */
const STATUS_CONFIG = {
  ok: {
    label: 'OK',
    className: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    icon: CheckCircle2,
    dot: 'bg-green-500',
  },
  degraded: {
    label: 'Degraded',
    className: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
    icon: AlertTriangle,
    dot: 'bg-yellow-500',
  },
  down: {
    label: 'Down',
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    icon: AlertCircle,
    dot: 'bg-destructive',
  },
} as const;

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.down;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 font-medium ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

/* ─── Donut color map ────────────────────────────────────────── */
const DONUT_COLORS = {
  ok:      '#22c55e',  // green-500
  degraded:'#eab308',  // yellow-500
  down:    'hsl(var(--destructive))',
} as const;

/* ─── Page ───────────────────────────────────────────────────── */
const AdminServiceHealthPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isRunning, setIsRunning] = useState(false);
  const [page, setPage] = useState(0);

  /* ── Query 1: cheap live status (4 rows, every 30s) ─────────── */
  const { data: latestByService = {}, dataUpdatedAt } = useQuery<
    Record<string, ServiceHealthRow>
  >({
    queryKey: ['service-health-latest'],
    queryFn: async () => {
      const results = await Promise.all(
        SERVICES.map((svc) =>
          (supabase as any)
            .from('service_health')
            .select('*')
            .eq('service', svc)
            .order('checked_at', { ascending: false })
            .limit(2)
        )
      );

      const map: Record<string, ServiceHealthRow> = {};
      results.forEach(({ data }, i) => {
        if (data && data.length > 0) {
          map[SERVICES[i]] = data[0] as ServiceHealthRow;
        }
      });
      return map;
    },
    refetchInterval: 30_000,
  });

  /* ── Query 2: paginated history (25 rows, manual refresh) ────── */
  const {
    data: historyData,
    isLoading: historyLoading,
    isFetching: historyFetching,
  } = useQuery<{ rows: ServiceHealthRow[]; totalCount: number }>({
    queryKey: ['service-health-history', page],
    queryFn: async () => {
      const from = page * PAGE_SIZE;
      const to = (page + 1) * PAGE_SIZE - 1;
      const { data, error, count } = await (supabase as any)
        .from('service_health')
        .select('*', { count: 'exact' })
        .order('checked_at', { ascending: false })
        .range(from, to);
      if (error) throw error;
      return { rows: (data as ServiceHealthRow[]) ?? [], totalCount: count ?? 0 };
    },
    refetchInterval: false,
    staleTime: Infinity,
  });

  /* ── Query 3: 7-day latency trend (on-demand, stale forever) ─── */
  const {
    data: trendRawRows,
    isLoading: trendLoading,
    isFetching: trendFetching,
  } = useQuery<TrendRawRow[]>({
    queryKey: ['service-health-trend'],
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { data, error } = await (supabase as any)
        .from('service_health')
        .select('checked_at, service, latency_ms, status')
        // 2 services × 12 checks/hr × 24 hr × 7 days = 2,016 rows max
        .gte('checked_at', sevenDaysAgo.toISOString())
        .not('latency_ms', 'is', null)
        .order('checked_at', { ascending: true })
        .limit(2016);
      if (error) throw error;
      return (data as TrendRawRow[]) ?? [];
    },
    refetchInterval: false,
    staleTime: Infinity,
  });

  /* ── Client-side hourly bucketing (useMemo) ──────────────────── */
  const chartData = useMemo<ChartDataPoint[]>(() => {
    if (!trendRawRows || trendRawRows.length === 0) return [];

    // Accumulate sums + counts per service per hour bucket
    const buckets: Record<string, { openaiSum: number; openaiCount: number; pineconeSum: number; pineconeCount: number }> = {};

    for (const row of trendRawRows) {
      const date = new Date(row.checked_at);
      const hourKey = format(date, 'yyyy-MM-dd HH:00');
      if (!buckets[hourKey]) {
        buckets[hourKey] = { openaiSum: 0, openaiCount: 0, pineconeSum: 0, pineconeCount: 0 };
      }
      if (row.service === 'openai') {
        buckets[hourKey].openaiSum += row.latency_ms;
        buckets[hourKey].openaiCount += 1;
      } else if (row.service === 'pinecone') {
        buckets[hourKey].pineconeSum += row.latency_ms;
        buckets[hourKey].pineconeCount += 1;
      }
    }

    return Object.entries(buckets)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hourKey, bucket]) => {
        const parsed = parse(hourKey, 'yyyy-MM-dd HH:00', new Date());
        const hourLabel = format(parsed, 'MMM d, HH:mm');
        const point: ChartDataPoint = { hourKey, hourLabel };
        if (bucket.openaiCount > 0) {
          point.openai = Math.round(bucket.openaiSum / bucket.openaiCount);
        }
        if (bucket.pineconeCount > 0) {
          point.pinecone = Math.round(bucket.pineconeSum / bucket.pineconeCount);
        }
        return point;
      });
  }, [trendRawRows]);

  /* ── Status breakdown per service (for donut charts) ────────── */
  const statusBreakdown = useMemo<ServiceBreakdown>(() => {
    const counts = {
      openai:   { ok: 0, degraded: 0, down: 0 },
      pinecone: { ok: 0, degraded: 0, down: 0 },
    };
    for (const row of trendRawRows ?? []) {
      const svc = row.service as 'openai' | 'pinecone';
      if (!counts[svc]) continue;
      const s = row.status as 'ok' | 'degraded' | 'down';
      if (s in counts[svc]) counts[svc][s] += 1;
    }
    const toSlices = (c: { ok: number; degraded: number; down: number }): DonutSlice[] =>
      [
        { name: 'OK',       value: c.ok,       color: DONUT_COLORS.ok },
        { name: 'Degraded', value: c.degraded,  color: DONUT_COLORS.degraded },
        { name: 'Down',     value: c.down,      color: DONUT_COLORS.down },
      ].filter((s) => s.value > 0);
    return { openai: toSlices(counts.openai), pinecone: toSlices(counts.pinecone) };
  }, [trendRawRows]);

  const rows = historyData?.rows ?? [];
  const totalCount = historyData?.totalCount ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  /* ── Handlers ────────────────────────────────────────────────── */
  const handleRunCheck = async () => {
    setIsRunning(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      const url = `${SUPABASE_URL}/functions/v1/service-health-check`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Only invalidate live status cards; history stays on current page
      await queryClient.invalidateQueries({ queryKey: ['service-health-latest'] });
      // Reset to page 0 so new rows are visible if user refreshes history
      setPage(0);
    } catch (err) {
      console.error('Manual health check failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleRefreshHistory = () => {
    queryClient.invalidateQueries({ queryKey: ['service-health-history', page] });
  };

  const handleRefreshTrend = () => {
    queryClient.invalidateQueries({ queryKey: ['service-health-trend'] });
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <AdminLayout>
      <BackToAdminButton />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="h-5 w-5 text-accent" />
              <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                Service Health
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Status auto-refreshes every 30s
              {dataUpdatedAt > 0 && (
                <span className="ml-2 text-muted-foreground/70">
                  · Updated {formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}
                </span>
              )}
            </p>
          </div>
          <Button
            onClick={handleRunCheck}
            disabled={isRunning}
            variant="outline"
            className="gap-2 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running…' : 'Run Check Now'}
          </Button>
        </div>

        {/* Current Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {SERVICES.map((svc) => {
            const latest = latestByService[svc];
            const cfg = latest
              ? STATUS_CONFIG[latest.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.down
              : null;
            return (
              <div
                key={svc}
                className="rounded-xl border border-border bg-card p-5 flex items-start gap-4"
              >
                <div
                  className={`mt-0.5 w-3 h-3 rounded-full shrink-0 ${
                    cfg?.dot ?? 'bg-muted'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-foreground capitalize">{svc}</span>
                    {latest ? (
                      <StatusBadge status={latest.status} />
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        No data
                      </Badge>
                    )}
                  </div>
                  {latest && (
                    <p className="text-xs text-muted-foreground">
                      {latest.latency_ms != null && `${latest.latency_ms}ms · `}
                      {latest.http_status != null && `HTTP ${latest.http_status} · `}
                      Checked{' '}
                      {formatDistanceToNow(new Date(latest.checked_at), { addSuffix: true })}
                    </p>
                  )}
                  {latest?.error_message && (
                    <p className="text-xs text-destructive mt-0.5 truncate">
                      {latest.error_message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── 7-Day Latency Trend Chart ────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">
          {/* Chart header */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">7-Day Latency Trend</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Hourly average · Last 7 days · On-demand
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
              onClick={handleRefreshTrend}
              disabled={trendFetching}
              title="Refresh trend data"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${trendFetching ? 'animate-spin' : ''}`}
              />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>

          <div className="px-5 py-4">
            {trendLoading ? (
              /* Loading skeleton */
              <Skeleton className="h-[220px] w-full rounded-lg" />
            ) : chartData.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-[220px] gap-2 text-muted-foreground">
                <Activity className="h-8 w-8 opacity-30" />
                <p className="text-sm">No trend data available for the last 7 days.</p>
                <p className="text-xs">Run a health check to begin collecting latency data.</p>
              </div>
            ) : (
              /* Chart */
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradOpenAI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={OPENAI_COLOR} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={OPENAI_COLOR} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gradPinecone" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={PINECONE_COLOR} stopOpacity={0.20} />
                      <stop offset="95%" stopColor={PINECONE_COLOR} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    strokeOpacity={0.6}
                  />
                  <XAxis
                    dataKey="hourLabel"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    interval="preserveStartEnd"
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) => `${v}ms`}
                    width={56}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value}ms`,
                      name === 'openai' ? 'OpenAI' : 'Pinecone',
                    ]}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span style={{ fontSize: 12, color: 'hsl(var(--foreground))' }}>
                        {value === 'openai' ? 'OpenAI' : 'Pinecone'}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="openai"
                    name="openai"
                    stroke={OPENAI_COLOR}
                    fill="url(#gradOpenAI)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    connectNulls={false}
                  />
                  <Area
                    type="monotone"
                    dataKey="pinecone"
                    name="pinecone"
                    stroke={PINECONE_COLOR}
                    fill="url(#gradPinecone)"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── 7-Day Status Reliability Breakdown (Donut Charts) ────── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground">7-Day Reliability Breakdown</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Check distribution by status · Last 7 days · Same dataset as latency trend
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
            {(['openai', 'pinecone'] as const).map((svc) => {
              const slices = statusBreakdown[svc];
              const total  = slices.reduce((s, d) => s + d.value, 0);

              const okCount = slices.find((s) => s.name === 'OK')?.value ?? 0;
              const uptimePct = total > 0 ? Math.round((okCount / total) * 100) : null;

              return (
                <div key={svc} className="flex flex-col items-center py-6 px-4 gap-3">
                  <p className="text-sm font-medium text-foreground capitalize">{svc}</p>

                  {trendLoading ? (
                    <Skeleton className="h-[160px] w-[160px] rounded-full" />
                  ) : slices.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 h-[160px] justify-center text-muted-foreground">
                      <Activity className="h-6 w-6 opacity-30" />
                      <p className="text-xs">No data</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width={200} height={180}>
                      <PieChart>
                        <Pie
                          data={slices}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={78}
                          paddingAngle={slices.length > 1 ? 2 : 0}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {slices.map((entry, idx) => (
                            <Cell key={idx} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: 'hsl(var(--foreground))',
                          }}
                          formatter={(value: number, name: string) => [
                            `${value} checks (${total > 0 ? Math.round((value / total) * 100) : 0}%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}

                  {uptimePct !== null && (
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      {uptimePct}%
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">uptime</span>
                    </p>
                  )}

                  {slices.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
                      {slices.map((s) => (
                        <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          {s.name}
                          <span className="ml-0.5 text-foreground font-medium">{s.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* History Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table header row */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-foreground">Check History</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totalCount > 0
                  ? `${totalCount.toLocaleString()} total checks · 25 rows per page · Manual refresh`
                  : '25 rows per page · Manual refresh'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
              onClick={handleRefreshHistory}
              disabled={historyFetching}
              title="Refresh history"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${historyFetching ? 'animate-spin' : ''}`}
              />
              <span className="text-xs">Refresh</span>
            </Button>
          </div>

          {historyLoading ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
              <Activity className="h-8 w-8 opacity-30" />
              <p className="text-sm">No health checks recorded yet.</p>
              <p className="text-xs">Click "Run Check Now" to capture the first snapshot.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Time
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Service
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Latency
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        HTTP
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Error
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          <span title={row.checked_at}>
                            {format(new Date(row.checked_at), 'MMM d, HH:mm:ss')}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className="font-medium text-foreground capitalize">
                            {row.service}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {row.latency_ms != null ? `${row.latency_ms}ms` : '—'}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {row.http_status ?? '—'}
                        </td>
                        <td className="px-5 py-3 text-xs text-destructive max-w-xs truncate">
                          {row.error_message ?? (
                            <span className="text-muted-foreground/50">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div className="px-5 py-3 border-t border-border flex items-center justify-between gap-4 bg-muted/20">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={page === 0 || historyFetching}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Page{' '}
                  <span className="font-medium text-foreground">{page + 1}</span>
                  {' '}of{' '}
                  <span className="font-medium text-foreground">{totalPages}</span>
                  {totalCount > 0 && (
                    <span className="ml-1 text-muted-foreground/70">
                      · {totalCount.toLocaleString()} total
                    </span>
                  )}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={(page + 1) * PAGE_SIZE >= totalCount || historyFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminServiceHealthPage;
