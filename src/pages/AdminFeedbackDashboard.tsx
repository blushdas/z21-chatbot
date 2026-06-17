
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';
import BackToAdminButton from '@/components/admin/BackToAdminButton';
import { FeedbackDashboardHeader } from '@/components/admin/feedback/FeedbackDashboardHeader';
import { FeedbackMetricsCards } from '@/components/admin/feedback/FeedbackMetricsCards';
import { FeedbackTabsList } from '@/components/admin/feedback/FeedbackTabsList';
import { FeedbackSearchControls } from '@/components/admin/feedback/FeedbackSearchControls';
import { FeedbackTableContainer } from '@/components/admin/feedback/FeedbackTableContainer';
import FeedbackDetailModal from '@/components/admin/feedback/FeedbackDetailModal';
import GeneralFeedbackSection from '@/components/admin/feedback/GeneralFeedbackSection';
import ChatViewer from '@/components/admin/ChatViewer';
import { useFeedbackDashboard } from '@/hooks/useFeedbackDashboard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Users, MessageSquare, MessageSquarePlus, AlertCircle, RefreshCw } from 'lucide-react';

interface FeedbackEntry {
  id: string;
  user_id: string | null;
  chat_id: string | null;
  message_id: string;
  role: string | null;
  original_message: string | null;
  edited_message: string | null;
  length_preference: string | null;
  rating: string | null;
  comment: string | null;
  created_at: string;
  profiles?: {
    name: string | null;
    id: string;
  } | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  feedbackCount: number;
}

