import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";

function AddExpiryReminder() {
  const navigate = useNavigate();
  const location = useLocation();
  const preselectedDocId = location.state?.docId ? String(location.state.docId) : "";
  const [documents, setDocuments] = useState([]);
  const [formData, setFormData] = useState({
    docId: preselectedDocId,
    type: "Personal",
    date: "",
    time: "",
    note: ""
  });

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const [docsRes, profileRes] = await Promise.all([api.get("/documents/all"), api.get("/profile")]);
        const profileId = profileRes?.data?.id;
        let docs = docsRes.data || [];
        if (profileId) {
          const trashKey = `safedocs_trash_${profileId}`;
          const savedTrash = JSON.parse(localStorage.getItem(trashKey) || "{}");
          const trashMap = savedTrash && typeof savedTrash === "object" ? savedTrash : {};
          docs = docs.filter((doc) => !trashMap[doc.id]);
        }
        setDocuments(docs);
      } catch (err) {
        console.error("Failed to fetch docs", err);
      }
    };
    fetchDocs();
  }, []);

  const handleSubmit = async () => {
    try {
      await api.post("/reminders/add", formData);
      alert("Reminder Added!");
      navigate("/expiryreminder");
    } catch (err) {
      console.error(err);
      alert("Failed to add reminder");
    }
  };
  return (
    <div className="min-h-screen bg-[#eef1f7] pb-10">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#0b2c6d] to-[#3b82f6] px-10 py-4 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">SAFEDOCS</h1>

        <div className="flex gap-6 items-center">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/expiryreminder">Expiry Reminder</Link>
        </div>
      </div>

      {/* TITLE */}
      <div className="mx-10 mt-8 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa] rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold">Set New Expiry Reminder</h2>
        <p>Add expiry date and time for your document</p>
      </div>

      {/* FORM */}
      <div className="mx-10 mt-8 bg-white p-8 rounded-xl shadow">

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-semibold">
              Select Document
            </label>
            <select
              className="w-full border p-3 rounded-lg"
              value={formData.docId}
              onChange={(e) => setFormData({ ...formData, docId: e.target.value })}
            >
              <option value="">Select document</option>
              {documents.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Document Type
            </label>
            <select
              className="w-full border p-3 rounded-lg"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option>Personal</option>
              <option>Work</option>
              <option>Medical</option>
              <option>Insurance</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-semibold">
              Expiry Date
            </label>
            <input
              type="date"
              className="w-full border p-3 rounded-lg"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">
              Expiry Time
            </label>
            <input
              type="time"
              className="w-full border p-3 rounded-lg"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block mb-2 font-semibold">
            Reminder Note (optional)
          </label>
          <textarea
            rows="3"
            className="w-full border p-3 rounded-lg"
            placeholder="Eg: Renew insurance before expiry"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          />
        </div>

        {/* ACTIONS */}
        <div className="flex gap-4">
          <button
            onClick={handleSubmit}
            className="bg-blue-700 text-white px-8 py-2 rounded-lg hover:opacity-90"
          >
            Save Reminder
          </button>

          <Link
            to="/expiryreminder"
            className="border border-gray-400 px-8 py-2 rounded-lg"
          >
            Cancel
          </Link>
        </div>

      </div>
    </div>
  );
}

export default AddExpiryReminder;
