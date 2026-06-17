import { lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LandingPage from "@/pages/LandingPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="z21-theme-v1">
        <Router>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                {/* Chat app — coming soon */}
                <Route
                  path="/chat"
                  element={
                    <div className="flex items-center justify-center h-[60vh]">
                      <p className="text-muted-foreground text-sm uppercase tracking-widest">
                        Chat — coming soon
                      </p>
                    </div>
                  }
                />
                <Route
                  path="/faq"
                  element={
                    <div className="flex items-center justify-center h-[60vh]">
                      <p className="text-muted-foreground text-sm uppercase tracking-widest">
                        FAQ — coming soon
                      </p>
                    </div>
                  }
                />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
