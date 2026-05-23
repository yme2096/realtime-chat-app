import { create } from "zustand";
import { authService } from "../services/authService";
import { connectSocket, disconnectSocket } from "../sockets/socket";

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem("token"),
  isLoading: false,
  isAuthenticated: false,

  login: async (credentials) => {
    set({ isLoading: true });
    const { data } = await authService.login(credentials);
    localStorage.setItem("token", data.token);
    connectSocket(data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
  },

  register: async (credentials) => {
    set({ isLoading: true });
    const { data } = await authService.register(credentials);
    localStorage.setItem("token", data.token);
    connectSocket(data.token);
    set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
  },

  loadUser: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }
    try {
      const { data } = await authService.getMe();
      connectSocket(token);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem("token");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    disconnectSocket();
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (updates) =>
    set((s) => ({ user: { ...s.user, ...updates } })),

  // Legacy setters kept for any remaining references
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
}));

export default useAuthStore;
