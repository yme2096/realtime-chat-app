import { create } from "zustand";
import { chatService, messageService } from "../services/chatService";

const useChatStore = create((set, get) => ({
  chats: [],
  activeChat: null,
  messages: [],
  onlineUsers: [],
  typingUsers: {}, // { chatId: [userId, ...] }
  unreadCounts: {}, // { chatId: number }
  isLoadingMessages: false,
  hasMoreMessages: true,
  currentPage: 1,

  setChats: (chats) => set({ chats }),

  setActiveChat: (chat) =>
    set({ activeChat: chat, messages: [], currentPage: 1, hasMoreMessages: true }),

  fetchChats: async () => {
    try {
      const { data } = await chatService.getMyChats();
      set({ chats: data.chats });
      // Restore activeChat if URL has a chatId but store lost it (e.g. after refresh)
      const currentPath = window.location.pathname;
      const match = currentPath.match(/\/chat\/([^/]+)/);
      if (match) {
        const urlChatId = match[1];
        const found = data.chats.find((c) => c._id === urlChatId);
        if (found) set({ activeChat: found });
      }
    } catch (err) {
      console.error("fetchChats error:", err);
    }
  },

  fetchMessages: async (chatId, page = 1) => {
    set({ isLoadingMessages: true });
    try {
      const { data } = await messageService.getMessages(chatId, page);
      const msgs = data.messages || [];
      set((s) => ({
        messages: page === 1 ? msgs : [...msgs, ...s.messages],
        isLoadingMessages: false,
        hasMoreMessages: msgs.length === 30,
        currentPage: page,
      }));
    } catch (err) {
      console.error("fetchMessages error:", err);
      set({ isLoadingMessages: false });
    }
  },

  addMessage: (message) => {
    const chatId = String(message.chat?._id || message.chat);
    set((s) => ({
      messages: [...s.messages, message],
      chats: s.chats.map((c) =>
        c._id === chatId
          ? { ...c, lastMessage: message, updatedAt: message.createdAt }
          : c
      ),
    }));
  },

  updateMessage: (updated) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m._id === updated._id ? { ...m, ...updated } : m
      ),
    })),

  removeMessage: (messageId) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m._id === messageId
          ? { ...m, isDeleted: true, content: "This message was deleted" }
          : m
      ),
    })),

  updateChat: (updatedChat) =>
    set((s) => ({
      chats: s.chats.some((c) => c._id === updatedChat._id)
        ? s.chats.map((c) => (c._id === updatedChat._id ? updatedChat : c))
        : [updatedChat, ...s.chats],
      activeChat:
        s.activeChat?._id === updatedChat._id ? updatedChat : s.activeChat,
    })),

  removeChat: (chatId) =>
    set((s) => ({
      chats: s.chats.filter((c) => c._id !== chatId),
      activeChat: s.activeChat?._id === chatId ? null : s.activeChat,
    })),

  incrementUnread: (chatId) =>
    set((s) => ({
      unreadCounts: {
        ...s.unreadCounts,
        [chatId]: (s.unreadCounts[chatId] || 0) + 1,
      },
    })),

  clearUnread: (chatId) =>
    set((s) => ({ unreadCounts: { ...s.unreadCounts, [chatId]: 0 } })),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  setUserOnline: (userId) =>
    set((s) => ({
      onlineUsers: [...new Set([...s.onlineUsers, userId])],
    })),

  setUserOffline: (userId) =>
    set((s) => ({
      onlineUsers: s.onlineUsers.filter((id) => id !== userId),
    })),

  setTyping: (chatId, userId, isTyping) =>
    set((s) => {
      const current = s.typingUsers[chatId] || [];
      const updated = isTyping
        ? [...new Set([...current, userId])]
        : current.filter((id) => id !== userId);
      return { typingUsers: { ...s.typingUsers, [chatId]: updated } };
    }),

  // Legacy
  clearMessages: () => set({ messages: [] }),
}));

export default useChatStore;
