import { useState } from "react";

import { format }
from "date-fns";

import EmojiPicker
from "emoji-picker-react";

import {
  getSocket,
} from "../sockets/socket";

import useAuthStore
from "../store/authStore";

const MessageBubble =
({
  message,
  isOwn,
}) => {

  const { user } =
    useAuthStore();

  const [
    showActions,
    setShowActions,
  ] = useState(false);

  const [
    showEmojiPicker,
    setShowEmojiPicker,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState(false);

  const [
    editContent,
    setEditContent,
  ] = useState(
    message.content || ""
  );

  // DELETE
  const handleDelete =
    () => {

      getSocket()?.emit(
        "message:delete",
        {

          messageId:
            message._id,

        }
      );

    };

  // EDIT
  const handleEdit =
    () => {

      if (
        !editContent.trim()
      ) {

        return;

      }

      getSocket()?.emit(
        "message:edit",
        {

          messageId:
            message._id,

          content:
            editContent,

        }
      );

      setEditing(
        false
      );

    };

  // REACT
  const handleReact =
    (emojiData) => {

      getSocket()?.emit(
        "message:react",
        {

          messageId:
            message._id,

          emoji:
            emojiData.emoji,

        }
      );

      setShowEmojiPicker(
        false
      );

    };

  // DELETED
  if (
    message.isDeleted
  ) {

    return (

      <div
        className={`flex ${
          isOwn
            ? "justify-end"
            : "justify-start"
        } mb-2`}
      >

        <span className="text-xs text-gray-500 italic px-3 py-2 bg-gray-800 rounded-xl">

          This message was deleted

        </span>

      </div>

    );

  }

  // TYPES
  const isAudio =
    message.type ===
    "audio";

  const isImage =
    message.type ===
    "image";

  const isVideo =
    message.type ===
    "video";

  const isFile =
    message.type ===
    "file";

  const isCall =
    message.type ===
    "call";

  return (

    <div
      className={`flex ${
        isOwn
          ? "justify-end"
          : "justify-start"
      } mb-2 group`}
      onMouseEnter={() =>
        setShowActions(
          true
        )
      }
      onMouseLeave={() => {

        setShowActions(
          false
        );

        setShowEmojiPicker(
          false
        );

      }}
    >

      <div className="max-w-xs lg:max-w-md relative">

        {/* REPLY */}
        {message.replyTo && (

          <div className="text-xs text-gray-400 bg-gray-700 rounded-t-xl px-3 py-1.5 border-l-2 border-indigo-400 mb-0.5">

            <p className="font-medium text-indigo-300 text-xs">

              {message.replyTo
                .sender
                ?.username ||
                "Reply"}

            </p>

            <p className="truncate">

              {message.replyTo
                .content ||
                "Media"}

            </p>

          </div>

        )}

        {/* MAIN BUBBLE */}
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isOwn
              ? "bg-indigo-600 text-white rounded-br-sm"
              : "bg-gray-800 text-gray-100 rounded-bl-sm"
          }`}
        >

          {/* GROUP USERNAME */}
          {!isOwn &&
            message.sender
              ?.username && (

              <p className="text-xs font-semibold text-indigo-400 mb-1">

                {
                  message.sender
                    .username
                }

              </p>

            )}

          {/* EDIT MODE */}
          {editing ? (

            <div className="space-y-2">

              <textarea
                value={
                  editContent
                }
                onChange={(
                  e
                ) =>
                  setEditContent(
                    e.target
                      .value
                  )
                }
                className="w-full bg-indigo-700 text-white rounded-lg px-2 py-1 text-sm resize-none"
                rows={2}
              />

              <div className="flex gap-2 text-xs">

                <button
                  onClick={
                    handleEdit
                  }
                >
                  Save
                </button>

                <button
                  onClick={() =>
                    setEditing(
                      false
                    )
                  }
                >
                  Cancel
                </button>

              </div>

            </div>

          ) : (

            <>
              {/* CALL */}
              {isCall && (

                <div className="flex items-center gap-3 min-w-[220px]">

                  <div className="text-4xl">

                    {message.content?.includes(
                      "Video"
                    )

                      ? "🎥"

                      : "📞"}

                  </div>

                  <div>

                    <p className="font-semibold text-lg">

                      {
                        message.content
                      }

                    </p>

                    <p className="text-sm opacity-80">

                      Call History

                    </p>

                  </div>

                </div>

              )}

              {/* TEXT */}
              {!isAudio &&
                !isImage &&
                !isVideo &&
                !isFile &&
                !isCall && (

                  <p className="break-words whitespace-pre-wrap text-[15px]">

                    {
                      message.content
                    }

                  </p>

              )}

              {/* AUDIO */}
              {isAudio && (

                <div className="w-[250px]">

                  <p className="mb-2 text-sm font-medium">

                    🎤 Voice Message

                  </p>

                  <audio
                    controls
                    className="w-full"
                  >

                    <source
                      src={
                        message
                          .media
                          ?.url
                      }
                      type="audio/wav"
                    />

                    Your browser does not support audio.

                  </audio>

                </div>

              )}

              {/* IMAGE */}
              {isImage && (

                <img
                  src={
                    message
                      .media
                      ?.url
                  }
                  alt="img"
                  className="rounded-xl max-w-full"
                />

              )}

              {/* VIDEO */}
              {isVideo && (

                <video
                  controls
                  className="rounded-xl max-w-full"
                >

                  <source
                    src={
                      message
                        .media
                        ?.url
                    }
                  />

                </video>

              )}

              {/* FILE */}
              {isFile && (

                <a
                  href={
                    message
                      .media
                      ?.url
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-sm"
                >

                  📄 Download File

                </a>

              )}
            </>

          )}

          {/* REACTIONS */}
          {message.reactions
            ?.length > 0 && (

            <div className="flex flex-wrap gap-1 mt-2">

              {Object.entries(

                message.reactions.reduce(

                  (
                    acc,
                    r
                  ) => {

                    acc[
                      r.emoji
                    ] =

                      (
                        acc[
                          r
                            .emoji
                        ] || 0
                      ) + 1;

                    return acc;

                  },

                  {}

                )

              ).map(
                ([
                  emoji,
                  count,
                ]) => (

                  <button
                    key={
                      emoji
                    }
                    onClick={() =>
                      getSocket()?.emit(
                        "message:react",
                        {
                          messageId:
                            message._id,
                          emoji,
                        }
                      )
                    }
                    className="text-xs bg-gray-700 rounded-full px-2 py-0.5"
                  >

                    {emoji}

                    {count > 1 &&
                      ` ${count}`}

                  </button>

                )
              )}

            </div>

          )}

          {/* FOOTER */}
          <div className="flex items-center justify-end gap-1 mt-2">

            {message.isEdited && (

              <span className="text-[10px] opacity-50">

                edited

              </span>

            )}

            <span className="text-[10px] opacity-50">

              {message.createdAt

                ? format(
                    new Date(
                      message.createdAt
                    ),
                    "hh:mm a"
                  )

                : ""}

            </span>

            {isOwn && (

              <span
                className={`text-[10px] ${
                  message.seenBy
                    ?.length > 1
                    ? "text-blue-300"
                    : "opacity-50"
                }`}
              >

                {message.seenBy
                  ?.length > 1
                  ? "✓✓"
                  : "✓"}

              </span>

            )}

          </div>

        </div>

        {/* ACTIONS */}
        {showActions &&
          !editing && (

            <div
              className={`absolute top-0 ${
                isOwn
                  ? "left-0 -translate-x-full pr-1"
                  : "right-0 translate-x-full pl-1"
              } flex items-center gap-1`}
            >

              <button
                onClick={() =>
                  setShowEmojiPicker(
                    !showEmojiPicker
                  )
                }
                className="text-gray-400 hover:text-white bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center text-sm"
              >
                😊
              </button>

              {isOwn &&
                message.type ===
                  "text" && (

                  <button
                    onClick={() => {

                      setEditing(
                        true
                      );

                      setEditContent(
                        message.content
                      );

                    }}
                    className="text-gray-400 hover:text-white bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center text-sm"
                  >
                    ✏️
                  </button>

                )}

              {isOwn && (

                <button
                  onClick={
                    handleDelete
                  }
                  className="text-gray-400 hover:text-red-400 bg-gray-800 rounded-full w-7 h-7 flex items-center justify-center text-sm"
                >
                  🗑
                </button>

              )}

            </div>

          )}

        {/* EMOJI PICKER */}
        {showEmojiPicker && (

          <div
            className={`absolute z-[9999] ${
              isOwn
                ? "right-0"
                : "left-0"
            } top-full mt-2`}
          >

            <EmojiPicker
              onEmojiClick={
                handleReact
              }
              theme="dark"
              height={350}
              width={300}
            />

          </div>

        )}

      </div>

    </div>

  );

};

export default
  MessageBubble;