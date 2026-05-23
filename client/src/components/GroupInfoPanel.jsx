import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { getSocket } from "../sockets/socket";
import { chatService, userService } from "../services/chatService";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import Avatar from "./Avatar";

const GroupInfoPanel = ({ chat, onClose }) => {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const { updateChat, removeChat, setActiveChat } = useChatStore();
  const { user } = useAuthStore();
  const socket = getSocket();
  const navigate = useNavigate();

  const isAdmin = chat.admins?.some(
    (a) => String(a._id || a) === String(user._id)
  );

  const searchUsers = async (q) => {
    setSearch(q);
    if (!q.trim()) return setResults([]);
    const { data } = await userService.searchUsers(q);
    // Support both users and participants field
    const members = (chat.users || chat.participants || []).map((p) => String(p._id || p));
    setResults(data.users.filter((u) => !members.includes(String(u._id))));
  };

  const addMember = (userId) => {
    socket?.emit("group:add_member", { chatId: chat._id, userId });
    setShowSearch(false);
    setSearch("");
    setResults([]);
    toast.success("Member added");
  };

  const removeMember = (userId) => {
    socket?.emit("group:remove_member", { chatId: chat._id, userId });
  };

  const promoteAdmin = (userId) => {
    socket?.emit("group:promote_admin", { chatId: chat._id, userId });
    toast.success("Promoted to admin");
  };

  const leaveGroup = async () => {
    try {
      await chatService.leaveGroup(chat._id);
      removeChat(chat._id);
      setActiveChat(null);
      navigate("/");
      onClose();
      toast.success("Left group");
    } catch {
      toast.error("Failed to leave group");
    }
  };

  return (
    <div className="w-72 h-screen bg-gray-900 border-l border-gray-800 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h3 className="font-semibold text-white">Group Info</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
      </div>

      {/* Group avatar + name */}
      <div className="flex flex-col items-center py-6 border-b border-gray-800">
        <Avatar src={chat.avatar || chat.groupAvatar} name={chat.name || chat.chatName} size="lg" />
        <h2 className="mt-3 text-lg font-bold text-white">{chat.name || chat.chatName}</h2>
        {chat.description && (
          <p className="text-sm text-gray-400 text-center mt-1 px-4">{chat.description}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">{(chat.users || chat.participants)?.length} members</p>
      </div>

      {/* Add member (admin only) */}
      {isAdmin && (
        <div className="p-3 border-b border-gray-800">
          {showSearch ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => searchUsers(e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
              {results.map((u) => (
                <button
                  key={u._id}
                  onClick={() => addMember(u._id)}
                  className="w-full flex items-center gap-2 p-2 hover:bg-gray-800 rounded-xl"
                >
                  <Avatar src={u.avatar} name={u.username} size="sm" />
                  <span className="text-sm text-white">{u.username}</span>
                </button>
              ))}
              <button
                onClick={() => { setShowSearch(false); setSearch(""); setResults([]); }}
                className="text-xs text-gray-400 hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center gap-2 p-2 text-indigo-400 hover:bg-gray-800 rounded-xl text-sm"
            >
              <span>＋</span> Add Member
            </button>
          )}
        </div>
      )}

      {/* Members list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wider px-2 mb-2">Members</p>
        {(chat.users || chat.participants)?.map((member) => {
          const memberId = member._id;
          const memberIsAdmin = chat.admins?.some(
            (a) => (a._id || a).toString() === memberId.toString()
          );
          const isSelf = memberId.toString() === user._id.toString();

          return (
            <div key={memberId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-800 group">
              <Avatar src={member.avatar} name={member.username} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {member.username} {isSelf && <span className="text-gray-500">(you)</span>}
                </p>
                {memberIsAdmin && (
                  <span className="text-xs text-indigo-400">Admin</span>
                )}
              </div>

              {/* Admin controls */}
              {isAdmin && !isSelf && (
                <div className="hidden group-hover:flex items-center gap-1">
                  {!memberIsAdmin && (
                    <button
                      onClick={() => promoteAdmin(memberId)}
                      title="Make admin"
                      className="text-xs text-indigo-400 hover:text-indigo-300 px-1.5 py-0.5 bg-gray-700 rounded"
                    >
                      ↑
                    </button>
                  )}
                  <button
                    onClick={() => removeMember(memberId)}
                    title="Remove"
                    className="text-xs text-red-400 hover:text-red-300 px-1.5 py-0.5 bg-gray-700 rounded"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Leave group */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={leaveGroup}
          className="w-full py-2.5 text-red-400 hover:bg-red-400/10 rounded-xl text-sm font-medium transition-colors"
        >
          Leave Group
        </button>
      </div>
    </div>
  );
};

export default GroupInfoPanel;
