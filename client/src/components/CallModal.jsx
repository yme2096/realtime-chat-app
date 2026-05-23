import {
  useEffect,
  useRef,
  useState,
} from "react";

import Peer
from "simple-peer/simplepeer.min.js";

import {
  getSocket,
} from "../sockets/socket";

import {
  chatService,
} from "../services/chatService";

import Avatar
from "./Avatar";

const CallModal =
({
  user,
  remoteUser,
  chatId,
  callType,
  isCaller,
  callerSignal,
  onClose,
}) => {

  const socket =
    getSocket();

  const [
    callStatus,
    setCallStatus,
  ] = useState(

    isCaller

      ? "calling"

      : "incoming"
  );

  const [
    duration,
    setDuration,
  ] = useState(0);

  const [
    isMuted,
    setIsMuted,
  ] = useState(false);

  const [
    isCamOff,
    setIsCamOff,
  ] = useState(false);

  const myVideo =
    useRef(null);

  const remoteVideo =
    useRef(null);

  const remoteAudio =
    useRef(null);

  const peerRef =
    useRef(null);

  const streamRef =
    useRef(null);

  const endedRef =
    useRef(false);

  const timerRef =
    useRef(null);

  const durationRef =
    useRef(0);

  // FORMAT TIME
  const formatTime =
    (sec) => {

      const mins =
        Math.floor(
          sec / 60
        );

      const secs =
        sec % 60;

      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    };

  // CLEANUP
  const cleanup =
    () => {

      clearInterval(
        timerRef.current
      );

      // PEER
      if (
        peerRef.current
      ) {

        try {

          peerRef.current.removeAllListeners();

          peerRef.current.destroy();

        } catch {}

        peerRef.current =
          null;

      }

      // STREAM
      if (
        streamRef.current
      ) {

        streamRef.current
          .getTracks()
          .forEach(
            (track) => {

              try {

                track.stop();

              } catch {}

            }
          );

        streamRef.current =
          null;

      }

    };

  // SAVE HISTORY
  const saveCallHistory =
    async () => {

      try {

        if (!chatId)
          return;

        await chatService
          .createCallMessage({

            chatId,

            callType,

            duration:
              durationRef.current,

          });

      } catch (err) {

        console.log(
          "CALL HISTORY ERROR:",
          err
        );

      }

    };

  // END CALL
  const endCall =
    async (
      notify = true
    ) => {

      // PREVENT DOUBLE END
      if (
        endedRef.current
      ) {

        return;

      }

      endedRef.current =
        true;

      // NOTIFY REMOTE
      if (
        notify &&

        remoteUser?._id
      ) {

        socket?.emit(
          "end-call",
          {

            to:
              String(
                remoteUser._id
              ),

          }
        );

      }

      // SAVE HISTORY
      await saveCallHistory();

      // CLEANUP
      cleanup();

      // CLOSE MODAL
      onClose();

    };

  // MAIN EFFECT
  useEffect(() => {

    let cancelled =
      false;

    // CALL ACCEPTED
    const handleAccepted =
      (signal) => {

        if (

          peerRef.current &&

          !peerRef.current
            .destroyed

        ) {

          try {

            peerRef.current.signal(
              signal
            );

          } catch {}

        }

      };

    // REMOTE ENDED
    const handleEnded =
      () => {

        if (
          endedRef.current
        ) {

          return;

        }

        endCall(false);

      };

    // SOCKET EVENTS
    socket?.off(
      "call-accepted"
    );

    socket?.off(
      "call-ended"
    );

    socket?.on(
      "call-accepted",
      handleAccepted
    );

    socket?.on(
      "call-ended",
      handleEnded
    );

    // GET MEDIA
    navigator
      .mediaDevices
      .getUserMedia({

        audio: true,

        video:
          callType ===
          "video",

      })

      .then(
        (stream) => {

          if (
            cancelled
          ) {

            stream
              .getTracks()
              .forEach(
                (t) =>
                  t.stop()
              );

            return;

          }

          streamRef.current =
            stream;

          // LOCAL VIDEO
          if (

            callType ===
              "video" &&

            myVideo.current

          ) {

            myVideo.current.srcObject =
              stream;

          }

          // PEER
          const peer =
            new Peer({

              initiator:
                isCaller,

              trickle:
                false,

              stream,

              config: {

                iceServers: [

                  {

                    urls:
                      "stun:stun.l.google.com:19302",

                  },

                ],

              },

            });

          // SIGNAL
          peer.on(
            "signal",
            (signalData) => {

              // CALLER
              if (
                isCaller
              ) {

                socket?.emit(
                  "call-user",
                  {

                    to:
                      String(
                        remoteUser._id
                      ),

                    signal:
                      signalData,

                    from:
                      String(
                        user._id
                      ),

                    callType,

                    chatId,

                  }
                );

              }

              // RECEIVER
              else {

                socket?.emit(
                  "answer-call",
                  {

                    signal:
                      signalData,

                    to:
                      String(
                        remoteUser._id
                      ),

                  }
                );

              }

            }
          );

          // REMOTE STREAM
         peer.on(
  "stream",
  (remoteStream) => {

    // BLOCK SAME CAMERA
    if (

      streamRef.current &&

      remoteStream.id ===
      streamRef.current.id

    ) {

      return;

    }

    // VIDEO
    if (
      remoteVideo.current
    ) {

      remoteVideo.current.srcObject =
        remoteStream;

    }

    // AUDIO
    if (
      remoteAudio.current
    ) {

      remoteAudio.current.srcObject =
        remoteStream;

    }

  }
);

          // CONNECTED
          peer.on(
            "connect",
            () => {

              setCallStatus(
                "connected"
              );

              timerRef.current =
                setInterval(
                  () => {

                    durationRef.current +=
                      1;

                    setDuration(
                      durationRef.current
                    );

                  },
                  1000
                );

            }
          );

          // PEER CLOSE
          peer.on(
            "close",
            () => {

              if (
                endedRef.current
              ) {

                return;

              }

              endCall(false);

            }
          );

          // PEER ERROR
          peer.on(
            "error",
            (err) => {

              console.log(
                "PEER ERROR:",
                err
              );

              if (
                endedRef.current
              ) {

                return;

              }

              endCall(false);

            }
          );

          peerRef.current =
            peer;

          // RECEIVER SIGNAL
          if (

            !isCaller &&

            callerSignal

          ) {

            try {

              peer.signal(
                callerSignal
              );

              setCallStatus(
                "connecting"
              );

            } catch (err) {

              console.log(
                err
              );

            }

          }

        }
      )

      .catch(
        (err) => {

          console.log(
            "MEDIA ERROR:",
            err
          );

          setCallStatus(
            "error"
          );

        }
      );

    // CLEANUP
    return () => {

      cancelled = true;

      socket?.off(
        "call-accepted",
        handleAccepted
      );

      socket?.off(
        "call-ended",
        handleEnded
      );

      cleanup();

    };

  }, []);

  // TOGGLE MUTE
  const toggleMute =
    () => {

      streamRef.current
        ?.getAudioTracks()
        .forEach(
          (track) => {

            track.enabled =
              isMuted;

          }
        );

      setIsMuted(
        !isMuted
      );

    };

  // TOGGLE CAMERA
  const toggleCamera =
    () => {

      streamRef.current
        ?.getVideoTracks()
        .forEach(
          (track) => {

            track.enabled =
              isCamOff;

          }
        );

      setIsCamOff(
        !isCamOff
      );

    };

  // STATUS TEXT
  const statusText = {

    calling:
      "Calling...",

    incoming:
      "Incoming Call...",

    connecting:
      "Connecting...",

    connected:
      formatTime(
        duration
      ),

    error:
      "Media Error",

  }[callStatus];

  return (

    <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-4">

      <div className="bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">

        {/* VIDEO */}
        {callType ===
        "video" ? (

          <div className="relative h-80 bg-black">

            {/* REMOTE */}
            <video
              ref={remoteVideo}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* LOCAL */}
            <video
              ref={myVideo}
              autoPlay
              muted
              playsInline
              className="absolute bottom-4 right-4 w-28 h-28 rounded-2xl object-cover border-2 border-gray-700 bg-gray-800"
            />

            {/* INFO */}
            <div className="absolute top-4 left-0 right-0 flex justify-center">

              <div className="bg-black/50 text-white px-4 py-2 rounded-full text-sm">

                {statusText}

              </div>

            </div>

          </div>

        ) : (

          // AUDIO
          <div className="flex flex-col items-center py-12 bg-gradient-to-b from-indigo-900 to-gray-900">

            <Avatar
              src={
                remoteUser?.avatar
              }
              name={
                remoteUser?.username
              }
              size="lg"
            />

            <h2 className="text-white text-2xl font-bold mt-6">

              {
                remoteUser?.username
              }

            </h2>

            <p className="text-indigo-300 mt-2">

              {statusText}

            </p>

          </div>

        )}

        {/* AUDIO */}
        <audio
          ref={remoteAudio}
          autoPlay
        />

        {/* CONTROLS */}
        <div className="flex justify-center items-center gap-5 p-6 bg-gray-900">

          {/* MUTE */}
          <button
            onClick={
              toggleMute
            }
            className={`w-14 h-14 rounded-full text-2xl flex items-center justify-center transition-all ${
              isMuted

                ? "bg-red-500"

                : "bg-gray-700 hover:bg-gray-600"
            }`}
          >

            {isMuted
              ? "🔇"
              : "🎙️"}

          </button>

          {/* CAMERA */}
          {callType ===
            "video" && (

            <button
              onClick={
                toggleCamera
              }
              className={`w-14 h-14 rounded-full text-2xl flex items-center justify-center transition-all ${
                isCamOff

                  ? "bg-red-500"

                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >

              {isCamOff
                ? "📷"
                : "🎥"}

            </button>

          )}

          {/* END */}
          <button
            onClick={() =>
              endCall(true)
            }
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-3xl flex items-center justify-center transition-all active:scale-95"
          >

            📵

          </button>

        </div>

      </div>

    </div>

  );

};

export default
  CallModal;