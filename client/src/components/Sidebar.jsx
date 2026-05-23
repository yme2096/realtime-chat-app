import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  formatDistanceToNow,
} from "date-fns";

import {
  toast,
} from "react-hot-toast";

import useChatStore
from "../store/chatStore";

import useAuthStore
from "../store/authStore";

import {

  chatService,

  userService,

} from "../services/chatService";

import Avatar
from "./Avatar";

import CreateGroupModal
from "./CreateGroupModal";

import NotificationBell
from "./NotificationBell";

const Sidebar =
  () => {

    const {

      chats,

      fetchChats,

      setActiveChat,

      activeChat,

      onlineUsers,

      unreadCounts,

      clearUnread,

      removeChat,

    } = useChatStore();

    const {

      user,

      logout,

    } = useAuthStore();

    const navigate =
      useNavigate();

    const [

      search,

      setSearch,

    ] = useState("");

    const [

      searchResults,

      setSearchResults,

    ] = useState([]);

    const [

      showGroupModal,

      setShowGroupModal,

    ] = useState(false);

    // LOAD CHATS
    useEffect(() => {

      fetchChats();

    }, []);

    // SEARCH USERS
    useEffect(() => {

      if (
        !search.trim()
      ) {

        setSearchResults(
          []
        );

        return;

      }

      const timer =
        setTimeout(
          async () => {

            try {

              const {
                data,
              } =

                await userService.searchUsers(
                  search
                );

              setSearchResults(
                data.users
              );

            } catch {

              setSearchResults(
                []
              );

            }

          },

          400
        );

      return () =>
        clearTimeout(
          timer
        );

    }, [search]);

    // OPEN DIRECT CHAT
    const openDirectChat =
      async (
        userId
      ) => {

        try {

          const {
            data,
          } =

            await chatService.getOrCreateDirect(
              userId
            );

          setActiveChat(
            data.chat
          );

          clearUnread(
            data.chat._id
          );

          setSearch("");

          setSearchResults(
            []
          );

          navigate(
            `/chat/${data.chat._id}`
          );

        } catch {

          toast.error(
            "Failed to open chat"
          );

        }

      };

    // OPEN CHAT
    const openChat =
      (chat) => {

        setActiveChat(
          chat
        );

        clearUnread(
          chat._id
        );

        navigate(
          `/chat/${chat._id}`
        );

      };

    // PARTICIPANTS
    const getParticipants =
      (chat) =>

        chat.participants ||

        chat.users ||

        [];

    // CHAT NAME
    const getChatName =
      (chat) => {

        if (
          chat.isGroup
        ) {

          return (

            chat.name ||

            chat.chatName ||

            "Group"

          );

        }

        const other =
          getParticipants(
            chat
          ).find(
            (u) =>

              String(
                u._id
              ) !==

              String(
                user?._id
              )
          );

        return (
          other?.username ||
          "Unknown"
        );

      };

    // CHAT AVATAR
    const getChatAvatar =
      (chat) => {

        if (
          chat.isGroup
        ) {

          return (

            chat.avatar ||

            chat.groupAvatar ||

            null

          );

        }

        const other =
          getParticipants(
            chat
          ).find(
            (u) =>

              String(
                u._id
              ) !==

              String(
                user?._id
              )
          );

        return (
          other?.avatar ||
          null
        );

      };

    // ONLINE
    const isOnline =
      (chat) => {

        if (
          chat.isGroup
        ) {

          return false;

        }

        const other =
          getParticipants(
            chat
          ).find(
            (u) =>

              String(
                u._id
              ) !==

              String(
                user?._id
              )
          );

        return other

          ? onlineUsers.includes(
              String(
                other._id
              )
            )

          : false;

      };

    // LAST MESSAGE
    const getLastMessageText =
      (chat) => {

        if (
          !chat.lastMessage
        ) {

          return "No messages yet";

        }

        if (
          chat.lastMessage
            .isDeleted
        ) {

          return "Message deleted";

        }

        if (
          chat.lastMessage
            .type ===
          "image"
        ) {

          return "📷 Photo";

        }

        if (
          chat.lastMessage
            .type ===
          "video"
        ) {

          return "🎥 Video";

        }

        if (
          chat.lastMessage
            .type ===
          "audio"
        ) {

          return "🎵 Voice message";

        }

        if (
          chat.lastMessage
            .type ===
          "file"
        ) {

          return "📎 File";

        }

        if (
          chat.lastMessage
            .type ===
          "call"
        ) {

          return "📞 Call";

        }

        return (
          chat.lastMessage
            .content || ""
        );

      };

    // DELETE CHAT
    const handleDeleteChat =
      async (
        e,
        chatId
      ) => {

        e.stopPropagation();

        if (
          !window.confirm(
            "Delete this chat?"
          )
        ) {

          return;

        }

        try {

          await chatService.deleteChat(
            chatId
          );

          removeChat(
            chatId
          );

          toast.success(
            "Chat deleted"
          );

        } catch {

          toast.error(
            "Failed to delete chat"
          );

        }

      };

    return (

      <>

        <div className="w-80 h-screen bg-gray-900 flex flex-col border-r border-gray-800 shrink-0 relative z-20 overflow-visible">

          {/* HEADER */}
          <div className="p-4 flex items-center justify-between border-b border-gray-800 relative overflow-visible">

            {/* USER */}
            <div
              className="flex items-center gap-3 cursor-pointer hover:opacity-80"
              onClick={() =>
                navigate(
                  "/profile"
                )
              }
            >

              <Avatar
                src={
                  user?.avatar
                }
                name={
                  user?.username
                }
                size="sm"
              />

              <span className="font-semibold text-white truncate max-w-[120px]">

                {user?.username}

              </span>

            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2 relative overflow-visible">

              <NotificationBell />

              <button
                onClick={() =>
                  setShowGroupModal(
                    true
                  )
                }
                title="New Group"
                className="text-gray-400 hover:text-indigo-400 text-xl transition-colors"
              >

                👥

              </button>

              <button
                onClick={
                  logout
                }
                title="Logout"
                className="text-gray-400 hover:text-red-400 transition-colors"
              >

                ⏻

              </button>

            </div>

          </div>

          {/* SEARCH */}
          <div className="p-3 border-b border-gray-800">

            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="w-full px-4 py-2 bg-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

          </div>

          {/* SEARCH RESULTS */}
          {searchResults.length >
            0 && (

            <div className="mx-3 mt-1 bg-gray-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto relative z-30">

              {searchResults.map(
                (u) => (

                  <button
                    key={u._id}
                    onClick={() =>
                      openDirectChat(
                        u._id
                      )
                    }
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 transition-colors"
                  >

                    <div className="relative">

                      <Avatar
                        src={
                          u.avatar
                        }
                        name={
                          u.username
                        }
                        size="sm"
                      />

                      {onlineUsers.includes(
                        String(
                          u._id
                        )
                      ) && (

                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-800" />

                      )}

                    </div>

                    <div className="text-left">

                      <p className="text-sm font-medium text-white">

                        {u.username}

                      </p>

                      <p className="text-xs text-gray-400">

                        {u.email}

                      </p>

                    </div>

                  </button>

                )
              )}

            </div>

          )}

          {/* CHAT LIST */}
          <div className="flex-1 overflow-y-auto overflow-x-visible">

            {chats.length ===
              0 && (

              <div className="flex flex-col items-center justify-center h-40 text-gray-500 text-sm">

                <p>

                  No conversations yet

                </p>

                <p className="text-xs mt-1">

                  Search for users
                  to start chatting

                </p>

              </div>

            )}

            {chats.map(
              (chat) => {

                const unread =

                  unreadCounts[
                    chat._id
                  ] || 0;

                return (

                  <div
                    key={
                      chat._id
                    }
                    onClick={() =>
                      openChat(
                        chat
                      )
                    }
                    className={`flex items-center gap-3 p-4 hover:bg-gray-800 border-b border-gray-800/50 cursor-pointer transition-colors ${
                      activeChat
                        ?._id ===
                      chat._id

                        ? "bg-gray-800"

                        : ""
                    }`}
                  >

                    {/* AVATAR */}
                    <div className="relative shrink-0">

                      <Avatar
                        src={getChatAvatar(
                          chat
                        )}
                        name={getChatName(
                          chat
                        )}
                        size="md"
                      />

                      {isOnline(
                        chat
                      ) && (

                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />

                      )}

                    </div>

                    {/* CONTENT */}
                    <div className="flex-1 min-w-0 text-left">

                      <div className="flex items-center justify-between">

                        <div className="flex items-center gap-1.5 min-w-0">

                          <button
                            onClick={(
                              e
                            ) =>
                              handleDeleteChat(
                                e,
                                chat._id
                              )
                            }
                            className="text-xs text-red-400 hover:text-red-500 shrink-0"
                            title="Delete chat"
                          >

                            🗑

                          </button>

                          <p className="font-medium text-white truncate">

                            {getChatName(
                              chat
                            )}

                          </p>

                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">

                          {chat.updatedAt && (

                            <span className="text-xs text-gray-500">

                              {formatDistanceToNow(
                                new Date(
                                  chat.updatedAt
                                )
                              )}

                            </span>

                          )}

                          {unread >
                            0 && (

                            <span className="bg-indigo-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">

                              {unread >
                              99

                                ? "99+"

                                : unread}

                            </span>

                          )}

                        </div>

                      </div>

                      <p className="text-sm text-gray-400 truncate">

                        {getLastMessageText(
                          chat
                        )}

                      </p>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </div>

        {/* GROUP MODAL */}
        {showGroupModal && (

          <CreateGroupModal
            onClose={() =>
              setShowGroupModal(
                false
              )
            }
          />

        )}

      </>

    );

  };

export default
  Sidebar;