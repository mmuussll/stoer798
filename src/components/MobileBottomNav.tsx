import { useState, useEffect, useRef } from "react";
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
  const [moreOpen, setMoreOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const visibleItems = items.slice(0, 5);
  const moreItems = items.slice(5);

  useEffect(() => {
    if (!moreOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [moreOpen]);

  const handleMoreToggle = () => {
    if (sidebarOpen) onToggleSidebar();
    setMoreOpen(prev => !prev);
  };

  const handleItemSelect = (id: string) => {
    onSelect(id);
    setMoreOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-black/55 backdrop-blur-[3px] animate-fade-in"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More Menu - Bottom Sheet */}
      <div
        ref={menuRef}
        className={cn(
          "lg:hidden fixed inset-x-0 bottom-0 z-[70] transition-transform duration-300 ease-out",
          moreOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
      >
        <div className="bg-white/95 backdrop-blur-2xl rounded-t-2xl border-t border-slate-200/70 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1.5 bg-slate-300 rounded-full" />
          </div>

          <div className="px-5 pt-2 pb-3">
            <p className="text-sm font-semibold text-slate-800">المزيد من الأقسام</p>
          </div>

          <div className="grid grid-cols-4 gap-1.5 px-3 pb-6">
            {moreItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-xl transition-all duration-150",
                    "active:scale-90",
                    isActive
                      ? "bg-indigo-50/80 text-indigo-600"
                      : "text-slate-500 hover:bg-slate-50 active:bg-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-150",
                    isActive
                      ? "bg-indigo-100 text-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.2)]"
                      : "bg-slate-100 text-slate-500"
                  )}>
                    <item.icon className="w-[18px] h-[18px]" />
                  </div>
                  <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
                  {isActive && (
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-600 rounded-full shadow-[0_0_4px_rgba(79,70,229,0.4)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/70 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
      >
        <div className="flex items-center justify-around max-w-lg mx-auto px-1 pt-1.5">
          {/* More Button */}
          <button
            onClick={handleMoreToggle}
            className={cn(
              "relative flex flex-col items-center justify-center min-w-[56px] h-[58px] text-[10px] font-medium transition-all duration-150",
              "active:scale-90",
              moreOpen
                ? "text-indigo-600"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center mb-0.5 transition-all duration-150",
              moreOpen ? "bg-indigo-50 text-indigo-600" : ""
            )}>
              {moreOpen ? <X className="w-[19px] h-[19px]" /> : <Menu className="w-[19px] h-[19px]" />}
            </div>
            <span className="text-[10px]">المزيد</span>
          </button>

          {/* Visible Nav Items */}
          {visibleItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemSelect(item.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-[58px] text-[10px] font-medium transition-all duration-150",
                  "active:scale-90",
                  isActive
                    ? "text-indigo-600"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center mb-0.5 transition-all duration-150",
                  isActive ? "bg-indigo-50 text-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.2)]" : ""
                )}>
                  <item.icon className="w-[19px] h-[19px]" />
                </div>
                <span className="text-[10px] truncate max-w-[56px]">{item.label}</span>
                {isActive && (
                  <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-5 h-[3px] bg-indigo-600 rounded-full shadow-[0_2px_6px_rgba(79,70,229,0.3)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
