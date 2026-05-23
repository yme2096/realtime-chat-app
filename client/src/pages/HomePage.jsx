import {
  Outlet,
} from "react-router-dom";

import Sidebar
from "../components/Sidebar";

import IncomingCallToast
from "../components/IncomingCallToast";

import CallModal
from "../components/CallModal";

import useSocketEvents
from "../hooks/useSocketEvents";

import useCallStore
from "../store/callStore";

import useAuthStore
from "../store/authStore";

import {
  getSocket,
} from "../sockets/socket";

const HomePage =
  () => {

    // SOCKET EVENTS
    useSocketEvents();

    const {
      incomingCall,
      activeCall,
      acceptIncomingCall,
      clearCall,
    } = useCallStore();

    const {
      user,
    } = useAuthStore();

    // DECLINE CALL
    const handleDecline =
      () => {

        getSocket()
          ?.emit(
            "end-call",
            {

              to:
                incomingCall
                  ?.caller
                  ?._id,

            }
          );

        clearCall();

      };

    return (

      <div className="flex h-screen bg-gray-950 relative z-0">

        {/* SIDEBAR */}
        <Sidebar />

        {/* PAGE */}
        <Outlet />

        {/* INCOMING CALL TOAST */}
        {incomingCall &&
          !activeCall && (

            <IncomingCallToast

              caller={
                incomingCall.caller
              }

              callType={
                incomingCall.callType
              }

              onAccept={
                acceptIncomingCall
              }

              onDecline={
                handleDecline
              }

            />

          )}

        {/* RECEIVER CALL MODAL */}
        {activeCall &&
          !activeCall.isCaller && (

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
                false
              }

              callerSignal={
                activeCall.callerSignal
              }

              onClose={
                clearCall
              }

            />

          )}

      </div>

    );

  };

export default
  HomePage;