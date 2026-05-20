import { lazy, Suspense, useEffect, useRef } from "react";
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
  SidebarGroup,
  SidebarGroupLabel,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Package,
  BarChart3,
  Calculator,
  ChevronRight,
  Users,
  Landmark,
  Settings,
  Wallet,
  Shield,
  Wrench,
  Receipt,
  Tag,
  Sparkles,
  ChevronLeft,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { fetchSettings } from "@/api/settings";
import { QueryProvider } from "@/components/QueryProvider";

import("@/components/SalesInterface");

const WhatsAppSupport = lazy(() => import("@/components/WhatsAppSupport"));
const SubscriptionStatusBar = lazy(() => import("@/components/SubscriptionStatusBar"));
const NotificationsBell = lazy(() => import("@/components/NotificationsBell"));
const MobileBottomNav = lazy(() => import("@/components/MobileBottomNav").then(m => ({ default: m.MobileBottomNav })));

function SectionSkeleton() {
  return (
    <div className="space-y-5 p-4 md:p-6" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-[28rem] rounded-2xl" />
    </div>
  );
}

const NAV_ITEMS = [
  { id: "sales", path: "/sales", label: "نقطة البيع", icon: ShoppingCart, description: "إدارة المبيعات اليومية" },
  { id: "sales-invoices", path: "/sales-invoices", label: "سجل الفواتير", icon: Receipt, description: "سجل المعاملات" },
  { id: "products", path: "/products", label: "المنتجات", icon: Package, description: "إدارة المخزون" },
  { id: "customers", path: "/customers", label: "الزبائن", icon: Users, description: "بيانات العملاء" },
  { id: "debts", path: "/debts", label: "الديون", icon: Wallet, description: "متابعة المستحقات" },
  { id: "cash-sessions", path: "/cash-sessions", label: "جلسات الصندوق", icon: Landmark, description: "حركة النقدية" },
  { id: "reports", path: "/reports", label: "التقارير", icon: BarChart3, description: "تحليلات الأداء" },
  { id: "settings", path: "/settings", label: "الإعدادات", icon: Settings, description: "تخصيص النظام" },
] as const;

export default function Index() {
  return (
    <QueryProvider>
      <SidebarProvider defaultOpen={true} className="overflow-x-hidden max-w-full">
        <IndexContent />
      </SidebarProvider>
    </QueryProvider>
  );
}

