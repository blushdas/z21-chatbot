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
import { AppReadyProvider } from '@/context/AppReadyContext';
import { SourceComparisonProvider } from '@/hooks/useSourceComparison';
import ServiceStatusBanner from '@/components/ServiceStatusBanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import Index from './pages/Index';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AppRoutes() {
  const location = useLocation();
  const prevPathRef = React.useRef<string>(location.pathname);
  React.useEffect(() => {
    try {
      sessionStorage.setItem('previousPath', prevPathRef.current);
      prevPathRef.current = location.pathname;
    } catch (error) {
      // silently ignore
    }
  }, [location.pathname]);

  return (
    <ErrorBoundary>
      {/* AppReadyProvider must be INSIDE AuthProvider — it calls useAuth() */}
      <AppReadyProvider>
        <BrandProvider>
          <AuthProvider>
            <SupabaseHealthProvider>
              <FavoritesProvider>
                <ChatFavoritesProvider>
                  <FolderProvider>
                    <ChatManagementProvider>
                      <CitationVisibilityProvider>
                        <SidebarProvider>
                          <SourceDrawerProvider>
                            <SourceComparisonProvider>
                              <TourProvider>
                                <ServiceStatusBanner />
                                <Routes>
                                  <Route path="/" element={<Index />} />
                                  <Route path="/landing" element={<LandingPage />} />
                                  <Route path="/chat" element={<Index />} />
                                  <Route path="/chat/:chatId" element={<Index />} />
                                  <Route path="/auth" element={<AuthPage />} />
                                  <Route path="*" element={<NotFound />} />
                                </Routes>
                              </TourProvider>
                            </SourceComparisonProvider>
                          </SourceDrawerProvider>
                        </SidebarProvider>
                      </CitationVisibilityProvider>
                    </ChatManagementProvider>
                  </FolderProvider>
                </ChatFavoritesProvider>
              </FavoritesProvider>
            </SupabaseHealthProvider>
          </AuthProvider>
        </BrandProvider>
      </AppReadyProvider>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="z21-theme-v1">
        <Router>
          <AppRoutes />
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
