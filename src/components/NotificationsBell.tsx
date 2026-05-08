import { useEffect, useState, useCallback } from "react";
import { Bell, X, CheckCheck, Loader2 } from "lucide-react";
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

function formatNotificationDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isToday(date)) return `اليوم ${format(date, "hh:mm a")}`;
  if (isYesterday(date)) return `أمس ${format(date, "hh:mm a")}`;
  return format(date, "dd/MM/yyyy", { locale: ar });
}

function getTypeStyles(type: string) {
  switch (type) {
    case "subscription":
      return { bg: "bg-purple-50 border-purple-200", dot: "bg-purple-500" };
    case "debt":
      return { bg: "bg-orange-50 border-orange-200", dot: "bg-orange-500" };
    case "alert":
      return { bg: "bg-red-50 border-red-200", dot: "bg-red-500" };
    case "info":
      return { bg: "bg-blue-50 border-blue-200", dot: "bg-blue-500" };
    default:
      return { bg: "bg-gray-50 border-gray-200", dot: "bg-gray-500" };
  }
}

export default function NotificationsBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const [list, count] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // silent
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

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
      setLoading(true);
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      const removed = notifications.find((n) => n.id === id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (removed && !removed.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="الإشعارات"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute top-12 right-0 z-50 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-sm">الإشعارات</h4>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {loading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCheck className="w-3 h-3" />
                    )}
                    تحديد الكل كمقروء
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">لا توجد إشعارات</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const styles = getTypeStyles(notification.type);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (!notification.is_read) handleMarkAsRead(notification.id);
                      }}
                      className={cn(
                        "px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 flex gap-3",
                        !notification.is_read && styles.bg
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", styles.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm", !notification.is_read ? "font-bold text-gray-900" : "text-gray-700")}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">
                          {formatNotificationDate(notification.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