function IndexContent() {
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpen, isMobile, open, setOpenMobile, openMobile } = useSidebar();

  const activeSection = location.pathname.replace("/", "") || "sales";
  const prevPathname = useRef(location.pathname);
  const pageAnimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prevPathname.current !== location.pathname) {
      const el = pageAnimRef.current;
      if (el) {
        el.classList.remove("animate-page-enter");
        requestAnimationFrame(() => {
          el.classList.add("animate-page-enter");
        });
      }
      prevPathname.current = location.pathname;
    }
  }, [location.pathname]);

  const { data: settings } = useQuery({
    queryKey: ["store-settings"],
    queryFn: fetchSettings,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    const defaultFont = settings?.font_family || "cairo";
    const FAMILY_MAP: Record<string, string> = {
      "ibm-plex": "'IBM Plex Sans Arabic'",
      "cairo": "'Cairo'",
      "tajawal": "'Tajawal'",
      "almarai": "'Almarai'",
      "el-messiri": "'El Messiri'",
    };
    document.documentElement.style.setProperty("--font-sans", FAMILY_MAP[defaultFont] || FAMILY_MAP["cairo"]);
  }, [settings?.font_family]);

  const handleSectionChange = (id: string) => {
    const item = NAV_ITEMS.find((i) => i.id === id);
    if (item) navigate(item.path);
    if (isMobile) setOpenMobile(false);
    else setOpen(false);
  };

  const activeItem = NAV_ITEMS.find((i) => `/${i.id}` === location.pathname || location.pathname.startsWith(`/${i.id}`))
    ?? NAV_ITEMS[0];

  const activeLabel = activeItem?.label ?? NAV_ITEMS[0].label;

  const isSalesPage = activeSection === "sales";

  useEffect(() => {
    document.title = `${activeLabel} | الكوثر للحسابات`;
  }, [activeLabel]);

  const closeMobile = () => { if (isMobile) { setOpenMobile(false); setOpen(false); } };
  const getState = () => (isMobile ? openMobile : open);

  return (
    <>
      <Suspense fallback={null}>
        <WhatsAppSupport />
      </Suspense>

      {/* ============ PREMIUM SIDEBAR ============ */}
      <Sidebar side="right" variant="floating">
        {/* ── Brand Header ── */}
        <SidebarHeader className="flex flex-col gap-3 px-4 pt-4 pb-3 group-data-[state=collapsed]:px-2 group-data-[state=collapsed]:items-center">
          <div className="flex items-center gap-3 group-data-[state=collapsed]:justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-40 group-data-[state=collapsed]:opacity-20" />
              <div className="relative w-11 h-11 bg-gradient-to-br from-blue-500 via-primary to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-primary/25 group-data-[state=collapsed]:w-9 group-data-[state=collapsed]:h-9 transition-all duration-400">
                <Calculator className="w-5 h-5 text-white group-data-[state=collapsed]:w-4 group-data-[state=collapsed]:h-4 transition-all duration-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0 group-data-[state=collapsed]:hidden">
              <h1 className="text-base font-bold text-white tracking-tight leading-tight">
                الكوثر للحسابات
              </h1>
              <p className="text-[11px] text-sidebar-accent-foreground/50 font-medium">
                نظام إدارة ذكي
              </p>
            </div>
          </div>
        </SidebarHeader>

        {/* ── Navigation ── */}
        <SidebarContent className="px-2.5 pt-1">
          <SidebarGroup>
            <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">القائمة الرئيسية</SidebarGroupLabel>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive = `/${item.id}` === location.pathname
                  || (item.id === "sales" && location.pathname === "/");
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => handleSectionChange(item.id)}
                      isActive={isActive}
                      tooltip={`${item.label} — ${item.description}`}
                      size="lg"
                      className={cn(
                        "rounded-xl transition-all duration-300 relative overflow-hidden group/btn",
                        isActive
                          ? "bg-gradient-brand text-white shadow-lg border-none active-glow"
                          : "hover:bg-slate-800/60 hover:text-white"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "transition-all duration-300",
                          isActive
                            ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.7)] scale-110"
                            : "text-sidebar-foreground/60 group-hover/btn:text-white group-hover/btn:scale-105"
                        )}
                      />
                      <div className="flex flex-col gap-0 text-start group-data-[state=collapsed]:hidden">
                        <span className={cn("transition-colors duration-200", isActive ? "text-white font-bold" : "text-sidebar-foreground/90")}>
                          {item.label}
                        </span>
                        <span className={cn(
                          "text-[10px] font-normal leading-tight transition-colors duration-200",
                          isActive ? "text-white/80" : "text-sidebar-accent-foreground/50"
                        )}>
                          {item.description}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarSeparator className="group-data-[state=collapsed]:hidden" />

        {/* ── Footer ── */}
        <SidebarFooter>
          <SidebarSeparator />
          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => { navigate("/admin"); closeMobile(); }}
                tooltip="لوحة التحكم"
              >
                <Shield className="w-4 h-4 text-purple-400" />
                <span>لوحة التحكم</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => { navigate("/pricing"); closeMobile(); }}
              tooltip="الباقات والأسعار"
            >
              <Tag className="w-4 h-4 text-amber-400" />
              <span>الباقات والأسعار</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <div className="flex items-center gap-2.5 px-3 py-2 mt-1 group-data-[state=collapsed]:hidden">
            <div className="relative flex items-center justify-center shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
            </div>
            <span className="text-[11.5px] text-sidebar-accent-foreground/50 truncate font-medium">
              {user?.email || "المتجر"}
            </span>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* ============ MAIN CONTENT ============ */}
      <SidebarInset
        className="bg-gradient-to-br from-slate-50 via-indigo-50/20 to-purple-50/10"
        dir="rtl"
      >
        {/* ── Top Navigation Bar ── */}
        <header className="sticky top-0 z-30 flex h-15 items-center gap-3 border-b border-indigo-100/30 bg-white/70 backdrop-blur-xl px-4 md:px-6 shadow-[0_4px_24px_-10px_rgba(99,102,241,0.05)]">
          <SidebarTrigger />

          {/* Breadcrumb-style navigation indicator */}
          <div className="hidden sm:flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
            <activeItem.icon className="w-4 h-4 text-primary/60" />
            <span className="text-sm font-bold text-foreground/80 tracking-tight">
              {activeLabel}
            </span>
          </div>

          {/* Mobile: section label */}
          <span className="sm:hidden text-sm font-bold text-foreground/80 tracking-tight">
            {activeLabel}
          </span>

          <div className="flex-1" />

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Suspense fallback={<div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />}>
              <NotificationsBell />
            </Suspense>
            <Suspense fallback={<div className="h-7 w-20 rounded-full bg-muted animate-pulse" />}>
              <SubscriptionStatusBar />
            </Suspense>
            <Badge
              variant="secondary"
              className="hidden md:inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border-emerald-200/60 text-[11px] px-2.5 py-1 rounded-full font-semibold"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              متصل
            </Badge>
          </div>
        </header>

        {/* ── Maintenance Banner ── */}
        {isAdmin && settings?.maintenance_mode && (
          <div className="sticky top-14 z-20 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2.5 text-center text-sm font-bold flex items-center justify-center gap-2 shadow-md animate-fade-down">
            <Wrench className="w-4 h-4" />
            <span>وضع الصيانة مفعل — المستخدمون لا يمكنهم الدخول حالياً</span>
          </div>
        )}

        {/* ── Page Content ── */}
        <main
          className={cn(
            "flex-1",
            isSalesPage
              ? "p-0 overflow-hidden pb-[calc(64px+env(safe-area-inset-bottom,0px))] lg:pb-0"
              : "overflow-y-auto p-3 md:p-6 lg:p-7 pb-24 lg:pb-6"
          )}
        >
          <div ref={pageAnimRef} className="animate-page-enter h-full">
            <Suspense fallback={<SectionSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </SidebarInset>

      {/* ── Mobile Bottom Navigation ── */}
      <Suspense fallback={null}>
        <MobileBottomNav
          items={[...NAV_ITEMS]}
          activeSection={location.pathname.replace("/", "")}
          onSelect={handleSectionChange}
          sidebarOpen={getState()}
          onToggleSidebar={() => {
            if (isMobile) setOpenMobile(!openMobile);
            else setOpen(!open);
          }}
        />
      </Suspense>
    </>
  );
}
