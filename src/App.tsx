import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/sonner";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "./pages/NotFound";

const MaintenanceGuard = lazy(() => import("@/components/MaintenanceGuard"));
const Index = lazy(() => import("./pages/Index"));

const Welcome = lazy(() => import("./pages/Welcome"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Disclaimer = lazy(() => import("./pages/Disclaimer"));
const CookiePolicy = lazy(() => import("./pages/CookiePolicy"));
const AcceptableUsePolicy = lazy(() => import("./pages/AcceptableUsePolicy"));
const Pricing = lazy(() => import("./pages/Pricing"));
const AuthPage = lazy(() => import("./auth/AuthPage"));
const AdminPage = lazy(() => import("@/components/AdminPage"));
const SalesInterface = lazy(() => import("@/components/SalesInterface"));
const ProductManagement = lazy(() => import("@/components/ProductManagement"));
const ReportsSection = lazy(() => import("@/components/ReportsSection"));
const CustomerManagement = lazy(() => import("@/components/CustomerManagement"));
const SalesInvoices = lazy(() => import("@/components/SalesInvoices"));
const CashSessions = lazy(() => import("@/components/CashSessions"));
const DebtManagement = lazy(() => import("@/components/DebtManagement"));
const SettingsPage = lazy(() => import("@/components/SettingsPage"));

function LoadingSpinner({ text = "جاري التحميل..." }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20">
      <div className="text-center">
        <div className="relative mx-auto mb-5 w-12 h-12">
          <div className="absolute inset-0 rounded-full border-3 border-blue-200/60" />
          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-blue-600 animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-medium tracking-wide">{text}</p>
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

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const Section = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <Suspense fallback={<LoadingSpinner />}>
      <MaintenanceGuard>
        <SubscriptionGuard>{children}</SubscriptionGuard>
      </MaintenanceGuard>
    </Suspense>
  </ProtectedRoute>
);

const App = () => (
  <ErrorBoundary>
    <ToastProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
                <Route path="/welcome" element={<Suspense fallback={<LoadingSpinner />}><Welcome /></Suspense>} />
                <Route path="/privacy" element={<Suspense fallback={<LoadingSpinner />}><PrivacyPolicy /></Suspense>} />
                <Route path="/terms" element={<Suspense fallback={<LoadingSpinner />}><TermsOfService /></Suspense>} />
                <Route path="/disclaimer" element={<Suspense fallback={<LoadingSpinner />}><Disclaimer /></Suspense>} />
                <Route path="/cookies" element={<Suspense fallback={<LoadingSpinner />}><CookiePolicy /></Suspense>} />
                <Route path="/acceptable-use" element={<Suspense fallback={<LoadingSpinner />}><AcceptableUsePolicy /></Suspense>} />
                <Route path="/pricing" element={<Suspense fallback={<LoadingSpinner />}><Pricing /></Suspense>} />
                <Route
                  path="/auth"
                  element={
                    <PublicRoute>
                      <Suspense fallback={<LoadingSpinner />}>
                        <AuthPage />
                      </Suspense>
                    </PublicRoute>
                  }
                />
                <Route element={<Suspense fallback={<LoadingSpinner />}><Index /></Suspense>}>
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
                    element={
                      <Section>
                        <Suspense fallback={<LoadingSpinner />}>
                          <SalesInvoices />
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
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdminPage />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ToastProvider>
  </ErrorBoundary>
);

export default App;
