import { create } from "zustand";
import api from "../services/api";

const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (data) =>
    set((s) => ({
      notifications: [data, ...s.notifications].slice(0, 50),
      unreadCount: s.unreadCount + 1,
    })),

  fetchNotifications: async () => {
    try {
      const { data } = await api.get("/notifications");
      set({ notifications: data.notifications, unreadCount: data.unreadCount });
    } catch {
      // silently fail — backend may not be connected yet
    }
  },

  markAllRead: async () => {
    try {
      await api.put("/notifications/read");
      set((s) => ({
        notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {
      // silently fail
    }
  },

  clearCount: () => set({ unreadCount: 0 }),
}));

export default useNotificationStore;
