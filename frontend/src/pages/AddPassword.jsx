import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../utils/api";

function AddPassword() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    site: "",
    username: "",
    password: "",
    category: "Social",
    notes: ""
  });

  const handleSubmit = async () => {
    try {
      await api.post("/passwords/add", formData);
      alert("Password Saved!");
      navigate("/passwordvault");
    } catch (err) {
      console.error(err);
      alert("Failed to save password");
    }
  };
  return (
    <div className="min-h-screen bg-[#eef1f7] pb-10">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#0b2c6d] to-[#3b82f6] px-10 py-4 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">SAFEDOCS</h1>

        <div className="flex gap-6 items-center">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/passwordvault">Password Vault</Link>
        </div>
      </div>

      {/* TITLE */}
      <div className="mx-10 mt-8 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa] rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold">Add New Password</h2>
        <p>Store your account credentials securely</p>
      </div>

      {/* FORM */}
      <div className="mx-10 mt-8 bg-white p-8 rounded-xl shadow">

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-semibold">
              Application / Website
            </label>
            <input
              type="text"
              placeholder="username / email"
              className="w-full border p-3 rounded-lg"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter password"
              className="w-full border p-3 rounded-lg"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-semibold">
              Website / App Name
            </label>
            <input
              type="text"
              placeholder="Ex: Facebook, Gmail"
              className="w-full border p-3 rounded-lg"
              value={formData.site}
              onChange={(e) => setFormData({ ...formData, site: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Category
            </label>
            <select
              className="w-full border p-3 rounded-lg"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option>Social</option>
              <option>Banking</option>
              <option>Work</option>
              <option>Shopping</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold">
            Notes (optional)
          </label>
          <textarea
            rows="3"
            className="w-full border p-3 rounded-lg"
            placeholder="Add any notes here..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            className="bg-blue-700 text-white px-8 py-2 rounded-lg hover:opacity-90"
          >
            Save Password
          </button>

          <Link
            to="/passwordvault"
            className="border px-8 py-2 rounded-lg"
          >
            Cancel
          </Link>
        </div>

      </div>
    </div>
  );
}

export default AddPassword;
