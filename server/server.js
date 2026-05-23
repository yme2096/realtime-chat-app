require("dotenv").config();

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const { initSocket } = require("./sockets/socketManager");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");

// OPTIONAL NOTIFICATION ROUTES
let notificationRoutes;

try {

  notificationRoutes =
    require("./routes/notificationRoutes");

} catch {

  notificationRoutes = null;

}

const app = express();

const server =
  http.createServer(app);

// ─────────────────────────────────────────────
// ALLOWED ORIGINS
// ─────────────────────────────────────────────

const allowedOrigins = [

  "http://localhost:5173",

  "http://localhost:3000",

  "https://realtime-chat-app-beta-rose.vercel.app",

];

// ─────────────────────────────────────────────
// EXPRESS CORS
// ─────────────────────────────────────────────

app.use(

  cors({

    origin: function (
      origin,
      callback
    ) {

      // ALLOW POSTMAN / MOBILE APPS
      if (!origin) {

        return callback(
          null,
          true
        );

      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {

        callback(
          null,
          true
        );

      } else {

        callback(
          new Error(
            "Not allowed by CORS"
          )
        );

      }

    },

    credentials: true,

  })

);

// ─────────────────────────────────────────────
// SOCKET.IO
// ─────────────────────────────────────────────

const io = new Server(
  server,
  {

    cors: {

      origin:
        allowedOrigins,

      methods: [
        "GET",
        "POST",
      ],

      credentials: true,

    },

    pingTimeout: 60000,

  }
);

// INIT SOCKETS
initSocket(io);

// MAKE IO GLOBAL
app.set("io", io);

// ─────────────────────────────────────────────
// BODY PARSER
// ─────────────────────────────────────────────

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ─────────────────────────────────────────────
// STATIC UPLOADS
// ─────────────────────────────────────────────

app.use(

  "/uploads",

  express.static(
    path.join(
      __dirname,
      "uploads"
    )
  )

);

// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/users",
  userRoutes
);

app.use(
  "/api/chats",
  chatRoutes
);

app.use(
  "/api/messages",
  messageRoutes
);

if (notificationRoutes) {

  app.use(
    "/api/notifications",
    notificationRoutes
  );

}

// ─────────────────────────────────────────────
// HEALTH ROUTE
// ─────────────────────────────────────────────

app.get(
  "/health",
  (req, res) => {

    res.json({
      status: "ok",
    });

  }
);

// ROOT ROUTE
app.get(
  "/",
  (req, res) => {

    res.send(
      "Realtime Chat Backend Running"
    );

  }
);

// ─────────────────────────────────────────────
// ERROR HANDLER
// ─────────────────────────────────────────────

app.use(

  (
    err,
    req,
    res,
    next
  ) => {

    console.error(
      "SERVER ERROR:",
      err.message
    );

    // DUPLICATE KEY
    if (
      err.code === 11000
    ) {

      const field =
        Object.keys(
          err.keyValue || {}
        )[0] || "field";

      return res
        .status(400)
        .json({

          message:
            `${field} already exists`,

        });

    }

    res
      .status(
        err.status || 500
      )
      .json({

        message:
          err.message ||
          "Internal Server Error",

      });

  }

);

// ─────────────────────────────────────────────
// DATABASE
// ─────────────────────────────────────────────

mongoose
  .connect(
    process.env.MONGO_URI
  )
  .then(() => {

    console.log(
      "MongoDB Connected"
    );

  })
  .catch((err) => {

    console.error(
      "MongoDB Error:",
      err.message
    );

  });

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────

const PORT =
  process.env.PORT || 5000;

server.listen(
  PORT,
  () => {

    console.log(
      `Server running on port ${PORT}`
    );

  }
);