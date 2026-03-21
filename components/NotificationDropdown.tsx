"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  Check,
  Calendar,
  BookOpen,
  DollarSign,
  Video,
  MessageSquare,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
  TrendingUp,
  UserCheck,
} from "lucide-react";

import { Button } from "./ui/button";
import * as notificationsApi from "@/lib/api/notifications";
import type { Notification } from "@/lib/api/notifications";

function getNotificationIcon(type: string) {
  if (type.includes("EVENT")) return Calendar;
  if (type.includes("ATTENDANCE")) return UserCheck;
  if (type.includes("HOMEWORK") || type.includes("ASSIGNMENT")) return BookOpen;
  if (type.includes("EXAM")) return FileText;
  if (type.includes("FEE")) return DollarSign;
  if (type.includes("LIVE_CLASS") || type.includes("RECORDING")) return Video;
  if (type.includes("REMARK") || type.includes("FEEDBACK") || type.includes("APPRECIATION")) return MessageSquare;
  if (type.includes("GRADE") || type.includes("GRADED")) return Award;
  if (type.includes("TIMETABLE") || type.includes("SCHEDULE")) return Clock;
  if (type.includes("PROGRESS_REPORT") || type.includes("PROJECT")) return TrendingUp;
  if (type === "SYSTEM_ALERT") return AlertCircle;
  return Bell;
}

function getNotificationColor(type: string) {
  if (type.includes("EVENT")) return "bg-blue-100 text-blue-600";
  if (type.includes("ATTENDANCE")) return "bg-green-100 text-green-600";
  if (type.includes("HOMEWORK") || type.includes("ASSIGNMENT")) return "bg-purple-100 text-purple-600";
  if (type.includes("EXAM")) return "bg-red-100 text-red-600";
  if (type.includes("FEE")) return "bg-orange-100 text-orange-600";
  if (type.includes("LIVE_CLASS") || type.includes("RECORDING")) return "bg-blue-100 text-blue-600";
  if (type.includes("REMARK") || type.includes("FEEDBACK") || type.includes("APPRECIATION")) return "bg-yellow-100 text-yellow-600";
  if (type.includes("GRADE") || type.includes("GRADED")) return "bg-emerald-100 text-emerald-600";
  if (type.includes("PROGRESS_REPORT")) return "bg-teal-100 text-teal-600";
  if (type === "SYSTEM_ALERT") return "bg-red-100 text-red-600";
  return "bg-gray-100 text-gray-600";
}

function getNotificationRoute(notification: Notification): string {
  const { type } = notification;

  if (type.includes("EVENT")) return "/dashboard";
  if (type.includes("ATTENDANCE")) return "/dashboard";
  if (type.includes("HOMEWORK") || type.includes("ASSIGNMENT")) return "/assignments";
  if (type.includes("EXAM")) return "/dashboard";
  if (type.includes("FEE")) return "/fees";
  if (type.includes("LIVE_CLASS")) return "/live";
  if (type.includes("RECORDING")) return "/live/recordings";
  if (type.includes("REMARK") || type.includes("FEEDBACK")) return "/dashboard";
  if (type.includes("PROGRESS_REPORT")) return "/dashboard";

  return "/dashboard";
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }

  const days = Math.floor(diffInSeconds / 86400);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      void fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isOpen) {
        void fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [isOpen, fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.isRead) {
        await notificationsApi.markNotificationAsRead(notification.id);
      }

      setIsOpen(false);
      const route = getNotificationRoute(notification);
      router.push(route);

      // Refresh to update read status
      void fetchNotifications();
    } catch (error) {
      console.error("Error handling notification click:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      // First mark all as read
      await notificationsApi.markAllNotificationsAsRead();

      // Then delete all notifications
      const deletePromises = notifications.map((notification) =>
        notificationsApi.deleteNotification(notification.id)
      );
      await Promise.all(deletePromises);

      // Refresh the list
      void fetchNotifications();
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.deleteNotification(id);
      void fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const unreadCount = notificationsApi.getUnreadCount(notifications);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 items-center justify-center rounded-[12px] border-0 bg-white/10 px-2.5 text-white backdrop-blur-md hover:bg-white/20 transition-colors"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed left-2 right-2 top-20 z-50 rounded-2xl border border-gray-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[400px]">
            {/* Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Notifications</h2>
                  <p className="text-xs text-gray-500">
                    {unreadCount > 0
                      ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                      : "You're all caught up!"}
                  </p>
                </div>
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllRead}
                    className="text-xs"
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Clear all
                  </Button>
                )}
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[500px] overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#283618] border-t-transparent" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell className="mb-4 h-12 w-12 text-gray-300" />
                  <p className="text-sm font-medium text-gray-900">No notifications</p>
                  <p className="text-xs text-gray-500">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const colorClass = getNotificationColor(notification.type);

                    return (
                      <div
                        key={notification.id}
                        onClick={() => void handleNotificationClick(notification)}
                        className={`group cursor-pointer p-4 transition-colors hover:bg-gray-50 ${
                          !notification.isRead ? "bg-blue-50/30" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                            <Icon className="h-5 w-5" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold text-gray-900">
                                  {notification.title}
                                </h3>
                                <p className="mt-1 text-xs text-gray-600 line-clamp-2">
                                  {notification.message}
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                  {formatTimeAgo(notification.createdAt)}
                                </p>
                              </div>

                              <div className="flex items-center gap-1">
                                {!notification.isRead && (
                                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                                )}
                                <button
                                  onClick={(e) => void handleDelete(notification.id, e)}
                                  className="opacity-0 group-hover:opacity-100 rounded p-1 hover:bg-gray-200 transition-opacity"
                                >
                                  <X className="h-4 w-4 text-gray-500" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
