import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/sonner";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/Welcome";
import AuthPage from "./auth/AuthPage";

const AdminPanel = lazy(() => import("@/components/AdminPanel"));
const SalesInterface = lazy(() => import("@/components/SalesInterface"));
const ProductManagement = lazy(() => import("@/components/ProductManagement"));
const ReportsSection = lazy(() => import("@/components/ReportsSection"));
const CustomerManagement = lazy(() => import("@/components/CustomerManagement"));
const SalesReturns = lazy(() => import("@/components/SalesReturns"));
const CashSessions = lazy(() => import("@/components/CashSessions"));
const DebtManagement = lazy(() => import("@/components/DebtManagement"));
const SettingsPage = lazy(() => import("@/components/SettingsPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

function LoadingSpinner({ text = "جاري التحميل..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">{text}</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const Section = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <MaintenanceGuard>
      <SubscriptionGuard>{children}</SubscriptionGuard>
    </MaintenanceGuard>
  </ProtectedRoute>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/welcome" element={<Welcome />} />
                <Route
                  path="/auth"
                  element={
                    <PublicRoute>
                      <AuthPage />
                    </PublicRoute>
                  }
                />
                <Route element={<Index />}>
                  <Route index element={<Navigate to="/sales" replace />} />
                  <Route
                    path="sales"
                    element={
                      <Section>
                        <Suspense fallback={<LoadingSpinner />}>
                          <SalesInterface />
                        </Suspense>
                      </Section>
                    }
                  />
                  <Route
                    path="debts"
                    element={
                      <Section>
                        <Suspense fallback={<LoadingSpinner />}>
                          <DebtManagement />
                        </Suspense>
                      </Section>
                    }
                  />
                  <Route
                    path="products"
                    element={
                      <Section>
                        <Suspense fallback={<LoadingSpinner />}>
                          <ProductManagement />
                        </Suspense>
                      </Section>
                    }
                  />
                  <Route
                    path="customers"
                    element={
                      <Section>
                        <Suspense fallback={<LoadingSpinner />}>
                          <CustomerManagement />
                        </Suspense>
                      </Section>
                    }
                  />
                  <Route
                    path="sales-invoices"
                    element={<Navigate to="/reports" replace />}
                  />
                  <Route
                    path="sales-returns"
                    element={
                      <Section>
                        <Suspense fallback={<LoadingSpinner />}>
                          <SalesReturns />
                        </Suspense>
                      </Section>
                    }
                  />
                  <Route
                    path="cash-sessions"
                    element={
                      <Section>
                        <Suspense fallback={<LoadingSpinner />}>
                          <CashSessions />
                        </Suspense>
                      </Section>
                    }
                  />
                  <Route
                    path="reports"
                    element={
                      <Section>
                        <Suspense fallback={<LoadingSpinner />}>
                          <ReportsSection />
                        </Suspense>
                      </Section>
                    }
                  />
                  <Route
                    path="settings"
                    element={
                      <Section>
                        <Suspense fallback={<LoadingSpinner />}>
                          <SettingsPage />
                        </Suspense>
                      </Section>
                    }
                  />
                </Route>
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdminPanel />
                      </Suspense>
                    </AdminRoute>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ToastProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
