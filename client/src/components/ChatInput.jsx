import {
  useState,
  useRef,
} from "react";

import toast from "react-hot-toast";

import {
  messageService,
} from "../services/chatService";

const ChatInput =
  ({ chatId }) => {

    const [

      content,

      setContent,

    ] = useState("");

    const [

      isRecording,

      setIsRecording,

    ] = useState(false);

    const mediaRecorderRef =
      useRef(null);

    const streamRef =
      useRef(null);

    const audioChunksRef =
      useRef([]);

    // SEND TEXT
    const sendText =
      async () => {

        if (
          !content.trim()
        ) return;

        try {

          const formData =
            new FormData();

          formData.append(
            "chatId",
            chatId
          );

          formData.append(
            "content",
            content
          );

          formData.append(
            "type",
            "text"
          );

          await messageService.sendMessage(
            formData
          );

          setContent("");

        } catch {

          toast.error(
            "Message failed"
          );

        }

      };

    // START RECORDING
    const startRecording =
      async () => {

        try {

          const stream =
            await navigator.mediaDevices.getUserMedia({

              audio: true,

            });

          streamRef.current =
            stream;

          audioChunksRef.current =
            [];

          const recorder =
            new MediaRecorder(
              stream
            );

          mediaRecorderRef.current =
            recorder;

          recorder.ondataavailable =
            (event) => {

              if (
                event.data.size > 0
              ) {

                audioChunksRef.current.push(
                  event.data
                );

              }

            };

          recorder.start();

          setIsRecording(
            true
          );

        } catch (
          err
        ) {

          console.error(
            err
          );

          toast.error(
            "Microphone denied"
          );

        }

      };

    // STOP RECORDING
    const stopRecording =
      () => {

        const recorder =
          mediaRecorderRef.current;

        if (
          !recorder
        ) return;

        recorder.onstop =
          async () => {

            try {

              const blob =
                new Blob(

                  audioChunksRef.current,

                  {
                    type:
                      "audio/wav",
                  }
                );

              console.log(
                "VOICE SIZE:",
                blob.size
              );

              if (
                blob.size <
                2000
              ) {

                toast.error(
                  "Record longer"
                );

                return;

              }

              const file =
                new File(
                  [blob],
                  `voice-${Date.now()}.wav`,
                  {
                    type:
                      "audio/wav",
                  }
                );

              const formData =
                new FormData();

              formData.append(
                "chatId",
                chatId
              );

              formData.append(
                "type",
                "audio"
              );

              formData.append(
                "file",
                file
              );

              await messageService.sendMessage(
                formData
              );

              toast.success(
                "Voice sent"
              );

            } catch (
              err
            ) {

              console.error(
                err
              );

              toast.error(
                "Voice failed"
              );

            } finally {

              streamRef.current
                ?.getTracks()
                .forEach(
                  (
                    track
                  ) =>
                    track.stop()
                );

              setIsRecording(
                false
              );

            }

          };

        recorder.stop();

      };

    return (

      <div className="p-3 border-t border-gray-800 bg-gray-900 flex items-center gap-3">

        {/* INPUT */}
        <input
          type="text"
          value={content}
          disabled={
            isRecording
          }
          onChange={(e) =>
            setContent(
              e.target.value
            )
          }
          onKeyDown={(e) => {

            if (
              e.key ===
              "Enter"
            ) {

              sendText();

            }

          }}
          placeholder={
            isRecording

              ? "Recording..."

              : "Type a message..."
          }
          className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-2xl outline-none"
        />

        {/* MIC */}
        {!isRecording ? (

          <button
            onClick={
              startRecording
            }
            className="w-12 h-12 rounded-2xl bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white text-xl"
          >

            🎤

          </button>

        ) : (

          <button
            onClick={
              stopRecording
            }
            className="w-12 h-12 rounded-2xl bg-red-600 animate-pulse flex items-center justify-center text-white text-xl"
          >

            ⏹

          </button>

        )}

        {/* SEND */}
        <button
          onClick={
            sendText
          }
          className="w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white text-xl"
        >

          ➤

        </button>

      </div>

    );

  };

export default
  ChatInput;