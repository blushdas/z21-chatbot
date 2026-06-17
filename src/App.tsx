
import React, { lazy, Suspense } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { AuthProvider } from '@/context/SupabaseAuthContext';
import { FavoritesProvider } from '@/context/FavoritesContext';
import { ChatFavoritesProvider } from '@/context/ChatFavoritesContext';
import { FolderProvider } from '@/context/FolderContext';
import { SourceDrawerProvider } from '@/hooks/useSourceDrawer';
import { CitationVisibilityProvider } from '@/context/CitationVisibilityContext';
import { SidebarProvider } from '@/hooks/useSidebarState';
import { ChatManagementProvider } from '@/context/ChatManagementContext';
import { SupabaseHealthProvider } from '@/context/SupabaseHealthContext';
import { TourProvider } from '@/context/TourContext';
import { BrandProvider } from '@/context/BrandContext';
import TourRunner from '@/components/tour/TourRunner';
import GlobalSidebarRestoreButton from '@/components/GlobalSidebarRestoreButton';
import ProjectChatsConsistencyBadge from '@/components/dev/ProjectChatsConsistencyBadge';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Toaster } from '@/components/ui/sonner';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MonitoringDisclosureModal from '@/components/security/MonitoringDisclosureModal';
import { ScrollToTop } from '@/components/ScrollToTop';
import TruConversionIdentity from '@/components/analytics/TruConversionIdentity';
import { useTrackPageView } from '@/hooks/useTrackPageView';
// TwoFactorEnforcementGuard temporarily disabled
import ServiceStatusBanner from '@/components/ServiceStatusBanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import logger from '@/utils/logger';

import EmailVerificationWrapper from '@/components/auth/EmailVerificationWrapper';
import OnboardingGuard from '@/components/auth/OnboardingGuard';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import SignUpPage from './pages/SignUpPage';
import AuthConfirmationPage from './pages/AuthConfirmationPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import EmailVerifiedPage from './pages/EmailVerifiedPage';
import Setup2FAPage from './pages/Setup2FAPage';
import Setup2FAEmailPage from './pages/Setup2FAEmailPage';
import Setup2FATOTPPage from './pages/Setup2FATOTPPage';
import TwoFactorChallengePage from './pages/TwoFactorChallengePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import OnboardingPage from './pages/OnboardingPage';
import MyProfilePage from './pages/MyProfilePage';
import NotFound from './pages/NotFound';
import DualChatPage from './pages/DualChatPage';
import FolderDashboardPage from './pages/FolderDashboardPage';
import AlignLandingPage from './pages/align/AlignLandingPage';
import AlignStartPage from './pages/align/AlignStartPage';
import AlignSessionPage from './pages/align/AlignSessionPage';
import AlignReportPage from './pages/align/AlignReportPage';
import AlignRespondentPage from './pages/align/AlignRespondentPage';
import AlignPublicReportPage from './pages/align/AlignPublicReportPage';
import AllProjectsPage from './pages/AllProjectsPage';
import InviteAcceptPage from './pages/InviteAcceptPage';
import CanvasPage from './pages/CanvasPage';
import FavoritesPage from './pages/FavoritesPage';
import LandingPage from './pages/LandingPage';
import WhyDarylePage from './pages/WhyDarylePage';
import BetaConfirmationPage from './pages/BetaConfirmationPage';
import RoadmapPage from './pages/RoadmapPage';
import FAQPage from './pages/FAQPage';
import ContactPage from './pages/ContactPage';
import { useAuth } from './context/SupabaseAuthContext';
import AmbassadorWayPitchPage from './pages/AmbassadorWayPitchPage';

