import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { chatService, userService } from "../services/chatService";
import useChatStore from "../store/chatStore";
import useAuthStore from "../store/authStore";
import Avatar from "./Avatar";

const CreateGroupModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [creating, setCreating] = useState(false);
  const { chats, updateChat, setActiveChat } = useChatStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Pre-populate with existing contacts from DM chats
  const contacts = [];
  chats.forEach((chat) => {
    if (!chat.isGroup) {
      const participants = chat.participants || chat.users || [];
      const other = participants.find(
        (u) => String(u._id) !== String(user?._id)
      );
      if (other && !contacts.some((c) => c._id === other._id)) {
        contacts.push(other);
      }
    }
  });

  useEffect(() => {
    if (!search.trim()) return setResults([]);
    const t = setTimeout(async () => {
      try {
        const { data } = await userService.searchUsers(search);
        setResults(data.users);
      } catch {
        setResults([]);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const toggleSelect = (u) => {
    setSelected((prev) =>
      prev.find((s) => s._id === u._id)
        ? prev.filter((s) => s._id !== u._id)
        : [...prev, u]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim()) return toast.error("Enter a group name");
    if (selected.length < 2) return toast.error("Select at least 2 members");
    setCreating(true);
    try {
      const { data } = await chatService.createGroup({
        name: groupName.trim(),
        participants: selected.map((u) => u._id),
      });
      updateChat(data.chat);
      setActiveChat(data.chat);
      navigate(`/chat/${data.chat._id}`);
      onClose();
      toast.success(`Group "${data.chat.name}" created!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  // Merge contacts + search results, deduplicate
  const displayList =
    search.trim()
      ? results
      : contacts.filter(
          (c) => !selected.find((s) => s._id === c._id)
        );

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            {step === 1 ? "Add Members" : "Name Your Group"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">
            ✕
          </button>
        </div>

        {step === 1 ? (
          <div className="p-4 space-y-3">
            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((u) => (
                  <span
                    key={u._id}
                    onClick={() => toggleSelect(u)}
                    className="flex items-center gap-1 bg-indigo-600 text-white text-xs px-3 py-1 rounded-full cursor-pointer hover:bg-indigo-700"
                  >
                    {u.username} ✕
                  </span>
                ))}
              </div>
            )}

            <input
              type="text"
              placeholder="Search users to add..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="max-h-60 overflow-y-auto space-y-1">
              {displayList.length === 0 && search.trim() && (
                <p className="text-center text-gray-500 text-sm py-4">No users found</p>
              )}
              {displayList.length === 0 && !search.trim() && (
                <p className="text-center text-gray-500 text-sm py-4">
                  Search for users to add
                </p>
              )}
              {displayList.map((u) => {
                const isSelected = !!selected.find((s) => s._id === u._id);
                return (
                  <button
                    key={u._id}
                    onClick={() => toggleSelect(u)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      isSelected
                        ? "bg-indigo-600/30 border border-indigo-500"
                        : "hover:bg-gray-800"
                    }`}
                  >
                    <Avatar src={u.avatar} name={u.username} size="sm" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">{u.username}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                    {isSelected && (
                      <span className="ml-auto text-indigo-400">✓</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={selected.length < 2}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl font-semibold transition-colors"
            >
              Next ({selected.length} selected)
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {selected.map((u) => (
                <div
                  key={u._id}
                  className="flex items-center gap-1.5 bg-gray-800 rounded-full px-3 py-1"
                >
                  <Avatar src={u.avatar} name={u.username} size="sm" />
                  <span className="text-xs text-white">{u.username}</span>
                </div>
              ))}
            </div>

            <input
              type="text"
              placeholder="Group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="w-full px-4 py-3 bg-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !groupName.trim()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl font-semibold transition-colors"
              >
                {creating ? "Creating..." : "Create Group"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateGroupModal;
