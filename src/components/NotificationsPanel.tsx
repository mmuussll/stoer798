import { useEffect, useState, useCallback } from "react";
import { Bell, X, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
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
  return format(date, "dd/MM/yyyy hh:mm a", { locale: ar });
}

function getTypeLabel(type: string): string {
  switch (type) {
    case "subscription": return "اشتراك";
    case "debt": return "ديون";
    case "alert": return "تنبيه";
    case "info": return "معلومة";
    default: return "النظام";
  }
}

function getTypeBadgeStyle(type: string): string {
  switch (type) {
    case "subscription": return "bg-purple-100 text-purple-800 border-purple-200";
    case "debt": return "bg-orange-100 text-orange-800 border-orange-200";
    case "alert": return "bg-red-100 text-red-800 border-red-200";
    case "info": return "bg-blue-100 text-blue-800 border-blue-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

interface NotificationsPanelProps {
  onBack: () => void;
}

export default function NotificationsPanel({ onBack }: NotificationsPanelProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await fetchNotifications();
      setNotifications(list);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silent
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silent
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <X className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            الإشعارات
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-200">
                {unreadCount} غير مقروء
              </Badge>
            )}
          </h2>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={actionLoading}
            className="gap-1"
          >
            {actionLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            تحديد الكل كمقروء
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">لا توجد إشعارات</p>
          <p className="text-gray-400 text-sm mt-1">ستظهر هنا الإشعارات الجديدة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "p-4 rounded-lg border transition-colors",
                !notification.is_read
                  ? "bg-blue-50/50 border-blue-200"
                  : "bg-white border-gray-200"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={cn("text-xs", getTypeBadgeStyle(notification.type))}>
                      {getTypeLabel(notification.type)}
                    </Badge>
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <h3 className={cn(
                    "font-semibold",
                    !notification.is_read ? "text-gray-900" : "text-gray-700"
                  )}>
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatNotificationDate(notification.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {!notification.is_read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="تحديد كمقروء"
                      className="h-8 w-8"
                    >
                      <CheckCheck className="w-4 h-4 text-blue-600" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(notification.id)}
                    title="حذف"
                    className="h-8 w-8 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
