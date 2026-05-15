import { useEffect, useState, useCallback, useRef } from "react";
import {
  Bell,
  X,
  CheckCheck,
  Loader2,
  AlertTriangle,
  Wallet,
  Crown,
  Info,
  Megaphone,
  Trash2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  subscribeToNotifications,
} from "@/api/notifications";
import type { Notification } from "@/types";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday } from "date-fns";
import { ar } from "date-fns/locale";

type FilterTab = "all" | "unread" | "alert" | "debt" | "subscription" | "info" | "system";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "unread", label: "غير مقروءة" },
  { key: "alert", label: "تنبيهات" },
  { key: "debt", label: "ديون" },
];

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string; border: string; label: string }> = {
  alert: {
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-50",
    border: "border-red-500",
    label: "تنبيه",
  },
  debt: {
    icon: Wallet,
    color: "text-amber-500",
    bg: "bg-amber-50",
    border: "border-amber-500",
    label: "دين",
  },
  subscription: {
    icon: Crown,
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-500",
    label: "اشتراك",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-500",
    label: "معلومة",
  },
  system: {
    icon: Megaphone,
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-500",
    label: "نظام",
  },
};

function formatNotificationDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isToday(date)) return `اليوم ${format(date, "hh:mm a")}`;
  if (isYesterday(date)) return `أمس ${format(date, "hh:mm a")}`;
  return format(date, "dd/MM/yyyy", { locale: ar });
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [animatedIn, setAnimatedIn] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (!user) return;
    setLoading(true);
    Promise.all([fetchNotifications(), fetchUnreadCount()])
      .then(([list, count]) => {
        if (!cancelled) {
          setNotifications(list);
          setUnreadCount(count);
        }
      })
      .catch(() => {
        // silent
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToNotifications((notification) => {
      if (notification.user_id === user.id) {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((c) => c + 1);
      }
    });
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setAnimatedIn(true));
    } else {
      setAnimatedIn(false);
      setTimeout(() => setActiveTab("all"), 200);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silent
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setMarkingAll(true);
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      setDeletingId(id);
      await deleteNotification(id);
      const removed = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (removed && !removed.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setLoading(true);
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      await Promise.all(notifications.map((n) => deleteNotification(n.id)));
      setNotifications([]);
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    switch (activeTab) {
      case "unread":
        return !n.is_read;
      case "all":
        return true;
      default:
        return n.type === activeTab;
    }
  });

  const tabCounts: Record<FilterTab, number> = {
    all: notifications.length,
    unread: notifications.filter((n) => !n.is_read).length,
    alert: notifications.filter((n) => n.type === "alert").length,
    debt: notifications.filter((n) => n.type === "debt").length,
    subscription: notifications.filter((n) => n.type === "subscription").length,
    info: notifications.filter((n) => n.type === "info").length,
    system: notifications.filter((n) => n.type === "system").length,
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative p-2 rounded-xl transition-all duration-300",
          open
            ? "bg-indigo-50 text-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]"
            : "hover:bg-slate-100 text-slate-500 hover:text-slate-700"
        )}
        title="الإشعارات"
      >
        <Bell className={cn(
          "w-5 h-5 transition-transform duration-300",
          unreadCount > 0 && "drop-shadow-[0_0_4px_rgba(79,70,229,0.4)]",
          open && "scale-110"
        )} />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center rounded-full text-white text-[10px] font-bold px-1.5 leading-none",
            "bg-gradient-to-r from-red-500 to-rose-500 shadow-lg shadow-red-500/30",
            "animate-in zoom-in duration-200"
          )}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {open && (
        <div
          className={cn(
            "absolute top-12 left-1/2 -translate-x-1/2 z-50 w-[420px] rounded-2xl overflow-hidden",
            "bg-white/95 backdrop-blur-2xl border border-white/20",
            "shadow-2xl shadow-indigo-500/10",
            "transition-all duration-300 origin-top",
            animatedIn
              ? "scale-100 opacity-100 translate-y-0"
              : "scale-95 opacity-0 translate-y-2"
          )}
          dir="rtl"
        >
          {/* Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 opacity-[0.03]" />
            <div className="relative flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Bell className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm leading-tight">الإشعارات</h4>
                  {unreadCount > 0 && (
                    <p className="text-[11px] text-slate-400 font-medium">
                      {unreadCount} إشعار غير مقروء
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    disabled={loading}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
                    title="حذف الكل"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          {notifications.length > 0 && (
            <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-thin">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                    activeTab === tab.key
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/25"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
                  )}
                >
                  {tab.label}
                  {tabCounts[tab.key] > 0 && (
                    <span className={cn(
                      "mr-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1",
                      activeTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-500"
                    )}>
                      {tabCounts[tab.key]}
                    </span>
                  )}
                </button>
              ))}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="mr-auto shrink-0 px-3 py-1.5 rounded-full text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-all duration-200 flex items-center gap-1"
                >
                  {markingAll ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <CheckCheck className="w-3 h-3" />
                  )}
                  تحديد الكل
                </button>
              )}
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-[460px] overflow-y-auto scrollbar-thin">
            {filteredNotifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {activeTab === "all" ? (
                    <Sparkles className="w-7 h-7 text-slate-400" />
                  ) : activeTab === "unread" ? (
                    <CheckCheck className="w-7 h-7 text-slate-400" />
                  ) : (
                    <Bell className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <p className="text-sm font-medium text-slate-500 mb-1">
                  {activeTab === "all"
                    ? "لا توجد إشعارات"
                    : activeTab === "unread"
                    ? "جميع الإشعارات مقروءة"
                    : "لا توجد إشعارات في هذا القسم"}
                </p>
                <p className="text-xs text-slate-400">
                  {activeTab === "all" && "ستظهر الإشعارات هنا فور وصولها"}
                </p>
              </div>
            ) : (
              <div className="px-2 pb-2">
                {filteredNotifications.map((notification, idx) => {
                  const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.system;
                  const TypeIcon = config.icon;
                  return (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (!notification.is_read) handleMarkAsRead(notification.id);
                      }}
                      className={cn(
                        "group relative flex gap-3 px-3 py-3 rounded-xl cursor-pointer transition-all duration-200",
                        "hover:bg-slate-50/80 hover:shadow-sm",
                        !notification.is_read && "bg-indigo-50/40",
                        "animate-in fade-in slide-in-from-right-2",
                      )}
                      style={{ animationDelay: `${idx * 30}ms`, animationFillMode: "both" }}
                    >
                      {/* Left accent bar for unread */}
                      {!notification.is_read && (
                        <div className="absolute right-0 top-3 bottom-3 w-[3px] bg-gradient-to-b from-indigo-500 to-purple-500 rounded-full" />
                      )}

                      {/* Type Icon */}
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200",
                        config.bg,
                        "group-hover:scale-105"
                      )}>
                        <TypeIcon className={cn("w-4 h-4", config.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className={cn(
                            "text-sm leading-tight",
                            !notification.is_read
                              ? "font-bold text-slate-800"
                              : "font-medium text-slate-600"
                          )}>
                            {notification.title}
                          </p>
                          <span className={cn(
                            "shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                            config.bg,
                            config.color.replace("text-", "text-").replace("500", "600"),
                            "opacity-80"
                          )}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                          {formatNotificationDate(notification.created_at)}
                        </p>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className={cn(
                          "shrink-0 p-1.5 rounded-lg transition-all duration-200",
                          "opacity-0 group-hover:opacity-100",
                          "text-slate-300 hover:text-red-500 hover:bg-red-50"
                        )}
                      >
                        {deletingId === notification.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <X className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50">
              <p className="text-[10px] text-slate-500 text-center font-medium">
                آخر {notifications.length} إشعار
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