// Lazy load admin pages for better performance
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminUsersPage = lazy(() => import('./pages/AdminUsersPage'));
const AdminDomainsPage = lazy(() => import('./pages/AdminDomainsPage'));
const AdminFeedbackDashboard = lazy(() => import('./pages/AdminFeedbackDashboard'));
const AdminChatsPage = lazy(() => import('./pages/AdminChatsPage'));
const AdminSecurityCenterPage = lazy(() => import('./pages/AdminSecurityCenterPage'));
const AdminAuditLogPage = lazy(() => import('./pages/AdminAuditLogPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/AdminAnalyticsPage')); 
const AdminDualResponseAnalytics = lazy(() => import('./pages/AdminDualResponseAnalytics'));
const AdminKnowledgePage = lazy(() => import('./pages/AdminKnowledgePage'));
const AdminSecuritySettingsPage = lazy(() => import('./pages/AdminSecuritySettingsPage'));
const ConstructsPage = lazy(() => import('./pages/ConstructsPage'));
const CreateConstructPage = lazy(() => import('./pages/CreateConstructPage'));
const EditConstructPage = lazy(() => import('./pages/EditConstructPage'));
const AdminBenchmarkPage = lazy(() => import('./pages/AdminBenchmarkPage'));
const AdminServiceHealthPage = lazy(() => import('./pages/AdminServiceHealthPage'));
const VerificationModePage = lazy(() => import('./pages/VerificationModePage'));
const AdminFlagsPage = lazy(() => import('./pages/AdminFlagsPage'));
const AdminNotificationsPage = lazy(() => import('./pages/AdminNotificationsPage'));
const AdminWhiteLabelPage = lazy(() => import('./pages/AdminWhiteLabelPage'));
const AdminAlignListPage = lazy(() => import('./pages/admin/AdminAlignListPage'));
const AdminAlignDetailPage = lazy(() => import('./pages/admin/AdminAlignDetailPage'));



// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const RootRoute = () => {
  const { user, loading, pending2FA } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (pending2FA) {
    return <Navigate to="/auth/2fa-challenge" replace />;
  }

  if (user) {
    return <Navigate to="/chat" replace />;
  }
  
  return <Navigate to="/landing" replace />;
};

