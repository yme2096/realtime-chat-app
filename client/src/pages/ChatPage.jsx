import {
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import {
  formatDistanceToNow,
} from "date-fns";

import useChatStore
from "../store/chatStore";

import useAuthStore
from "../store/authStore";

import useCallStore
from "../store/callStore";

import {
  getSocket,
} from "../sockets/socket";

import MessageBubble
from "../components/MessageBubble";

import ChatInput
from "../components/ChatInput";

import Avatar
from "../components/Avatar";

import GroupInfoPanel
from "../components/GroupInfoPanel";

import CallModal
from "../components/CallModal";

const TypingIndicator =
  () => (

    <div className="flex items-center gap-1 px-4 py-2">

      <div className="flex gap-1">

        {[0,1,2].map(
          (i) => (

            <span
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
              style={{
                animationDelay:
                  `${i * 0.15}s`,
              }}
            />

          )
        )}

      </div>

      <span className="text-xs text-gray-400 ml-1">

        typing...

      </span>

    </div>

  );

const ChatPage =
  () => {

    const {
      chatId,
    } = useParams();

    const bottomRef =
      useRef(null);

    const isFirstLoad =
      useRef(true);

    const {
      messages,
      fetchMessages,
      activeChat,
      setActiveChat,
      typingUsers,
      hasMoreMessages,
      currentPage,
      isLoadingMessages,
      clearUnread,
    } = useChatStore();

    const {
      user,
    } = useAuthStore();

    const {
      activeCall,
      setActiveCall,
      clearCall,
    } = useCallStore();

    const [
      showGroupInfo,
      setShowGroupInfo,
    ] = useState(false);

    const typingInChat =
      typingUsers[
        chatId
      ] || [];

    // RESTORE CHAT
    useEffect(() => {

      if (!chatId)
        return;

      if (

        !activeChat ||

        activeChat._id !==
          chatId

      ) {

        useChatStore
          .getState()
          .fetchChats()
          .then(() => {

            const found =
              useChatStore
                .getState()
                .chats
                .find(
                  (c) =>
                    c._id ===
                    chatId
                );

            if (found) {

              setActiveChat(
                found
              );

            }

          });

      }

    }, [chatId]);

    // LOAD MESSAGES
    useEffect(() => {

      if (!chatId)
        return;

      isFirstLoad.current =
        true;

      const socket =
        getSocket();

      const loadMessages =
        async () => {

          try {

            await fetchMessages(
              chatId,
              1
            );

            socket?.emit(
              "chat:join",
              chatId
            );

            socket?.emit(
              "message:read",
              {
                chatId,
              }
            );

            clearUnread(
              chatId
            );

          } catch (
            err
          ) {

            console.error(
              err
            );

          }

        };

      loadMessages();

      const onReconnect =
        () => {

          getSocket()?.emit(
            "chat:join",
            chatId
          );

        };

      socket?.on(
        "connect",
        onReconnect
      );

      return () => {

        getSocket()?.emit(
          "chat:leave",
          chatId
        );

        socket?.off(
          "connect",
          onReconnect
        );

      };

    }, [chatId]);

    // AUTO SCROLL
    useEffect(() => {

      if (
        !bottomRef.current
      )

        return;

      bottomRef.current
        .scrollIntoView({

          behavior:
            isFirstLoad.current

              ? "instant"

              : "smooth",

        });

      isFirstLoad.current =
        false;

    }, [messages]);

    // PAGINATION
    const handleScroll =
      useCallback(
        (e) => {

          if (

            e.target
              .scrollTop ===
              0 &&

            hasMoreMessages &&

            !isLoadingMessages

          ) {

            fetchMessages(
              chatId,
              currentPage + 1
            );

          }

        },

        [

          chatId,

          hasMoreMessages,

          isLoadingMessages,

          currentPage,

        ]
      );

    // USERS
    const getParticipants =
      () =>

        activeChat
          ?.participants ||

        activeChat?.users ||

        [];

    const getOtherUser =
      () =>

        getParticipants()
          .find(
            (u) =>

              String(
                u._id
              ) !==

              String(
                user?._id
              )
          );

    // CHAT NAME
    const getChatName =
      () => {

        if (!activeChat)
          return "Loading...";

        if (
          activeChat.isGroup
        ) {

          return (

            activeChat.name ||

            activeChat.chatName ||

            "Group"

          );

        }

        return (

          getOtherUser()
            ?.username ||

          "Chat"

        );

      };

    // CHAT AVATAR
    const getChatAvatar =
      () => {

        if (!activeChat)
          return null;

        if (
          activeChat.isGroup
        ) {

          return (

            activeChat.avatar ||

            activeChat.groupAvatar ||

            null

          );

        }

        return (
          getOtherUser()
            ?.avatar || null
        );

      };

    // STATUS
    const getSubtitle =
      () => {

        if (!activeChat)
          return "";

        if (
          activeChat.isGroup
        ) {

          return `${getParticipants().length} members`;

        }

        const other =
          getOtherUser();

        if (
          other?.isOnline
        ) {

          return "Online";

        }

        if (
          other?.lastSeen
        ) {

          return `Last seen ${formatDistanceToNow(
            new Date(
              other.lastSeen
            ),
            {
              addSuffix:
                true,
            }
          )}`;

        }

        return "";

      };

    // START CALL
    const startCall =
      (type) => {

        const other =
          getOtherUser();

        if (!other)
          return;

        setActiveCall({

          chatId,

          callType:
            type,

          isCaller:
            true,

          remoteUser:
            other,

          callerSignal:
            null,

        });

      };

    // EMPTY
    if (!chatId) {

      return (

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

      );

    }

    return (

      <div className="flex flex-1 h-screen overflow-hidden">

        {/* CHAT */}
        <div className="flex flex-col flex-1 bg-gray-950 min-w-0">

          {/* HEADER */}
          <div className="flex items-center gap-3 p-4 border-b border-gray-800 bg-gray-900 shrink-0">

            <Avatar
              src={getChatAvatar()}
              name={getChatName()}
              size="md"
            />

            <div className="flex-1 min-w-0">

              <p className="font-semibold text-white truncate">

                {getChatName()}

              </p>

              {typingInChat.length > 0 ? (

                <p className="text-xs text-green-400">

                  typing...

                </p>

              ) : (

                <p className="text-xs text-gray-400">

                  {getSubtitle()}

                </p>

              )}

            </div>

            {!activeChat?.isGroup && (

              <>

                <button
                  onClick={() =>
                    startCall("audio")
                  }
                  className="p-2 text-gray-400 hover:text-green-400 hover:bg-gray-800 rounded-xl transition-colors"
                >

                  📞

                </button>

                <button
                  onClick={() =>
                    startCall("video")
                  }
                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-xl transition-colors"
                >

                  🎥

                </button>

              </>

            )}

          </div>

          {/* MESSAGES */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-2"
            onScroll={handleScroll}
          >

            {/* LOADING */}
            {isLoadingMessages &&
              messages.length === 0 && (

                <div className="flex flex-col gap-3 animate-pulse">

                  {[1,2,3,4,5].map(
                    (i) => (

                      <div
                        key={i}
                        className={`max-w-[70%] h-14 rounded-2xl ${
                          i % 2 === 0

                            ? "ml-auto bg-indigo-500/20"

                            : "bg-gray-800"
                        }`}
                      />

                    )
                  )}

                </div>

            )}

            {/* EMPTY */}
            {!isLoadingMessages &&
              messages.length === 0 && (

                <div className="h-full flex items-center justify-center text-gray-500 text-sm">

                  No messages yet

                </div>

            )}

            {/* CHAT */}
            {messages.map(
              (msg) => (

                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={
                    String(
                      msg.sender?._id ||
                      msg.sender
                    ) ===
                    String(
                      user?._id
                    )
                  }
                />

              )
            )}

            {typingInChat.length >
              0 && (

              <TypingIndicator />

            )}

            <div ref={bottomRef} />

          </div>

          {/* INPUT */}
          <ChatInput
            chatId={chatId}
          />

        </div>

        {/* GROUP */}
        {showGroupInfo &&
          activeChat?.isGroup && (

            <GroupInfoPanel
              chat={activeChat}
              onClose={() =>
                setShowGroupInfo(false)
              }
            />

          )}

        {/* CALL */}
        {activeCall &&
          activeCall.chatId ===
            chatId && (

            <CallModal
              user={user}
              remoteUser={
                activeCall.remoteUser
              }
              chatId={chatId}
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

      </div>

    );

  };

export default ChatPage;