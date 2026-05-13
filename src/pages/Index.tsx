import { Suspense, useEffect } from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarSeparator,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Package,
  BarChart3,
  Calculator,
  LogOut,
  ChevronLeft,
  Users,
  Landmark,
  Settings,
  Wallet,
  Shield,
  Wrench,
  ChevronRight,
  Receipt,
  Tag,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import SubscriptionStatusBar from "@/components/SubscriptionStatusBar";
import NotificationsBell from "@/components/NotificationsBell";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "@/api/settings";

function SectionSkeleton() {
  return (
    <div className="space-y-4 p-4" dir="rtl">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}

const NAV_ITEMS = [
  { id: "sales", path: "/sales", label: "نقطة البيع", icon: ShoppingCart },
  { id: "sales-invoices", path: "/sales-invoices", label: "سجل الفواتير", icon: Receipt },
  { id: "products", path: "/products", label: "المنتجات", icon: Package },
  { id: "customers", path: "/customers", label: "الزبائن", icon: Users },
  { id: "debts", path: "/debts", label: "الديون", icon: Wallet },
  { id: "cash-sessions", path: "/cash-sessions", label: "جلسات الصندوق", icon: Landmark },
  { id: "reports", path: "/reports", label: "التقارير", icon: BarChart3 },
  { id: "settings", path: "/settings", label: "الإعدادات", icon: Settings },
] as const;

export default function Index() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpen, isMobile, open } = useSidebar();

  const activeSection = location.pathname.replace("/", "") || "sales";

  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchSettings,
    enabled: isAdmin,
  });

  const handleSectionChange = (id: string) => {
    const item = NAV_ITEMS.find((i) => i.id === id);
    if (item) navigate(item.path);
    if (isMobile) setOpen(false);
  };

  const activeLabel = NAV_ITEMS.find((i) => `/${i.id}` === location.pathname || location.pathname.startsWith(`/${i.id}`))?.label
    ?? NAV_ITEMS.find((_i) => `/sales` === location.pathname || location.pathname === "/")?.label
    ?? NAV_ITEMS[0].label;

  const isSalesPage = activeSection === "sales";

  useEffect(() => {
    document.title = `${activeLabel} | الكوثر للحسابات`;
  }, [activeLabel]);

  return (
    <SidebarProvider defaultOpen={true}>
      <WhatsAppSupport />

      {/* Premium Sidebar */}
      <Sidebar side="right">
        {/* Sidebar Header - Brand */}
        <SidebarHeader className="flex flex-col gap-3 px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                الكوثر للحسابات
              </h1>
              <p className="text-[11px] text-sidebar-accent-foreground/60">
                إدارة ذكية للمبيعات والمخزون
              </p>
            </div>
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent className="px-3">
          <div className="px-3 py-2">
            <p className="text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-accent-foreground/40 mb-1">
              القائمة الرئيسية
            </p>
          </div>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => {
              const isActive = `/${item.id}` === location.pathname
                || (item.id === "sales" && location.pathname === "/");
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => handleSectionChange(item.id)}
                    isActive={isActive}
                    tooltip={item.label}
                    size="lg"
                    className={cn(
                      "group relative transition-all duration-150",
                      isActive
                        ? "bg-sidebar-accent text-white shadow-sm"
                        : "text-sidebar-accent-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    )}
                  >
                    <item.icon className={cn(
                      "w-[18px] h-[18px] transition-transform duration-150",
                      isActive && "text-sidebar-primary"
                    )} />
                    <span className="font-medium tracking-wide">{item.label}</span>
                    {isActive && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-sidebar-primary rounded-full transition-all duration-150" />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarSeparator className="bg-sidebar-border/50" />

        {/* Sidebar Footer */}
        <SidebarFooter className="p-3 space-y-1.5">
          {isAdmin && (
            <button
              onClick={() => navigate("/admin")}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sidebar-accent-foreground/80 hover:text-white hover:bg-sidebar-accent transition-all duration-200 text-sm font-medium"
            >
              <Shield className="w-4 h-4 text-purple-400" />
              <span>لوحة التحكم</span>
              <ChevronLeft className="w-3.5 h-3.5 mr-auto opacity-50" />
            </button>
          )}
          <button
            onClick={() => navigate("/pricing")}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sidebar-accent-foreground/80 hover:text-white hover:bg-sidebar-accent transition-all duration-200 text-sm font-medium"
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <span>الباقات والأسعار</span>
            <ChevronLeft className="w-3.5 h-3.5 mr-auto opacity-50" />
          </button>
          <div className="flex items-center gap-2.5 px-3 py-1.5">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-pulse opacity-50" />
            </div>
            <span className="text-[11.5px] text-sidebar-accent-foreground/60 truncate">
              {user?.email || "المتجر"}
            </span>
          </div>
          <SidebarMenuButton
            onClick={signOut}
            size="sm"
            className="text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20" dir="rtl">
        {/* Top Header Bar */}
        <header className="flex h-14 items-center gap-2 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl px-4 sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="hover:bg-slate-100 rounded-lg -mr-1 transition-all duration-150" />
            <ChevronRight className="w-4 h-4 text-muted-foreground/50 transition-transform duration-200" />
            <span className="text-sm font-semibold text-slate-700 tracking-tight">
              {activeLabel}
            </span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2.5">
            <NotificationsBell />
            <SubscriptionStatusBar />
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 text-[11px] px-2 py-0.5 font-medium animate-in fade-in duration-300">
              متصل
            </Badge>
          </div>
        </header>

        {/* Maintenance Banner */}
        {isAdmin && settings?.maintenance_mode && (
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-center text-sm font-semibold flex items-center justify-center gap-2 sticky top-14 z-20 shadow-md">
            <Wrench className="w-4 h-4" />
            <span>وضع الصيانة مفعل</span>
          </div>
        )}

        {/* Page Content */}
        <main className={cn(
          "flex-1 overflow-y-auto",
          isSalesPage ? "p-0" : "p-4 md:p-6",
          "pb-20 lg:pb-4"
        )}>
          <div key={location.pathname} className="animate-page-enter h-full">
            <Suspense fallback={<SectionSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </SidebarInset>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        items={[...NAV_ITEMS]}
        activeSection={location.pathname.replace("/", "")}
        onSelect={handleSectionChange}
        sidebarOpen={open}
        onToggleSidebar={() => setOpen(!open)}
      />
    </SidebarProvider>
  );
}
