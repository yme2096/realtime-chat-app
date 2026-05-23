const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Message = require("../models/Message");
const Chat = require("../models/Chat");
const Notification = require("../models/Notification");

const onlineUsers = new Map(); // userId -> socketId
let _io = null; // stored io instance for use outside socket context

const getIO = () => _io;

const initSocket = (io) => {
  _io = io;
  // ── Auth middleware ────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication error"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select("-password");
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${socket.user.username} (${socket.id})`);

    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true });
    socket.join(userId);
    io.emit("user:online", { userId });

    // ── Chat rooms ─────────────────────────────────────────
    socket.on("chat:join", (chatId) => socket.join(chatId));
    socket.on("chat:leave", (chatId) => socket.leave(chatId));

    // ── Send message ───────────────────────────────────────
    socket.on("message:send", async (data, callback) => {
      try {
        const { chatId, content, type = "text", replyTo } = data;

        const chat = await Chat.findById(chatId);
        if (!chat) return callback?.({ error: "Chat not found" });

        const message = await Message.create({
          chat: chatId,
          sender: userId,
          content,
          type,
          replyTo: replyTo || undefined,
        });

        await message.populate("sender", "username avatar");
        if (replyTo) await message.populate("replyTo", "content sender");

        // Update lastMessage
        await Chat.findByIdAndUpdate(chatId, { lastMessage: message._id });

        // Emit to chat room
        io.to(chatId).emit("message:new", message);

        // Notify other participants (skip for call history messages)
        if (type !== "call") {
          const members = chat.users || [];
          const notifDocs = [];
          members.forEach((p) => {
            const pid = p.toString();
            if (pid !== userId) {
              io.to(pid).emit("notification:message", {
                chatId,
                message,
                sender: socket.user,
              });
              notifDocs.push({
                recipient: pid,
                sender: userId,
                type: "message",
                chat: chatId,
                message: message._id,
                text: message.content?.slice(0, 100) || "Sent a file",
              });
            }
          });
          if (notifDocs.length) {
            try { await Notification.insertMany(notifDocs); } catch {}
          }
        }

        callback?.({ success: true, message });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ── Typing ─────────────────────────────────────────────
    socket.on("typing:start", ({ chatId }) => {
      socket.to(chatId).emit("typing:start", { userId, chatId });
    });
    socket.on("typing:stop", ({ chatId }) => {
      socket.to(chatId).emit("typing:stop", { userId, chatId });
    });

    // ── Read receipts ──────────────────────────────────────
    socket.on("message:read", async ({ chatId }) => {
      await Message.updateMany(
        { chat: chatId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      socket.to(chatId).emit("message:read", { chatId, userId });
    });

    // ── Edit message ───────────────────────────────────────
    socket.on("message:edit", async ({ messageId, content }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== userId)
          return callback?.({ error: "Unauthorized" });
        message.content = content;
        message.isEdited = true;
        await message.save();
        io.to(message.chat.toString()).emit("message:edited", message);
        callback?.({ success: true });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ── Delete message ─────────────────────────────────────
    socket.on("message:delete", async ({ messageId }, callback) => {
      try {
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== userId)
          return callback?.({ error: "Unauthorized" });
        message.isDeleted = true;
        message.content = "This message was deleted";
        await message.save();
        io.to(message.chat.toString()).emit("message:deleted", {
          messageId,
          chatId: message.chat,
        });
        callback?.({ success: true });
      } catch (err) {
        callback?.({ error: err.message });
      }
    });

    // ── React to message ───────────────────────────────────
    socket.on("message:react", async ({ messageId, emoji }) => {
      const message = await Message.findById(messageId);
      if (!message) return;
      const idx = message.reactions.findIndex(
        (r) => r.user.toString() === userId
      );
      if (idx > -1) {
        if (message.reactions[idx].emoji === emoji)
          message.reactions.splice(idx, 1);
        else message.reactions[idx].emoji = emoji;
      } else {
        message.reactions.push({ user: userId, emoji });
      }
      await message.save();
      io.to(message.chat.toString()).emit("message:reacted", {
        messageId,
        reactions: message.reactions,
      });
    });

    // ── Group management ───────────────────────────────────
    socket.on("group:add_member", async ({ chatId, userId: newMemberId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat?.isGroup) return;
        const isAdmin = chat.admins.some((a) => a.toString() === userId);
        if (!isAdmin) return;
        if (!chat.users.map((u) => u.toString()).includes(newMemberId)) {
          chat.users.push(newMemberId);
          await chat.save();
        }
        const populated = await Chat.findById(chatId)
          .populate("users", "username avatar isOnline lastSeen")
          .populate("admins", "username avatar")
          .populate("lastMessage");
        io.to(chatId).emit("group:updated", populated);
        const newMemberSocketId = onlineUsers.get(newMemberId);
        if (newMemberSocketId) {
          io.to(newMemberSocketId).emit("group:joined", populated);
        }
      } catch (err) {
        console.error("group:add_member error", err.message);
      }
    });

    socket.on("group:remove_member", async ({ chatId, userId: targetId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat?.isGroup) return;
        const isAdmin = chat.admins.some((a) => a.toString() === userId);
        if (!isAdmin && targetId !== userId) return;
        chat.users = chat.users.filter((u) => u.toString() !== targetId);
        chat.admins = chat.admins.filter((a) => a.toString() !== targetId);
        if (chat.admins.length === 0 && chat.users.length > 0) {
          chat.admins.push(chat.users[0]);
        }
        await chat.save();
        const populated = await Chat.findById(chatId)
          .populate("users", "username avatar isOnline lastSeen")
          .populate("admins", "username avatar")
          .populate("lastMessage");
        io.to(chatId).emit("group:updated", populated);
        io.to(targetId).emit("group:removed", { chatId });
      } catch (err) {
        console.error("group:remove_member error", err.message);
      }
    });

    socket.on("group:promote_admin", async ({ chatId, userId: targetId }) => {
      try {
        const chat = await Chat.findById(chatId);
        if (!chat?.isGroup) return;
        const isAdmin = chat.admins.some((a) => a.toString() === userId);
        if (!isAdmin) return;
        if (!chat.admins.map((a) => a.toString()).includes(targetId)) {
          chat.admins.push(targetId);
          await chat.save();
        }
        const populated = await Chat.findById(chatId)
          .populate("users", "username avatar isOnline lastSeen")
          .populate("admins", "username avatar")
          .populate("lastMessage");
        io.to(chatId).emit("group:updated", populated);
      } catch (err) {
        console.error("group:promote_admin error", err.message);
      }
    });

    // ── WebRTC call signaling ──────────────────────────────
    socket.on("call-user", ({ to, signal, from, callType, chatId }) => {
      // Include caller's user info so receiver can show name/avatar
      io.to(String(to)).emit("incoming-call", {
        signal,
        from,
        callType,
        chatId,
        callerInfo: {
          _id: socket.user._id,
          username: socket.user.username,
          avatar: socket.user.avatar,
        },
      });
    });
    socket.on("answer-call", ({ signal, to }) => {
      io.to(String(to)).emit("call-accepted", signal);
    });
    socket.on("end-call", ({ to }) => {
      io.to(String(to)).emit("call-ended");
    });

    // ── Disconnect ─────────────────────────────────────────
    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });
      io.emit("user:offline", { userId, lastSeen: new Date() });
      console.log(`Socket disconnected: ${socket.user.username}`);
    });
  });
};

const getOnlineUsers = () => Array.from(onlineUsers.keys());

module.exports = { initSocket, getOnlineUsers, getIO };
