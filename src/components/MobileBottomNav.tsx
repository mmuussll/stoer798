import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface MobileBottomNavProps {
  items: NavItem[];
  activeSection: string;
  onSelect: (id: string) => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function MobileBottomNav({ items, activeSection, onSelect, sidebarOpen, onToggleSidebar }: MobileBottomNavProps) {
  const visibleItems = items.slice(0, 5);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/70 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
    >
      <div className="flex items-center justify-around max-w-lg mx-auto px-1">
        {/* Menu Toggle */}
        <button
          onClick={onToggleSidebar}
          className={cn(
            "relative flex flex-col items-center justify-center min-w-[56px] h-[56px] text-[10px] font-medium transition-all duration-200",
            "active:scale-90",
            sidebarOpen
              ? "text-indigo-600"
              : "text-slate-400 hover:text-slate-600"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center mb-0.5 transition-all duration-200",
            sidebarOpen ? "bg-indigo-50 text-indigo-600" : ""
          )}>
            {sidebarOpen ? <X className="w-[18px] h-[18px]" /> : <Menu className="w-[18px] h-[18px]" />}
          </div>
          <span className="text-[9px]">المزيد</span>
        </button>

        {/* Nav Items */}
        {visibleItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "relative flex flex-col items-center justify-center flex-1 h-[56px] text-[10px] font-medium transition-all duration-200",
                "active:scale-90",
                isActive
                  ? "text-indigo-600"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center mb-0.5 transition-all duration-200",
                isActive ? "bg-indigo-50 text-indigo-600 shadow-sm" : ""
              )}>
                <item.icon className="w-[18px] h-[18px]" />
              </div>
              <span className="text-[9px] truncate max-w-[56px]">{item.label}</span>
              {isActive && (
                <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-5 h-[3px] bg-indigo-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}