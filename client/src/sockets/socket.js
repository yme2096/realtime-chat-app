import {
  io,
} from "socket.io-client";

const SOCKET_URL =

  import.meta.env
    .VITE_SOCKET_URL ||

  "http://localhost:5000";

// SOCKET INSTANCE
let socket = null;

// GET SOCKET
export const getSocket =
  () => socket;

// CONNECT SOCKET
export const connectSocket =
  (
    token,
    userId
  ) => {

    // EXISTING CONNECTED SOCKET
    if (

      socket &&

      socket.connected

    ) {

      return socket;

    }

    // CLEAN OLD SOCKET
    if (socket) {

      socket.removeAllListeners();

      socket.disconnect();

    }

    // CREATE SOCKET
    socket = io(

      SOCKET_URL,

      {

        auth: {

          token,

        },

        transports: [

          "websocket",

        ],

        reconnection:
          true,

        reconnectionAttempts:
          10,

        reconnectionDelay:
          1000,

        autoConnect:
          true,

      }
    );

    // CONNECT
    socket.on(
      "connect",
      () => {

        console.log(
          "SOCKET CONNECTED:",
          socket.id
        );

        // USER ROOM
        socket.emit(
          "join",
          String(userId)
        );

        // CALL SETUP
        socket.emit(
          "setup",
          String(userId)
        );

      }
    );

    // DISCONNECT
    socket.on(
      "disconnect",
      (reason) => {

        console.log(
          "SOCKET DISCONNECTED:",
          reason
        );

      }
    );

    // RECONNECT
    socket.io.on(
      "reconnect",
      () => {

        console.log(
          "SOCKET RECONNECTED"
        );

        socket.emit(
          "join",
          String(userId)
        );

      }
    );

    // ERROR
    socket.on(
      "connect_error",
      (err) => {

        console.error(
          "SOCKET ERROR:",
          err.message
        );

      }
    );

    return socket;

  };

// DISCONNECT SOCKET
export const disconnectSocket =
  () => {

    if (socket) {

      socket.removeAllListeners();

      socket.disconnect();

      socket = null;

    }

  };