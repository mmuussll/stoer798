import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchMaintenanceStatus } from "@/api/settings";
import { Wrench, RefreshCw } from "lucide-react";

interface MaintenanceGuardProps {
  children: React.ReactNode;
}

export default function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { isAdmin, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const { data: mStatus, isLoading: settingsLoading } = useQuery({
    queryKey: ["platform-maintenance"],
    queryFn: fetchMaintenanceStatus,
    staleTime: 30_000,
  });

  const maintenance = mStatus?.maintenance_mode || false;
  const message = mStatus?.maintenance_message || "الموقع تحت الصيانة حالياً، يرجى المحاولة لاحقاً";

  if (authLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-purple-50/30">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (maintenance && !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-yellow-50 p-4" dir="rtl">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-6">
            <Wrench className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">تحت الصيانة</h1>
          <p className="text-muted-foreground mb-6">{message}</p>
          <div className="p-4 bg-white rounded-xl border border-orange-200 shadow-sm">
            <p className="text-sm text-muted-foreground mb-2">يرجى المحاولة مرة أخرى لاحقاً</p>
            <button
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["platform-maintenance"] });
              }}
              className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تحديث الصفحة
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
