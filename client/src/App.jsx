import {
  useEffect,
  useState,
} from "react";

import useThemeStore
from "./store/themeStore";
import {

  BrowserRouter,

  Routes,

  Route,

  Navigate,

} from "react-router-dom";

import {
  Toaster,
} from "react-hot-toast";

import useAuthStore
from "./store/authStore";

import useCallStore
from "./store/callStore";

import {
  getSocket,
} from "./sockets/socket";

import ProtectedRoute
from "./routes/ProtectedRoute";

import LoginPage
from "./pages/LoginPage";

import SignupPage
from "./pages/SignupPage";

import HomePage
from "./pages/HomePage";

import ChatPage
from "./pages/ChatPage";

import ProfilePage
from "./pages/ProfilePage";

import CallModal
from "./components/CallModal";

const App =
() => {

  const {

    loadUser,

    isAuthenticated,

    user,

  } = useAuthStore();

  const {
  theme,
} = useThemeStore();

useEffect(() => {

  document.body.className =
    theme;

}, []);

  const {

    activeCall,

    incomingCall,

    setIncomingCall,

    acceptIncomingCall,

    rejectIncomingCall,

    clearCall,

  } = useCallStore();

  const [
    checking,
    setChecking,
  ] = useState(true);

  // LOAD USER
  useEffect(() => {

    loadUser()
      .finally(() => {

        setChecking(
          false
        );

      });

  }, []);

  // GLOBAL SOCKET CALL LISTENER
  useEffect(() => {

    const socket =
      getSocket();

    if (
      !socket ||

      !user
    ) {

      return;

    }

    // REMOVE OLD
    socket.off(
      "incoming-call"
    );

    // INCOMING CALL
    socket.on(
      "incoming-call",
      ({
        from,
        signal,
        callType,
        chatId,
      }) => {

        // IGNORE OWN
        if (

          String(from) ===
          String(user._id)

        ) {

          return;

        }

        setIncomingCall({

          caller: {

            _id:
              from,

            username:
              "Incoming Call",

          },

          signal,

          callType,

          chatId,

        });

      }
    );

    return () => {

      socket.off(
        "incoming-call"
      );

    };

  }, [user]);

  // LOADING
  if (checking) {

    return (

      <div className="min-h-screen bg-gray-950 flex items-center justify-center">

        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />

      </div>

    );

  }

  return (

    <BrowserRouter>

      {/* TOASTER */}
      <Toaster
        position="top-right"
        toastOptions={{

          style: {

            background:
              "#1f2937",

            color:
              "#f9fafb",

            border:
              "1px solid #374151",

          },

        }}
      />

      {/* ROUTES */}
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={

            isAuthenticated

              ? (
                  <Navigate
                    to="/"
                    replace
                  />
                )

              : (
                  <LoginPage />
                )

          }
        />

        {/* SIGNUP */}
        <Route
          path="/signup"
          element={

            isAuthenticated

              ? (
                  <Navigate
                    to="/"
                    replace
                  />
                )

              : (
                  <SignupPage />
                )

          }
        />

        {/* PROTECTED */}
        <Route
          path="/"
          element={

            <ProtectedRoute>

              <HomePage />

            </ProtectedRoute>

          }
        >

          {/* EMPTY */}
          <Route
            index
            element={

              <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-center p-8">

                <div className="text-6xl mb-4">

                  💬

                </div>

                <h2 className="text-xl font-semibold text-white mb-2">

                  Your Messages

                </h2>

                <p className="text-gray-500 text-sm">

                  Select a conversation or search for a user to start chatting

                </p>

              </div>

            }
          />

          {/* CHAT */}
          <Route
            path="chat/:chatId"
            element={
              <ChatPage />
            }
          />

          {/* PROFILE */}
          <Route
            path="profile"
            element={
              <ProfilePage />
            }
          />

        </Route>

        {/* FALLBACK */}
        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

      {/* INCOMING CALL POPUP */}
      {incomingCall &&
        !activeCall && (

          <div className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center">

            <div className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">

              <div className="text-7xl mb-4">

                {

                  incomingCall
                    .callType ===
                  "video"

                    ? "🎥"

                    : "📞"

                }

              </div>

              <h2 className="text-2xl font-bold text-white mb-2">

                Incoming {

                  incomingCall
                    .callType ===
                  "video"

                    ? "Video"

                    : "Audio"

                } Call

              </h2>

              <p className="text-gray-400 mb-8">

                {
                  incomingCall
                    ?.caller
                    ?.username
                }

              </p>

              <div className="flex justify-center gap-6">

                {/* REJECT */}
                <button
                  onClick={
                    rejectIncomingCall
                  }
                  className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-3xl"
                >

                  ❌

                </button>

                {/* ACCEPT */}
                <button
                  onClick={
                    acceptIncomingCall
                  }
                  className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 text-3xl"
                >

                  ✅

                </button>

              </div>

            </div>

          </div>

      )}

      {/* ACTIVE CALL */}
      {activeCall && (

        <CallModal

          user={user}

          remoteUser={
            activeCall.remoteUser
          }

          chatId={
            activeCall.chatId
          }

          callType={
            activeCall.callType
          }

          isCaller={
            activeCall.isCaller
          }

          callerSignal={
            activeCall.callerSignal
          }

          onClose={
            clearCall
          }

        />

      )}

    </BrowserRouter>

  );

};


export default
  App;