function AppRoutes() {
  // Add test route for email verification
  const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('lovableproject.com');

  // Track previous route so destination pages can know where the user came from
  const location = useLocation();
  const prevPathRef = React.useRef<string>(location.pathname);
  useTrackPageView();
  React.useEffect(() => {
    try {
      sessionStorage.setItem('previousPath', prevPathRef.current);
      prevPathRef.current = location.pathname;
    } catch (error) {
      logger.warn('Failed to persist previous path', error);
    }
  }, [location.pathname]);

  return (
      <>
      <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/align" element={<AlignLandingPage />} />
      <Route path="/align/start" element={<AlignStartPage />} />
      <Route path="/align/s/:token" element={<AlignSessionPage />} />
      <Route path="/align/s/:token/report" element={<AlignReportPage />} />
      <Route path="/align/r/:token" element={<AlignRespondentPage />} />
      <Route path="/align/p/:token" element={<AlignPublicReportPage />} />
      <Route path="/why" element={<WhyDarylePage />} />
      <Route path="/why-daryle" element={<WhyDarylePage />} />
      <Route path="/roadmap" element={<RoadmapPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/beta-confirmation" element={<BetaConfirmationPage />} />
      <Route path="/pitch/ambassadorway" element={<AmbassadorWayPitchPage />} />
      <Route path="/chat" element={<OnboardingGuard><EmailVerificationWrapper><Index /></EmailVerificationWrapper></OnboardingGuard>} />
      <Route path="/chat/:chatId" element={<OnboardingGuard><EmailVerificationWrapper><Index /></EmailVerificationWrapper></OnboardingGuard>} />
      <Route path="/favorites" element={<OnboardingGuard><EmailVerificationWrapper><FavoritesPage /></EmailVerificationWrapper></OnboardingGuard>} />
      <Route path="/canvas/:canvasId" element={<OnboardingGuard><EmailVerificationWrapper><CanvasPage /></EmailVerificationWrapper></OnboardingGuard>} />
      <Route path="/dual-chat" element={<OnboardingGuard><EmailVerificationWrapper><DualChatPage /></EmailVerificationWrapper></OnboardingGuard>} />
      <Route path="/profile" element={<OnboardingGuard><EmailVerificationWrapper><MyProfilePage /></EmailVerificationWrapper></OnboardingGuard>} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/auth/confirmation" element={<AuthConfirmationPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsOfServicePage />} />
      <Route path="/auth/email-verified" element={<EmailVerifiedPage />} />
      <Route path="/auth/setup-2fa" element={<Setup2FAPage />} />
      <Route path="/auth/setup-2fa/email" element={<Setup2FAEmailPage />} />
      <Route path="/auth/setup-2fa/totp" element={<Setup2FATOTPPage />} />
      <Route path="/auth/2fa-challenge" element={<TwoFactorChallengePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/onboarding" element={<EmailVerificationWrapper><OnboardingPage /></EmailVerificationWrapper>} />
      
      <Route path="/profile/preferences" element={<MyProfilePage />} />
      <Route path="/profile/favorites" element={<MyProfilePage />} />
      <Route path="/profile/feedback" element={<MyProfilePage />} />
      <Route path="/profile/delete" element={<MyProfilePage />} />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute requiredRole="superadmin">
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
              <AdminDashboard />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/users" 
        element={
          <ProtectedRoute requiredRole="superadmin">
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
              <AdminUsersPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/domains" 
        element={
          <ProtectedRoute requiredRole="superadmin">
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
              <AdminDomainsPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/feedback"
        element={
          <ProtectedRoute requiredRole="superadmin">
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
              <AdminFeedbackDashboard />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/chats" 
        element={
          <ProtectedRoute requiredRole="superadmin">
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
              <AdminChatsPage />
            </Suspense>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/security" 
        element={
          <ProtectedRoute requiredRole="superadmin">
            <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
              <AdminSecurityCenterPage />
            </Suspense>
          </ProtectedRoute>
         } 
       />
       <Route 
         path="/admin/audit-log" 
         element={
           <ProtectedRoute requiredRole="admin">
             <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
               <AdminAuditLogPage />
             </Suspense>
           </ProtectedRoute>
         } 
       />
       <Route 
         path="/admin/analytics" 
         element={
           <ProtectedRoute requiredRole="superadmin">
             <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
               <AdminAnalyticsPage />
             </Suspense>
           </ProtectedRoute>
         } 
        />
        <Route 
          path="/admin/security-settings" 
          element={
            <ProtectedRoute requiredRole="superadmin">
              <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                <AdminSecuritySettingsPage />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route
          path="/admin/dual-response-analytics" 
          element={
            <ProtectedRoute requiredRole="superadmin">
              <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                <AdminDualResponseAnalytics />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/knowledge" 
          element={
            <ProtectedRoute requiredRole="admin">
              <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                <AdminKnowledgePage />
              </Suspense>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/constructs" 
          element={
            <OnboardingGuard>
              <EmailVerificationWrapper>
                <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                  <ConstructsPage />
                </Suspense>
              </EmailVerificationWrapper>
            </OnboardingGuard>
          } 
        />
        <Route 
          path="/constructs/new" 
          element={
            <OnboardingGuard>
              <EmailVerificationWrapper>
                <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                  <CreateConstructPage />
                </Suspense>
              </EmailVerificationWrapper>
            </OnboardingGuard>
          } 
        />
        <Route 
          path="/constructs/:slug" 
          element={
            <OnboardingGuard>
              <EmailVerificationWrapper>
                <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                  <ConstructsPage />
                </Suspense>
              </EmailVerificationWrapper>
            </OnboardingGuard>
          } 
        />
        <Route 
          path="/constructs/:slug/edit" 
          element={
            <OnboardingGuard>
              <EmailVerificationWrapper>
                <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                  <EditConstructPage />
                </Suspense>
              </EmailVerificationWrapper>
          </OnboardingGuard>
        } 
        />
         <Route 
           path="/admin/benchmarks" 
           element={
             <ProtectedRoute requiredRole="superadmin">
               <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                 <AdminBenchmarkPage />
               </Suspense>
             </ProtectedRoute>
           } 
         />
         <Route 
           path="/admin/service-health" 
           element={
             <ProtectedRoute requiredRole="superadmin">
               <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                 <AdminServiceHealthPage />
               </Suspense>
             </ProtectedRoute>
           } 
         />
         <Route
           path="/admin/verification-mode"
           element={
             <ProtectedRoute requiredRole="superadmin">
               <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                 <VerificationModePage />
               </Suspense>
             </ProtectedRoute>
           }
         />
         <Route
           path="/admin/notifications"
           element={
             <ProtectedRoute requiredRole="superadmin">
               <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                 <AdminNotificationsPage />
               </Suspense>
             </ProtectedRoute>
           }
         />
         <Route
           path="/admin/safety"
           element={
             <ProtectedRoute requiredRole="superadmin">
               <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                 <AdminFlagsPage />
               </Suspense>
             </ProtectedRoute>
           }
         />
         <Route
           path="/admin/white-label"
           element={
             <ProtectedRoute requiredRole="superadmin">
               <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                 <AdminWhiteLabelPage />
               </Suspense>
             </ProtectedRoute>
           }
         />
          <Route
            path="/admin/align"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                  <AdminAlignListPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/align/:id"
            element={
              <ProtectedRoute requiredRole="admin">
                <Suspense fallback={<div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
                  <AdminAlignDetailPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
      <Route path="/folder/:folderId" element={<OnboardingGuard><EmailVerificationWrapper><FolderDashboardPage /></EmailVerificationWrapper></OnboardingGuard>} />
      <Route path="/projects" element={<OnboardingGuard><EmailVerificationWrapper><AllProjectsPage /></EmailVerificationWrapper></OnboardingGuard>} />
      <Route path="/invite/:token" element={<EmailVerificationWrapper><InviteAcceptPage /></EmailVerificationWrapper>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <ProjectChatsConsistencyBadge />
      </>
  );
}

function App() {
  // Provider hierarchy: Auth > Health > ChatManagement > Sidebar > Favorites > Folder > Source > Citation
  return (
     <ThemeProvider defaultTheme="light" storageKey="daryle-theme-v3">
     <ErrorBoundary>
       <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <AuthProvider>
          <SupabaseHealthProvider>
            <BrandProvider>
            <TruConversionIdentity />
            <div className="flex min-h-screen flex-col">
              <ServiceStatusBanner />
              <div className="flex-1 min-h-0 flex flex-col">
            <ChatManagementProvider>
              <SidebarProvider>
                <FavoritesProvider>
                  <ChatFavoritesProvider>
                    <FolderProvider>
                    <SourceDrawerProvider>
                      <CitationVisibilityProvider>
                        <TourProvider>
                          <AppRoutes />
                          <TourRunner />
                          <GlobalSidebarRestoreButton />
                          <MonitoringDisclosureModal />
                        </TourProvider>
                        <ToastContainer position="bottom-right" autoClose={3000} hideProgressBar />
                        <Toaster richColors />
                        <ShadcnToaster />
                      </CitationVisibilityProvider>
                    </SourceDrawerProvider>
                    </FolderProvider>
                  </ChatFavoritesProvider>
                </FavoritesProvider>
              </SidebarProvider>
            </ChatManagementProvider>
              </div>
            </div>
            </BrandProvider>
          </SupabaseHealthProvider>
        </AuthProvider>
      </Router>
       </QueryClientProvider>
     </ErrorBoundary>
     </ThemeProvider>
  );
}

export default App;