const AdminFeedbackDashboard: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    handleSort,
    isLoading,
    isError,
    error: feedbackError,
    refetch: refetchFeedback,
    metrics,
    tabCounts,
    filteredFeedback,
    allFilteredFeedback,
    currentPage,
    totalPages,
    itemsPerPage,
    totalItems,
    startIndex,
    endIndex,
    handlePageChange,
    handleItemsPerPageChange,
    exportCSV
  } = useFeedbackDashboard();

  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [userSortBy, setUserSortBy] = useState<string>('name_asc');
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const { toast } = useToast();

  // Surface list-load errors with a toast (once per error instance)
  useEffect(() => {
    if (!isError || !feedbackError) return;
    const msg = feedbackError instanceof Error ? feedbackError.message : String(feedbackError);
    toast({
      title: 'Could not load feedback',
      description: /network|fetch/i.test(msg)
        ? 'Network issue while loading feedback. Check your connection and try again.'
        : /permission|rls|policy/i.test(msg)
          ? "You don't have permission to view feedback. Sign in as an admin."
          : `Something went wrong (${msg}).`,
      variant: 'destructive',
    });
  }, [isError, feedbackError, toast]);

  // Fetch all users for user selection with feedback counts
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users-for-feedback'],
    queryFn: async () => {
      const [profilesResponse, feedbackResponse] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, name, email')
          .order('name'),
        supabase
          .from('feedback_logs')
          .select('user_id')
      ]);

      if (profilesResponse.error) throw profilesResponse.error;
      if (feedbackResponse.error) throw feedbackResponse.error;

      // Count feedback per user
      const feedbackCounts = feedbackResponse.data.reduce((acc, feedback) => {
        if (feedback.user_id) {
          acc[feedback.user_id] = (acc[feedback.user_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      return profilesResponse.data.map(user => ({
        ...user,
        feedbackCount: feedbackCounts[user.id] || 0
      }));
    }
  });

  // Filter feedback by selected user (use allFilteredFeedback for user stats)
  const userFilteredAllFeedback = selectedUserId && selectedUserId !== 'all'
    ? allFilteredFeedback.filter(feedback => feedback.user_id === selectedUserId)
    : allFilteredFeedback;
  
  const userFilteredFeedback = selectedUserId && selectedUserId !== 'all'
    ? filteredFeedback.filter(feedback => feedback.user_id === selectedUserId)
    : filteredFeedback;

  // Sort users based on userSortBy
  const sortedUsers = [...users].sort((a, b) => {
    switch (userSortBy) {
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'feedback_count_desc':
        return b.feedbackCount - a.feedbackCount;
      case 'feedback_count_asc':
        return a.feedbackCount - b.feedbackCount;
      case 'name_asc':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const selectedUser = sortedUsers.find(u => u.id === selectedUserId);

  // Calculate user-specific stats when a user is selected (use all filtered data for stats)
  const userStats = selectedUserId && selectedUserId !== 'all' ? {
    total: userFilteredAllFeedback.length,
    thumbsUp: userFilteredAllFeedback.filter(f => f.rating === 'thumbs_up').length,
    thumbsDown: userFilteredAllFeedback.filter(f => f.rating === 'thumbs_down').length,
    edits: userFilteredAllFeedback.filter(f => f.edited_message).length,
  } : null;

  const onSelectFeedback = async (id: string) => {
    try {
      setLoadingDetail(true);
      console.log('Fetching feedback details for ID:', id);
      
      const { data, error } = await supabase
        .from('feedback_logs')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching feedback details:', error);
        const code = (error as any).code as string | undefined;
        const friendly =
          code === 'PGRST301' || /permission/i.test(error.message)
            ? "You don't have permission to view this feedback entry."
            : /network|fetch|failed to fetch/i.test(error.message)
              ? 'Network issue while loading feedback. Check your connection and try again.'
              : `Couldn't load feedback details (${error.message}).`;
        toast({
          title: 'Unable to load feedback',
          description: friendly,
          variant: "destructive"
        });
        return;
      }

      if (!data) {
        toast({
          title: 'Feedback not found',
          description: 'This feedback entry no longer exists. It may have been deleted.',
          variant: 'destructive',
        });
        return;
      }

      console.log('Fetched feedback details:', data);

      // Separately fetch the profile (feedback_logs.user_id FK points to auth.users,
      // so PostgREST cannot embed profiles through it).
      let profilesData: { id: string; name: string | null } | null = null;
      if (data.user_id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', data.user_id)
          .maybeSingle();
        if (profileError) {
          console.warn('Could not load profile for feedback author:', profileError);
        }
        if (profile) profilesData = { id: profile.id, name: profile.name };
      }

      const feedbackData: FeedbackEntry = {
        ...(data as any),
        profiles: profilesData
      };
      setSelectedFeedback(feedbackData);
      setDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching feedback details:', error);
      const msg = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Unable to load feedback',
        description: /network|fetch/i.test(msg)
          ? 'Network issue while loading feedback. Check your connection and try again.'
          : `Something went wrong while loading this feedback entry (${msg}).`,
        variant: "destructive"
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseModal = () => {
    setDetailModalOpen(false);
    setSelectedFeedback(null);
  };

  const handleViewChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setChatModalOpen(true);
  };

  const handleCloseChatModal = () => {
    setChatModalOpen(false);
    setSelectedChatId(null);
  };

  return (
    <AdminLayout>
      <BackToAdminButton />
      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/admin" className="hover:text-brand-blue dark:text-foreground">Admin Dashboard</Link>
            <span>/</span>
            <span className="text-brand-blue dark:text-foreground font-medium">Feedback Dashboard</span>
          </div>

          <div className="space-y-8">
            <FeedbackDashboardHeader onExportCSV={exportCSV} />
            
            {/* Top-level tabs for Chat vs General Feedback */}
            <Tabs defaultValue="chat" className="space-y-6">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Chat Feedback
                </TabsTrigger>
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4" />
                  General Feedback
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="chat" className="space-y-6">
                {/* User Selection Filter */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Filter by User
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-4 items-center">
                      <div className="flex-1">
                        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="All users (view overall feedback)" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            {sortedUsers.map(user => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name} ({user.email}) - {user.feedbackCount} feedback
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {selectedUser && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {selectedUser.name}
                        </Badge>
                      )}
                      {usersLoading && <div className="text-sm text-muted-foreground">Loading users...</div>}
                    </div>
                  </CardContent>
                </Card>

                {/* Show user-specific stats when a user is selected */}
                {selectedUser && userStats && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="w-5 h-5" />
                        {selectedUser.name}'s Feedback Statistics
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-brand-blue dark:text-foreground">{userStats.total}</div>
                          <div className="text-sm text-muted-foreground">Total Feedback</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">{userStats.thumbsUp}</div>
                          <div className="text-sm text-muted-foreground">Positive</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">{userStats.thumbsDown}</div>
                          <div className="text-sm text-muted-foreground">Negative</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-600">{userStats.edits}</div>
                          <div className="text-sm text-muted-foreground">Edits</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Show overall satisfaction rate when no specific user is selected */}
                {selectedUserId === 'all' && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm text-muted-foreground">Satisfaction Rate</div>
                          <div className="text-3xl font-bold text-brand-blue dark:text-foreground">
                            {(() => {
                              const total = metrics.thumbsUp + metrics.thumbsDown;
                              if (total === 0) return 0;
                              return Math.round((metrics.thumbsUp / total) * 100);
                            })()}%
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          Based on {metrics.thumbsUp + metrics.thumbsDown} ratings
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <FeedbackTabsList 
                    tabCounts={tabCounts}
                  />
                  
                  <FeedbackSearchControls
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                    userSortBy={userSortBy}
                    setUserSortBy={setUserSortBy}
                  />

                  {isError && (
                    <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="font-medium">We couldn't load feedback entries.</div>
                        <div className="text-destructive/80 mt-1">
                          {feedbackError instanceof Error ? feedbackError.message : 'Unknown error'}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetchFeedback()}
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Retry
                      </Button>
                    </div>
                  )}

                  <FeedbackTableContainer
                    filteredFeedback={userFilteredFeedback}
                    isLoading={isLoading}
                    onSelectFeedback={onSelectFeedback}
                    onViewChat={handleViewChat}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    itemsPerPage={itemsPerPage}
                    totalItems={selectedUserId && selectedUserId !== 'all' ? userFilteredAllFeedback.length : totalItems}
                    startIndex={startIndex}
                    endIndex={endIndex}
                    onPageChange={handlePageChange}
                    onItemsPerPageChange={handleItemsPerPageChange}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                  />
                </Tabs>
              </TabsContent>
              
              <TabsContent value="general">
                <GeneralFeedbackSection />
              </TabsContent>
            </Tabs>
          </div>

          <FeedbackDetailModal
            feedback={selectedFeedback}
            isOpen={detailModalOpen}
            onClose={handleCloseModal}
          />

          <Dialog open={chatModalOpen} onOpenChange={setChatModalOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Chat Details</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-hidden">
                <ChatViewer chatId={selectedChatId} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
    </AdminLayout>
  );
};

export default AdminFeedbackDashboard;
