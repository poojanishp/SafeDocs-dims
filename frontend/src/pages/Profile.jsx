import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../utils/api";

function Profile() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState(null);
  const [profile, setProfile] = useState({ name: "", email: "", phone: "" });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const phoneStorageKey = useMemo(() => (userId ? `safedocs_profile_phone_${userId}` : ""), [userId]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile");
        const user = res.data || {};
        setUserId(user.id);
        const localPhone = user.id ? localStorage.getItem(`safedocs_profile_phone_${user.id}`) || "" : "";
        setProfile({ name: user.name || "", email: user.email || "", phone: localPhone });
      } catch (err) {
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await api.put("/profile", {
        name: profile.name,
        email: profile.email,
      });
      if (phoneStorageKey) {
        localStorage.setItem(phoneStorageKey, profile.phone || "");
      }
      alert("Profile updated successfully");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setLoading(true);
    try {
      await api.post("/change-password", passwordForm);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      alert("Password changed successfully");
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      navigate("/login");
    } catch (err) {
      alert("Logout failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#eef1f7] text-black pb-10">
      <div className="bg-gradient-to-r from-[#0b2c6d] to-[#3b82f6] px-10 py-4 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">SAFEDOCS</h1>
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/mydocuments">My Documents</Link>
        </div>
      </div>

      <div className="mx-10 mt-8 bg-white rounded-xl p-6 shadow">
        <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-semibold">Name</label>
            <input
              className="w-full border p-3 rounded-lg"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Email</label>
            <input
              type="email"
              className="w-full border p-3 rounded-lg"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Number</label>
            <input
              type="tel"
              className="w-full border p-3 rounded-lg"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </div>
        <button
          onClick={handleSaveProfile}
          disabled={loading}
          className="mt-4 bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Save Profile
        </button>
      </div>

      <div className="mx-10 mt-6 bg-white rounded-xl p-6 shadow">
        <h3 className="text-xl font-bold mb-4">Change Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="password"
            placeholder="Current Password"
            className="border p-3 rounded-lg"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
          />
          <input
            type="password"
            placeholder="New Password"
            className="border p-3 rounded-lg"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            className="border p-3 rounded-lg"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          />
        </div>
        <button
          onClick={handleChangePassword}
          disabled={loading}
          className="mt-4 bg-indigo-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
        >
          Change Password
        </button>
      </div>

      <div className="mx-10 mt-6 bg-white rounded-xl p-6 shadow">
        <h3 className="text-xl font-bold mb-4">Account Actions</h3>
        <div className="flex gap-4">
          <button onClick={handleLogout} className="bg-gray-800 text-white px-6 py-2 rounded-lg">
            Logout
          </button>
          <Link to="/delete-account" className="bg-red-700 text-white px-6 py-2 rounded-lg">
            Delete Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Profile;
