import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, MessageSquare, Trophy, Brain, Clock } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { format, parseISO, startOfDay, subDays } from 'date-fns';

interface DualResponseLog {
  id: string;
  user_id: string;
  chat_id: string | null;
  message_query: string;
  response_a: string;
  response_b: string;
  user_choice: string;
  model_a: string | null;
  model_b: string | null;
  created_at: string;
}

interface AnalyticsData {
  totalResponses: number;
  modelPreferences: { model: string; count: number; percentage: number }[];
  dailyTrends: { date: string; gpt_wins: number; claude_wins: number; ties: number }[];
  recentChoices: DualResponseLog[];
  topQueries: { query: string; count: number }[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

export default function AdminDualResponseAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // days

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const startDate = subDays(new Date(), timeRange);
      
      // Fetch dual response logs
      const { data: logs, error } = await supabase
        .from('dual_response_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process the data
      const analyticsData = processAnalyticsData(logs || []);
      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (logs: DualResponseLog[]): AnalyticsData => {
    const totalResponses = logs.length;

    // Model preferences
    const gptWins = logs.filter(log => log.user_choice === 'a').length; // GPT 4.1 is response A
    const claudeWins = logs.filter(log => log.user_choice === 'b').length; // Claude is response B
    const ties = logs.filter(log => log.user_choice === 'tie').length;

    const modelPreferences = [
      { model: 'GPT 4.1', count: gptWins, percentage: totalResponses ? (gptWins / totalResponses) * 100 : 0 },
      { model: 'Claude Sonnet 4', count: claudeWins, percentage: totalResponses ? (claudeWins / totalResponses) * 100 : 0 },
      { model: 'Tie', count: ties, percentage: totalResponses ? (ties / totalResponses) * 100 : 0 }
    ];

    // Daily trends
    const dailyTrendsMap = new Map();
    logs.forEach(log => {
      const date = format(startOfDay(parseISO(log.created_at)), 'yyyy-MM-dd');
      if (!dailyTrendsMap.has(date)) {
        dailyTrendsMap.set(date, { date, gpt_wins: 0, claude_wins: 0, ties: 0 });
      }
      const dayData = dailyTrendsMap.get(date);
      if (log.user_choice === 'a') dayData.gpt_wins++;
      else if (log.user_choice === 'b') dayData.claude_wins++;
      else dayData.ties++;
    });

    const dailyTrends = Array.from(dailyTrendsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Top queries
    const queryCount = new Map();
    logs.forEach(log => {
      const query = log.message_query.substring(0, 100); // Truncate for display
      queryCount.set(query, (queryCount.get(query) || 0) + 1);
    });

    const topQueries = Array.from(queryCount.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalResponses,
      modelPreferences,
      dailyTrends,
      recentChoices: logs.slice(0, 20),
      topQueries
    };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">No data available</h2>
          <p className="text-muted-foreground">No dual response data found for the selected time period.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
      <BackToAdminButton />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dual Response Analytics</h1>
          <p className="text-muted-foreground">User preferences between GPT 4.1 and Claude Sonnet 4</p>
        </div>
        <div className="flex gap-2">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 rounded text-sm ${
                timeRange === days 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comparisons</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              User choices between models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPT 4.1 Wins</CardTitle>
            <Trophy className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {data.modelPreferences[0]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.modelPreferences[0]?.percentage.toFixed(1)}% preference
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Claude Wins</CardTitle>
            <Brain className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.modelPreferences[1]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.modelPreferences[1]?.percentage.toFixed(1)}% preference
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ties</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {data.modelPreferences[2]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.modelPreferences[2]?.percentage.toFixed(1)}% tied responses
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="queries">Top Queries</TabsTrigger>
          <TabsTrigger value="recent">Recent Choices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Model Preference Distribution</CardTitle>
                <CardDescription>Which model users prefer overall</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.modelPreferences}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ model, percentage }) => `${model}: ${percentage.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.modelPreferences.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Performance Bar Chart</CardTitle>
                <CardDescription>Head-to-head comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.modelPreferences}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="model" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Preference Trends</CardTitle>
              <CardDescription>How preferences change over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={data.dailyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="gpt_wins" stroke="#3b82f6" name="GPT 4.1 Wins" />
                  <Line type="monotone" dataKey="claude_wins" stroke="#8b5cf6" name="Claude Wins" />
                  <Line type="monotone" dataKey="ties" stroke="#10b981" name="Ties" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Compared Queries</CardTitle>
              <CardDescription>What users ask about most in dual mode</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.topQueries.map((query, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{query.query}...</p>
                    </div>
                    <Badge variant="secondary">{query.count} comparisons</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent User Choices</CardTitle>
              <CardDescription>Latest dual response comparisons</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentChoices.map((choice) => (
                  <div key={choice.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(choice.created_at), 'MMM dd, yyyy HH:mm')}
                        </span>
                      </div>
                      <Badge 
                        variant={
                          choice.user_choice === 'a' ? 'default' : 
                          choice.user_choice === 'b' ? 'secondary' : 
                          'outline'
                        }
                      >
                        {choice.user_choice === 'a' ? 'GPT 4.1' : 
                         choice.user_choice === 'b' ? 'Claude Sonnet 4' : 
                         'Tie'}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium">
                      Query: {choice.message_query.substring(0, 150)}...
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AdminLayout>
  );
}