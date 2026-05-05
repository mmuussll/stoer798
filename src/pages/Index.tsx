import { useState, Suspense, lazy } from "react";
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
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Package,
  BarChart3,
  Calculator,
  Receipt,
  LogOut,
  ChevronRight,
  Users,
  RotateCcw,
  Landmark,
  Settings,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const SalesInterface = lazy(() => import("@/components/SalesInterface"));
const ProductManagement = lazy(() => import("@/components/ProductManagement"));
const ReportsSection = lazy(() => import("@/components/ReportsSection"));
const SalesInvoices = lazy(() => import("@/components/SalesInvoices"));
const CustomerManagement = lazy(() => import("@/components/CustomerManagement"));
const SalesReturns = lazy(() => import("@/components/SalesReturns"));
const CashSessions = lazy(() => import("@/components/CashSessions"));
const DebtManagement = lazy(() => import("@/components/DebtManagement"));
const SettingsPage = lazy(() => import("@/components/SettingsPage"));

function SectionSkeleton() {
  return (
    <div className="space-y-4 p-4" dir="rtl">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-lg" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-lg" />
    </div>
  );
}

const NAV_ITEMS = [
  { id: "sales", label: "نقطة البيع", icon: ShoppingCart },
  { id: "products", label: "المنتجات", icon: Package },
  { id: "customers", label: "الزبائن", icon: Users },
  { id: "sales-invoices", label: "فواتير المبيعات", icon: Receipt },
  { id: "sales-returns", label: "المرتجعات", icon: RotateCcw },
  { id: "debts", label: "الديون", icon: Wallet },
  { id: "cash-sessions", label: "جلسات الصندوق", icon: Landmark },
  { id: "reports", label: "التقارير", icon: BarChart3 },
  { id: "settings", label: "الإعدادات", icon: Settings },
] as const;

export default function Index() {
  const [activeSection, setActiveSection] = useState("sales");
  const { user, signOut } = useAuth();

  const renderContent = () => {
    switch (activeSection) {
      case "sales": return <SalesInterface />;
      case "products": return <ProductManagement />;
      case "customers": return <CustomerManagement />;
      case "sales-invoices": return <SalesInvoices />;
      case "sales-returns": return <SalesReturns />;
      case "debts": return <DebtManagement />;
      case "cash-sessions": return <CashSessions />;
      case "reports": return <ReportsSection />;
      case "settings": return <SettingsPage />;
      default: return null;
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar side="right" className="border-l border-blue-100">
        <SidebarHeader className="p-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <Calculator className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                الكوثر للحسابات
              </h1>
              <p className="text-xs text-muted-foreground">إدارة ذكية للمبيعات والمخزون</p>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-muted-foreground mb-2 px-2">القائمة الرئيسية</p>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveSection(item.id)}
                    isActive={activeSection === item.id}
                    tooltip={item.label}
                    size="lg"
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        </SidebarContent>

        <SidebarFooter className="p-2">
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0" />
            <span className="text-xs text-muted-foreground truncate">{user?.email || "المتجر"}</span>
          </div>
          <SidebarMenuButton onClick={signOut} size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </SidebarMenuButton>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
        <header className="flex h-14 items-center gap-2 border-b border-blue-100 bg-white px-4 sticky top-0 z-40">
          <SidebarTrigger className="ml-2" />
          <div className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-blue-800">
              {NAV_ITEMS.find((i) => i.id === activeSection)?.label}
            </span>
          </div>
          <div className="flex-1" />
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 text-xs">
            متصل
          </Badge>
        </header>

        <main className={cn("p-4 md:p-6", activeSection === "sales" && "p-0 md:p-0")}>
          <Suspense fallback={<SectionSkeleton />}>
            {renderContent()}
          </Suspense>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
