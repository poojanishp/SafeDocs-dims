import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";

function ExpiryReminder() {
  const [reminders, setReminders] = useState([]);

  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await api.get("/reminders/all");
        setReminders(res.data);
      } catch (err) {
        console.error("Failed to fetch reminders", err);
      }
    };
    fetchReminders();
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
        <h2 className="text-2xl font-bold">Expiry Reminder</h2>
        <p>Stay on top of your document deadlines</p>
      </div>

      {/* FILTER + ADD */}
      <div className="mx-10 mt-8 bg-white p-6 rounded-xl shadow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold">Upcoming Reminders</h3>

          <Link
            to="/addexpiryreminder"
            className="bg-blue-700 text-white px-6 py-2 rounded-lg hover:scale-105 transition"
          >
            Add New Reminder
          </Link>
        </div>

        {/* STATUS CHIPS */}
        <div className="flex gap-4 mb-6">
          <span className="bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm">
            Active
          </span>
          <span className="bg-yellow-100 text-yellow-700 px-4 py-1 rounded-full text-sm">
            Expiring Soon
          </span>
          <span className="bg-red-100 text-red-700 px-4 py-1 rounded-full text-sm">
            Expired
          </span>
        </div>

        {/* SEARCH & FILTER */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <input
            type="text"
            placeholder="Search document"
            className="border p-3 rounded-lg w-full"
          />

          <select className="border p-3 rounded-lg w-full">
            <option>Document type</option>
          </select>

          <select className="border p-3 rounded-lg w-full">
            <option>Status</option>
          </select>
        </div>

        {/* REMINDER LIST */}
        {reminders.length === 0 ? (
          <div className="bg-gray-50 p-10 rounded-xl text-center text-gray-400">
            No expiry reminders set yet.
            <div className="mt-2">
              <Link
                to="/addexpiryreminder"
                className="text-blue-600 underline"
              >
                Add your first reminder
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {reminders.map((rem) => (
              <div key={rem.id} className="bg-white border rounded-xl p-4 flex justify-between items-center shadow-sm">
                <div>
                  <h4 className="font-bold text-lg">{rem.document?.title || "General Reminder"}</h4>
                  <p className="text-sm text-gray-600">Type: {rem.type}</p>
                  <p className="text-gray-500 mt-1">{rem.note}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-500">{new Date(rem.date).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">{rem.time}</p>
                  <button
                    onClick={async () => {
                      try {
                        await api.delete(`/reminders/delete/${rem.id}`);
                        setReminders(reminders.filter(r => r.id !== rem.id));
                      } catch (e) { alert("Delete failed"); }
                    }}
                    className="text-red-500 text-xs hover:underline mt-2 block"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EDIT LINK (UI READY) */}
        <div className="mt-6 text-right">
          <Link
            to="/editexpiryreminder"
            className="text-blue-600 underline text-sm"
          >
            Edit Reminder
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ExpiryReminder;
