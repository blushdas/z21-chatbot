import React, { useMemo } from 'react';
import { 
  Users, 
  MessageSquare, 
  BarChart3, 
  Shield,
  TrendingUp,
  Activity,
  Database,
  Globe,
  Tag,
  Flag,
  Settings,
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Paintbrush,
  Compass
} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import FeatureCard from '@/components/admin/FeatureCard';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

interface ServiceHealthRow {
  service: string;
  status: string;
  checked_at: string;
  latency_ms: number | null;
}

const STATUS_DOT: Record<string, string> = {
  ok: 'bg-green-500',
  degraded: 'bg-yellow-500',
  down: 'bg-destructive',
};

function ServiceStatusFooter() {
  const { data: healthRows = [] } = useQuery<ServiceHealthRow[]>({
    queryKey: ['admin-dashboard-service-health'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('service_health')
        .select('service, status, checked_at, latency_ms')
        .order('checked_at', { ascending: false })
        .limit(10);
      if (error) return [];
      // Distinct on service — keep most recent per service
      const seen = new Set<string>();
      return (data as ServiceHealthRow[]).filter((r) => {
        if (seen.has(r.service)) return false;
        seen.add(r.service);
        return true;
      });
    },
    refetchInterval: 60_000,
  });

  const latestChecked = healthRows.length > 0
    ? healthRows.reduce((a, b) => a.checked_at > b.checked_at ? a : b).checked_at
    : null;

  const services = healthRows.length > 0
    ? healthRows
    : [
        { service: 'openai', status: 'unknown', checked_at: '', latency_ms: null },
        { service: 'pinecone', status: 'unknown', checked_at: '', latency_ms: null },
      ];

  return (
    <div className="mt-auto pt-8 border-t border-border">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          to="/admin/service-health"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">System Status</span>
        </Link>
        <div className="flex flex-wrap items-center gap-4 md:gap-6">
          {services.map((svc) => (
            <div key={svc.service} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${STATUS_DOT[svc.status] ?? 'bg-muted-foreground'}`} />
              <span className="text-xs text-muted-foreground capitalize">
                {svc.service}
                {svc.status !== 'unknown' && ` · ${svc.status}`}
                {svc.latency_ms != null && ` (${svc.latency_ms}ms)`}
              </span>
            </div>
          ))}
          <span className="text-xs text-muted-foreground/70">
            {latestChecked
              ? `Last check: ${formatDistanceToNow(new Date(latestChecked), { addSuffix: true })}`
              : 'No checks yet'}
          </span>
        </div>
      </div>
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const isSuperAdmin = profile?.role === 'superadmin';

  // Fetch counts
  const { data: counts = { users: 0, chats: 0, feedback: 0, knowledge: 0 }, isLoading: countsLoading } = useQuery({
    queryKey: ['admin-dashboard-counts'],
    queryFn: async () => {
      const [usersRes, chatsRes, feedbackRes, knowledgeRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('chats').select('*', { count: 'exact', head: true }),
        supabase.from('feedback_logs').select('*', { count: 'exact', head: true }),
        supabase.from('knowledge_sources').select('*', { count: 'exact', head: true }),
      ]);
      return {
        users: usersRes.count || 0,
        chats: chatsRes.count || 0,
        feedback: feedbackRes.count || 0,
        knowledge: knowledgeRes.count || 0,
      };
    },
    refetchInterval: 15000,
  });

  // Pending safety flags count
  const { data: pendingFlags = 0 } = useQuery<number>({
    queryKey: ['admin-dashboard-pending-flags'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('chat_safety_flags')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      if (error) return 0;
      return count ?? 0;
    },
    refetchInterval: 30000,
  });

  // Fetch 7-day metrics for sparklines
  const { data: sparklineData } = useQuery({
    queryKey: ['admin-sparkline-data'],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Get daily counts for each metric
      const [usersData, chatsData, feedbackData] = await Promise.all([
        supabase
          .from('profiles')
          .select('created_at')
          .gte('created_at', sevenDaysAgo.toISOString()),
        supabase
          .from('chats')
          .select('created_at')
          .gte('created_at', sevenDaysAgo.toISOString()),
        supabase
          .from('feedback_logs')
          .select('created_at')
          .gte('created_at', sevenDaysAgo.toISOString()),
      ]);

      // Group by day
      const groupByDay = (data: { created_at: string | null }[]) => {
        const days: number[] = [0, 0, 0, 0, 0, 0, 0];
        data?.forEach((item) => {
          if (item.created_at) {
            const date = new Date(item.created_at);
            const dayIndex = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
            if (dayIndex >= 0 && dayIndex < 7) {
              days[6 - dayIndex]++;
            }
          }
        });
        return days;
      };

      return {
        users: groupByDay(usersData.data || []),
        chats: groupByDay(chatsData.data || []),
        feedback: groupByDay(feedbackData.data || []),
      };
    },
    refetchInterval: 60000,
  });

  // Featured cards (large, with sparklines)
  const featuredCards = useMemo(() => [
    {
      title: 'Users',
      description: 'Manage users, roles, and permissions',
      icon: Users,
      link: '/admin/users',
      color: 'text-accent',
      count: counts.users,
      sparklineData: sparklineData?.users,
      requiresSuperAdmin: true,
      actionLabel: 'Manage Users',
    },
    {
      title: 'Feedback',
      description: 'View and analyze user feedback',
      icon: MessageSquare,
      link: '/admin/feedback',
      color: 'text-accent',
      count: counts.feedback,
      sparklineData: sparklineData?.feedback,
      requiresSuperAdmin: true,
      actionLabel: 'View Feedback',
    },
    {
      title: 'Chats',
      description: 'Monitor chat interactions',
      icon: BarChart3,
      link: '/admin/chats',
      color: 'text-accent',
      count: counts.chats,
      sparklineData: sparklineData?.chats,
      requiresSuperAdmin: true,
      actionLabel: 'View Chats',
    },
    {
      title: 'Knowledge Base',
      description: 'Manage documents and sources',
      icon: Database,
      link: '/admin/knowledge',
      color: 'text-accent',
      count: counts.knowledge,
      requiresSuperAdmin: false,
      actionLabel: 'Manage Knowledge',
    },
    {
      title: 'Security Center',
      description: 'Monitor security and access',
      icon: Shield,
      link: '/admin/security',
      color: 'text-accent',
      requiresSuperAdmin: true,
      actionLabel: 'View Security',
    },
    {
      title: 'Safety Flags',
      description: 'Review AI-flagged conversations',
      icon: Flag,
      link: '/admin/safety',
      color: 'text-accent',
      count: pendingFlags,
      requiresSuperAdmin: true,
      actionLabel: 'Review Flags',
    },
    {
      title: 'Analytics',
      description: 'Visualize system patterns',
      icon: TrendingUp,
      link: '/admin/analytics',
      color: 'text-accent',
      requiresSuperAdmin: true,
      actionLabel: 'View Analytics',
    },
  ], [counts, sparklineData, pendingFlags]);

  // Secondary cards (smaller, no sparklines)
  const secondaryCards = useMemo(() => [
    {
      title: 'Email Domains',
      description: 'Manage allowed domains',
      icon: Globe,
      link: '/admin/domains',
      color: 'text-accent',
      requiresSuperAdmin: true,
      actionLabel: 'Manage',
    },
    {
      title: 'White-Label',
      description: 'Manage demo brand themes',
      icon: Paintbrush,
      link: '/admin/white-label',
      color: 'text-accent',
      requiresSuperAdmin: true,
      actionLabel: 'Configure',
    },
    {
      title: 'ALIGN Sessions',
      description: 'Audit discovery sessions & reports',
      icon: Compass,
      link: '/admin/align',
      color: 'text-accent',
      requiresSuperAdmin: false,
      actionLabel: 'Open',
    },
  ], []);

  const visibleFeaturedCards = featuredCards.filter(
    (card) => !card.requiresSuperAdmin || isSuperAdmin
  );

  const visibleSecondaryCards = secondaryCards.filter(
    (card) => !card.requiresSuperAdmin || isSuperAdmin
  );

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {profile?.name || 'Admin'}
            {isSuperAdmin && (
              <span className="ml-2 text-accent font-semibold">(Super Admin)</span>
            )}
          </p>
        </div>

        {/* Featured Cards Grid */}
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Main Features
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {visibleFeaturedCards.map((card) => (
              <FeatureCard
                key={card.link}
                title={card.title}
                description={card.description}
                icon={card.icon}
                link={card.link}
                color={card.color}
                count={card.count}
                sparklineData={card.sparklineData}
                variant="featured"
                actionLabel={card.actionLabel}
                isLoading={countsLoading}
              />
            ))}
          </div>
        </div>

        {/* Secondary Cards Grid */}
        {visibleSecondaryCards.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Configuration & Tools
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {visibleSecondaryCards.map((card) => (
                <FeatureCard
                  key={card.link}
                  title={card.title}
                  description={card.description}
                  icon={card.icon}
                  link={card.link}
                  color={card.color}
                  variant="secondary"
                  actionLabel={card.actionLabel}
                />
              ))}
            </div>
          </div>
        )}

        {/* System Status Footer */}
        <ServiceStatusFooter />
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
