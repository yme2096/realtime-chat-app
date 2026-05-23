import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import useAuthStore from "../store/authStore";
import { userService } from "../services/chatService";
import Avatar from "../components/Avatar";
import useThemeStore
from "../store/themeStore";

const ProfilePage = () => {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
  });
  const [preview, setPreview] = useState(user?.avatar || "");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const {
  setTheme,
} = useThemeStore();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("username", form.username);
      formData.append("bio", form.bio);
      if (file) formData.append("avatar", file);

      const { data } = await userService.updateProfile(formData);
      updateUser(data.user);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-950 p-6">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 space-y-6">
        {/* Back + Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-white transition"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="relative cursor-pointer"
            onClick={() => fileRef.current?.click()}
          >
            <Avatar src={preview} name={form.username} size="lg" />
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-white text-xs">Change</span>
            </div>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full px-4 py-3 bg-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <textarea
            placeholder="Bio (optional)"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            maxLength={200}
            className="w-full px-4 py-3 bg-gray-800 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl font-semibold transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
};
{/* THEME SECTION */}
<div className="mt-8 bg-gray-900 rounded-2xl p-5 border border-gray-800">

  <h2 className="text-white text-lg font-semibold mb-4">

    App Theme

  </h2>

  <div className="grid grid-cols-2 gap-3">

    <button
      onClick={() =>
        setTheme("dark")
      }
      className="bg-black text-white py-3 rounded-xl hover:scale-[1.02] transition"
    >

      Dark

    </button>

    <button
      onClick={() =>
        setTheme("light")
      }
      className="bg-white text-black py-3 rounded-xl hover:scale-[1.02] transition"
    >

      Light

    </button>

    <button
      onClick={() =>
        setTheme("whatsapp")
      }
      className="bg-green-600 text-white py-3 rounded-xl hover:scale-[1.02] transition"
    >

      WhatsApp

    </button>

    <button
      onClick={() =>
        setTheme("discord")
      }
      className="bg-indigo-600 text-white py-3 rounded-xl hover:scale-[1.02] transition"
    >

      Discord

    </button>

  </div>

</div>

export default ProfilePage;
