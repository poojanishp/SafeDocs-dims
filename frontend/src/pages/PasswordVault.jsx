import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";

function PasswordVault() {
  const [passwords, setPasswords] = useState([]);

  useEffect(() => {
    const fetchPasswords = async () => {
      try {
        const res = await api.get("/passwords/all");
        setPasswords(res.data);
      } catch (err) {
        console.error("Failed to fetch passwords", err);
      }
    };
    fetchPasswords();
  }, []);
  return (
    <div className="min-h-screen bg-[#eef1f7] pb-10">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#0b2c6d] to-[#3b82f6] px-10 py-4 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">SAFEDOCS</h1>

        <div className="flex gap-6 items-center">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/mydocuments">My Documents</Link>
        </div>
      </div>

      {/* TITLE */}
      <div className="mx-10 mt-8 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa] rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold">Password Vault</h2>
        <p>
          Securely store and manage all your application and account passwords
        </p>
      </div>

      {/* FILTER SECTION */}
      <div className="mx-10 mt-10">
        <h3 className="text-lg font-semibold mb-4">
          Search & filter passwords
        </h3>

        <div className="grid grid-cols-3 gap-6">
          <input
            type="text"
            placeholder="Search apps, accounts"
            className="p-4 rounded-xl shadow outline-none"
          />

          <select className="p-4 rounded-xl shadow outline-none">
            <option>Category</option>
          </select>

          <select className="p-4 rounded-xl shadow outline-none">
            <option>Sort by</option>
          </select>
        </div>
      </div>

      {/* ADD PASSWORD */}
      <div className="mx-10 mt-6">
        <Link
          to="/addpassword"
          className="inline-block bg-blue-700 text-white px-6 py-3 rounded-lg hover:scale-105 transition"
        >
          Add New Password
        </Link>
      </div>

      {/* TABLE HEADER */}
      <div className="mx-10 mt-10 border-b pb-3 font-semibold text-lg grid grid-cols-5 gap-4">
        <span>Application / Account</span>
        <span>Username</span>
        <span>Password</span>
        <span>Category</span>
        <span>Action</span>
      </div>

      {/* PASSWORD LIST */}
      {passwords.length === 0 ? (
        <div className="mx-10 mt-6 bg-white p-10 rounded-xl shadow text-center text-gray-400">
          No passwords saved yet.
          Add a password to securely store it here.
        </div>
      ) : (
        <div className="mx-10 mt-4 space-y-4">
          {passwords.map((p) => (
            <div key={p.id} className="grid grid-cols-5 gap-4 bg-white p-4 rounded-xl shadow items-center">
              <span className="font-bold">{p.site}</span>
              <span>{p.username}</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                ••••••••
                <button
                  onClick={() => alert(`Password: ${p.password}`)}
                  className="ml-2 text-xs text-blue-500 underline"
                >
                  Show
                </button>
              </span>
              <span>{p.notes || "N/A"}</span>
              <button
                onClick={async () => {
                  if (confirm("Delete this password?")) {
                    try {
                      await api.delete(`/passwords/delete/${p.id}`);
                      setPasswords(passwords.filter(pw => pw.id !== p.id));
                    } catch (e) { alert("Delete failed"); }
                  }
                }}
                className="text-red-500 font-bold text-sm text-left"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

export default PasswordVault;
