import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/SupabaseAuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Users, MessageSquare, Star } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AdminAnalyticsPage: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState({
    userGrowth: [],
    chatVolume: [],
    feedbackDistribution: [],
    dailyActiveUsers: [],
    systemPerformance: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user || !profile || profile.role !== 'superadmin') return;

      try {
        setIsLoading(true);

        // Fetch user growth data
        const { data: users } = await supabase
          .from('profiles')
          .select('created_at')
          .order('created_at');

        // Fetch chat volume data
        const { data: chats } = await supabase
          .from('chats')
          .select('created_at, mode')
          .order('created_at');

        // Fetch feedback data
        const { data: feedback } = await supabase
          .from('feedback_logs')
          .select('rating, created_at');

        // Process user growth data
        const userGrowthData = processUserGrowth(users || []);
        
        // Process chat volume data
        const chatVolumeData = processChatVolume(chats || []);
        
        // Process feedback distribution
        const feedbackDistData = processFeedbackDistribution(feedback || []);
        
        // Generate mock daily active users data
        const dauData = generateDAUData();
        
        // Generate mock system performance data
        const performanceData = generatePerformanceData();

        setAnalyticsData({
          userGrowth: userGrowthData,
          chatVolume: chatVolumeData,
          feedbackDistribution: feedbackDistData,
          dailyActiveUsers: dauData,
          systemPerformance: performanceData
        });
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [user, profile]);

  const processUserGrowth = (users: any[]) => {
    const groupedByMonth = users.reduce((acc, user) => {
      const month = new Date(user.created_at).toISOString().substring(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(groupedByMonth)
      .map(([month, count]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        users: count,
        cumulative: 0
      }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
      .map((item, index, array) => ({
        ...item,
        cumulative: array.slice(0, index + 1).reduce((sum, curr) => sum + (curr.users as number), 0)
      }));
  };

  const processChatVolume = (chats: any[]) => {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayChats = chats.filter(chat => 
        chat.created_at.startsWith(dateStr)
      );
      
      const modeBreakdown = dayChats.reduce((acc, chat) => {
        acc[chat.mode] = (acc[chat.mode] || 0) + 1;
        return acc;
      }, {});

      last7Days.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total: dayChats.length,
        coach: modeBreakdown.coach || 0,
        researcher: modeBreakdown.researcher || 0,
        creative: modeBreakdown.creative || 0
      });
    }
    
    return last7Days;
  };

  const processFeedbackDistribution = (feedback: any[]) => {
    const distribution = feedback.reduce((acc, item) => {
      if (item.rating) {
        acc[item.rating] = (acc[item.rating] || 0) + 1;
      }
      return acc;
    }, {});

    return [
      { name: 'Thumbs Up', value: distribution.thumbs_up || 0, color: '#00C49F' },
      { name: 'Thumbs Down', value: distribution.thumbs_down || 0, color: '#FF8042' },
      { name: 'Neutral', value: distribution.neutral || 0, color: '#FFBB28' }
    ];
  };

  const generateDAUData = () => {
    const data = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        activeUsers: Math.floor(Math.random() * 50) + 20,
        newUsers: Math.floor(Math.random() * 10) + 2
      });
    }
    
    return data;
  };

  const generatePerformanceData = () => {
    const data = [];
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now);
      time.setHours(time.getHours() - i);
      data.push({
        time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        responseTime: Math.floor(Math.random() * 1000) + 200,
        errorRate: Math.random() * 5,
        throughput: Math.floor(Math.random() * 100) + 50
      });
    }
    
    return data;
  };

  // Check authentication
  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || !profile || profile.role !== 'superadmin') {
    navigate('/admin');
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
            <span className="text-brand-blue dark:text-foreground font-medium">Analytics Dashboard</span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Data insights and performance metrics
            </p>
          </div>

          {/* Analytics Tabs */}
          <Tabs defaultValue="growth" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="growth">User Growth</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="feedback">Feedback</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="growth" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      User Growth Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                        <Line type="monotone" dataKey="cumulative" stroke="#82ca9d" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Daily Active Users (30 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analyticsData.dailyActiveUsers}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="activeUsers" stackId="1" stroke="#8884d8" fill="#8884d8" />
                        <Area type="monotone" dataKey="newUsers" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Chat Volume by Mode (Last 7 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={analyticsData.chatVolume}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="coach" stackId="a" fill="#8884d8" />
                      <Bar dataKey="researcher" stackId="a" fill="#82ca9d" />
                      <Bar dataKey="creative" stackId="a" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Feedback Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={analyticsData.feedbackDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analyticsData.feedbackDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Response Time (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.systemPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="responseTime" stroke="#8884d8" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.systemPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="errorRate" stroke="#ff7300" strokeWidth={2} />
                        <Line type="monotone" dataKey="throughput" stroke="#00C49F" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
    </AdminLayout>
  );
};

export default AdminAnalyticsPage;