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
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [moreOpen]);

  useEffect(() => {
    document.body.style.overflow = moreOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [moreOpen]);

  const handleMoreToggle = () => {
    if (sidebarOpen) onToggleSidebar();
    setMoreOpen((prev) => !prev);
  };

  const handleItemSelect = (id: string) => {
    onSelect(id);
    setMoreOpen(false);
  };

  return (
    <>
      {moreOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[60] bg-black/55 backdrop-blur-[3px] animate-fade-in"
          onClick={() => setMoreOpen(false)}
        />
      )}

      <div
        ref={menuRef}
        className={cn(
          "lg:hidden fixed inset-x-0 bottom-0 z-[70] transition-transform duration-400 ease-out",
          moreOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 8px)" }}
      >
        <div className="bg-white/95 backdrop-blur-2xl rounded-t-3xl border-t border-border/60 shadow-[0_-12px_40px_rgba(0,0,0,0.12)]">
          <div className="flex justify-center pt-3 pb-1.5">
            <div className="w-10 h-1.5 bg-muted-foreground/20 rounded-full" />
          </div>
          <div className="px-5 pt-2 pb-3">
            <p className="text-sm font-bold text-foreground">المزيد من الأقسام</p>
          </div>
          <div className="grid grid-cols-4 gap-2 px-4 pb-6">
            {moreItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-200",
                    "active:scale-[0.92]",
                    isActive
                      ? "bg-primary/5 text-primary"
                      : "text-muted-foreground hover:bg-muted/60 active:bg-muted"
                  )}
                >
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200",
                    isActive
                      ? "bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.2)]"
                      : "bg-muted text-muted-foreground"
                  )}>
                    <item.icon className="w-[19px] h-[19px]" />
                  </div>
                  <span className="text-[10px] font-bold leading-tight text-center">{item.label}</span>
                  {isActive && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full shadow-[0_0_6px_hsl(var(--primary)/0.5)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-[35] bg-white/90 backdrop-blur-2xl border-t border-border/60 shadow-[0_-6px_24px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 4px)" }}
      >
        <div className="flex items-center justify-around max-w-lg mx-auto px-1 pt-1.5">
          <button
            onClick={handleMoreToggle}
            className={cn(
              "relative flex flex-col items-center justify-center min-w-[56px] h-[60px] text-[10px] font-bold transition-all duration-200",
              "active:scale-[0.9]",
              moreOpen ? "text-primary" : "text-muted-foreground/60 hover:text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-9 h-9 rounded-2xl flex items-center justify-center mb-0.5 transition-all duration-200",
              moreOpen ? "bg-primary/10 text-primary" : ""
            )}>
              {moreOpen ? <X className="w-[19px] h-[19px]" /> : <Menu className="w-[19px] h-[19px]" />}
            </div>
            <span className="text-[10px]">المزيد</span>
          </button>

          {visibleItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemSelect(item.id)}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-[60px] text-[10px] font-bold transition-all duration-200",
                  "active:scale-[0.9]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/60 hover:text-muted-foreground"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-2xl flex items-center justify-center mb-0.5 transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                    : ""
                )}>
                  <item.icon className="w-[19px] h-[19px]" />
                </div>
                <span className="text-[10px] truncate max-w-[56px]">{item.label}</span>
                {isActive && (
                  <span className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-6 h-[3px] bg-primary rounded-full shadow-[0_2px_8px_hsl(var(--primary)/0.35)]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
