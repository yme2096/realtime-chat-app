import { useEffect, useRef } from "react";
import { getSocket } from "../sockets/socket";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import useNotificationStore from "../store/notificationStore";
import useCallStore from "../store/callStore";
import { showBrowserNotif } from "../components/NotificationBell";

const EVENTS = [
  "message:new", "message:edited", "message:deleted", "message:reacted",
  "user:online", "user:offline", "typing:start", "typing:stop",
  "group:updated", "group:joined", "group:removed",
  "notification:message", "incoming-call",
];

const useSocketEvents = () => {
  const {
    addMessage, updateMessage, removeMessage,
    setUserOnline, setUserOffline, setTyping,
    updateChat, removeChat, incrementUnread,
  } = useChatStore();
  const { user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { setIncomingCall } = useCallStore();

  const ref = useRef({});
  ref.current = {
    addMessage, updateMessage, removeMessage,
    setUserOnline, setUserOffline, setTyping,
    updateChat, removeChat, incrementUnread,
    addNotification, setIncomingCall,
  };

  // Track which socket instance we've registered on
  const registeredSocketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const attach = (socket) => {
      // Remove all first to prevent duplicates
      EVENTS.forEach((e) => socket.off(e));

      socket.on("message:new", (message) => {
        ref.current.addMessage(message);
        const currentId = useChatStore.getState().activeChat?._id;
        const msgChatId = String(message.chat?._id || message.chat);
        if (msgChatId !== String(currentId)) {
          ref.current.incrementUnread(msgChatId);
        }
      });

      socket.on("message:edited", (msg) => ref.current.updateMessage(msg));
      socket.on("message:deleted", ({ messageId }) => ref.current.removeMessage(messageId));
      socket.on("message:reacted", ({ messageId, reactions }) =>
        ref.current.updateMessage({ _id: messageId, reactions })
      );

      socket.on("user:online", ({ userId }) => ref.current.setUserOnline(userId));
      socket.on("user:offline", ({ userId, lastSeen }) => {
        ref.current.setUserOffline(userId);
        useChatStore.setState((s) => ({
          chats: s.chats.map((c) => ({
            ...c,
            users: c.users?.map((p) =>
              String(p._id) === String(userId) ? { ...p, isOnline: false, lastSeen } : p
            ),
          })),
        }));
      });

      socket.on("typing:start", ({ userId: uid, chatId }) =>
        ref.current.setTyping(chatId, uid, true)
      );
      socket.on("typing:stop", ({ userId: uid, chatId }) =>
        ref.current.setTyping(chatId, uid, false)
      );

      socket.on("group:updated", (chat) => ref.current.updateChat(chat));
      socket.on("group:joined", (chat) => ref.current.updateChat(chat));
      socket.on("group:removed", ({ chatId }) => ref.current.removeChat(chatId));

      socket.on("notification:message", (data) => {
        ref.current.addNotification(data);
        showBrowserNotif(
          data.sender?.username || "New message",
          data.message?.content || "Sent you a message",
          data.sender?.avatar
        );
      });

      socket.on("incoming-call", ({ signal, from, callType, callerInfo, chatId }) => {
        if (useCallStore.getState().activeCall) return;
        ref.current.setIncomingCall({
          caller: callerInfo || { _id: from, username: "Unknown" },
          callType,
          signal,
          chatId,
        });
      });

      registeredSocketRef.current = socket;
    };

    // Attach immediately if socket is ready
    const s = getSocket();
    if (s) attach(s);

    // Poll every 500ms to detect new socket instance (after reconnect)
    const interval = setInterval(() => {
      const current = getSocket();
      if (current && current !== registeredSocketRef.current) {
        attach(current);
      }
    }, 500);

    return () => {
      clearInterval(interval);
      const sock = getSocket();
      if (sock) EVENTS.forEach((e) => sock.off(e));
      registeredSocketRef.current = null;
    };
  }, [user]);
};

export default useSocketEvents;
