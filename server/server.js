require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const { initSocket } = require("./sockets/socketManager");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

// Notification routes — load only if file exists
let notificationRoutes;
try {
  notificationRoutes = require("./routes/notificationRoutes");
} catch {
  notificationRoutes = null;
}

const app = express();
const server = http.createServer(app);

// ── CORS ───────────────────────────────────────────────────
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(cors({
  origin: [CLIENT_URL, "http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));

// ── Socket.IO ──────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: [CLIENT_URL, "http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true,
  },
  pingTimeout: 60000,
});

initSocket(io);
app.set(
  "io",
  io
);

// ── Body parsing ───────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(
  "/uploads",
  express.static("uploads")
);

// ── Routes ─────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
if (notificationRoutes) app.use("/api/notifications", notificationRoutes);

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.get("/", (req, res) => res.send("Server Running"));

// ── Error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("ERROR:", err.message);
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    return res.status(400).json({ message: `${field} already exists` });
  }
  res.status(err.status || 500).json({ message: err.message || "Server Error" });
});

// ── Database ───────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Error:", err.message));

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
