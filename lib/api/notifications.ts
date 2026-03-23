import { apiClient } from "./config";

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
  eventId?: string | null;
  isRead: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
}

export interface NotificationActionResponse {
  success: boolean;
  message?: string;
}

/**
 * Get all notifications for the current user
 */
export async function getNotifications(): Promise<Notification[]> {
  const response = await apiClient.get<NotificationsResponse>("/notifications");
  return response.data || [];
}

/**
 * Mark a specific notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await apiClient.patch<NotificationActionResponse>(`/notifications/${notificationId}/read`);
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.patch<NotificationActionResponse>("/notifications/read-all");
}

/**
 * Delete a notification (soft delete)
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await apiClient.delete<NotificationActionResponse>(`/notifications/${notificationId}`);
}

/**
 * Get unread notification count
 */
export function getUnreadCount(notifications: Notification[]): number {
  return notifications.filter((n) => !n.isRead).length;
}
