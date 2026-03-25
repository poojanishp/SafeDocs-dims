import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";

function AuditLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get("/audit-logs/all");
        setLogs(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchLogs();
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
        <h2 className="text-2xl font-bold">Audit Logs</h2>
        <p>Track all system activities and user actions</p>
      </div>

      {/* FILTERS */}
      <div className="mx-10 mt-8 bg-white p-6 rounded-xl shadow">
        <h3 className="font-semibold mb-4">Search & filter logs</h3>

        <div className="grid grid-cols-3 gap-6">
          <input
            type="text"
            placeholder="Search"
            className="border p-3 rounded-lg w-full"
          />

          <input
            type="date"
            className="border p-3 rounded-lg w-full"
          />

          <select className="border p-3 rounded-lg w-full">
            <option>Select a user</option>
          </select>
        </div>
      </div>

      {/* LOGS TABLE */}
      <div className="mx-10 mt-8 bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="p-4">Action</th>
              <th className="p-4">Details</th>
              <th className="p-4">Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan="3" className="p-6 text-center text-gray-400">No logs found</td></tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-bold text-blue-900">{log.action}</td>
                  <td className="p-4 text-gray-600">{log.details}</td>
                  <td className="p-4 text-gray-500 text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default AuditLogs;
