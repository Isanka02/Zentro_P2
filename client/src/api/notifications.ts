import { api } from "./axios";

export type NotificationType = "order" | "payment" | "support";

export interface UserNotification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string;
  readAt?: string;
  createdAt: string;
}

export const fetchNotifications = async () => {
  const response = await api.get<{ notifications: UserNotification[]; unreadCount: number }>("/notifications");
  return response.data;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};
