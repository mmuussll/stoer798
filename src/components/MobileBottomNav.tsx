import {
  Menu,
  X,
} from "lucide-react";
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
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center overflow-x-auto">
        <button
          onClick={onToggleSidebar}
          className={cn(
            "flex-shrink-0 flex flex-col items-center justify-center min-w-[52px] h-14 px-1 text-xs font-medium transition-colors",
            sidebarOpen ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-blue-600"
          )}
        >
          {sidebarOpen ? <X className="w-4 h-4 mb-0.5" /> : <Menu className="w-4 h-4 mb-0.5" />}
          <span className="text-[10px]">المزيد</span>
        </button>
        {items.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center h-14 px-1 text-xs font-medium transition-colors",
              activeSection === item.id
                ? "text-blue-600 bg-blue-50"
                : "text-gray-500 hover:text-blue-600"
            )}
          >
            <item.icon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px] truncate max-w-full">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
