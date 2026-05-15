import { lazy, Suspense } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { QueryProvider } from "@/components/QueryProvider";

const AdminPanel = lazy(() => import("@/components/AdminPanel"));

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="text-center">
        <div className="relative mx-auto mb-5 w-12 h-12">
          <div className="absolute inset-0 rounded-full border-3 border-blue-200/60" />
          <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-blue-600 animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-medium tracking-wide">جاري التحميل...</p>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <QueryProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <AdminPanel />
      </Suspense>
    </QueryProvider>
  );
}
