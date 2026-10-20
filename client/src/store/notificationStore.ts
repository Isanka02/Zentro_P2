import { create } from "zustand";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead, type UserNotification } from "../api/notifications";
import { useAuthStore } from "./authStore";

interface NotificationState {
  notifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  error: string;
  load: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  reset: () => void;
}

const emptyState = {
  notifications: [] as UserNotification[],
  unreadCount: 0,
  loading: false,
  error: "",
};

export const useNotificationStore = create<NotificationState>((set, get) => ({
  ...emptyState,
  load: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return set({ ...emptyState });
    set({ loading: true, error: "" });
    try {
      const result = await fetchNotifications();
      if (useAuthStore.getState().user?.id === userId) {
        set({ notifications: result.notifications, unreadCount: result.unreadCount, loading: false });
      }
    } catch (err) {
      if (useAuthStore.getState().user?.id === userId) {
        set({ loading: false, error: err instanceof Error ? err.message : "Could not load notifications" });
      }
    }
  },
  markRead: async (id) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    const notification = get().notifications.find((item) => item._id === id);
    if (!notification || notification.readAt) return;
    try {
      await markNotificationRead(id);
      if (useAuthStore.getState().user?.id !== userId) return;
      set((state) => ({
        notifications: state.notifications.map((item) => item._id === id ? { ...item, readAt: new Date().toISOString() } : item),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      if (useAuthStore.getState().user?.id !== userId) return;
      set({ error: err instanceof Error ? err.message : "Could not update notification" });
    }
  },
  markAllRead: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    try {
      await markAllNotificationsRead();
      if (useAuthStore.getState().user?.id !== userId) return;
      const readAt = new Date().toISOString();
      set((state) => ({ notifications: state.notifications.map((item) => ({ ...item, readAt: item.readAt ?? readAt })), unreadCount: 0 }));
    } catch (err) {
      if (useAuthStore.getState().user?.id !== userId) return;
      set({ error: err instanceof Error ? err.message : "Could not update notifications" });
    }
  },
  reset: () => set({ ...emptyState }),
}));

useAuthStore.subscribe((state, previousState) => {
  if (state.user?.id !== previousState.user?.id) {
    if (state.user) void useNotificationStore.getState().load();
    else useNotificationStore.getState().reset();
  }
});
