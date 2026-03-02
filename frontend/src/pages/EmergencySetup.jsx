import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";

function EmergencySetup() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [folderNames, setFolderNames] = useState([]);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [userId, setUserId] = useState(null);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    relation: "Family",
  });

  const emergencyDocsKey = useMemo(() => (userId ? `safedocs_emergency_docs_${userId}` : ""), [userId]);
  const foldersKey = useMemo(() => (userId ? `safedocs_folders_${userId}` : ""), [userId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [docsRes, profileRes] = await Promise.all([api.get("/documents/all"), api.get("/profile")]);
        setDocuments(docsRes.data || []);
        setUserId(profileRes.data?.id || null);
      } catch (err) {
        console.error("Failed to load emergency setup data", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!emergencyDocsKey) return;
    try {
      const stored = JSON.parse(localStorage.getItem(emergencyDocsKey) || "[]");
      setSelectedDocIds(Array.isArray(stored) ? stored.map(Number).filter(Number.isInteger) : []);
    } catch (e) {
      setSelectedDocIds([]);
    }
  }, [emergencyDocsKey]);

  useEffect(() => {
    if (!foldersKey) return;
    try {
      const savedFolders = JSON.parse(localStorage.getItem(foldersKey) || "{}");
      const names = savedFolders && typeof savedFolders === "object" ? Object.keys(savedFolders) : [];
      setFolderNames(names);
    } catch (e) {
      setFolderNames([]);
    }
  }, [foldersKey]);

  const toggleEmergencyDoc = (docId) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
    );
  };

  const saveEmergencyDocs = () => {
    if (!emergencyDocsKey) return;
    localStorage.setItem(emergencyDocsKey, JSON.stringify(selectedDocIds));
    alert("Emergency documents saved");
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Name and Email are required");
      return;
    }

    try {
      await api.post("/emergency/send-otp", formData);
      setOtpSent(true);
      alert("OTP sent to your registered email");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Failed to add contact");
    }
  };

  const handleVerifyAndSave = async () => {
    if (!otp.trim()) return alert("Enter OTP");

    try {
      await api.post("/emergency/add", {
        email: formData.email,
        otp: otp.trim(),
      });
      alert("Emergency Contact Added!");
      navigate("/sosmode");
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "OTP verification failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#eef1f7] pb-10">
      <div className="bg-gradient-to-r from-[#0b2c6d] to-[#3b82f6] px-10 py-4 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">SAFEDOCS</h1>
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/sosmode">SOS Mode</Link>
        </div>
      </div>

      <div className="mx-10 mt-8 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa] rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold">Emergency Setup</h2>
        <p>Add trusted contacts and choose emergency-access documents</p>
      </div>

      <div className="mx-10 mt-8 bg-white p-8 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-6">Add Emergency Contact</h3>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-semibold">Full Name</label>
            <input
              type="text"
              placeholder="Name of contact"
              className="w-full border p-3 rounded-lg"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Relationship</label>
            <select
              className="w-full border p-3 rounded-lg"
              value={formData.relation}
              onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
            >
              <option>Family</option>
              <option>Friend</option>
              <option>Doctor</option>
              <option>Lawyer</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block mb-2 font-semibold">Email Address (required)</label>
            <input
              type="email"
              placeholder="Email Address"
              className="w-full border p-3 rounded-lg"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold">Phone Number (optional)</label>
            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full border p-3 rounded-lg"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-4">
          <button onClick={handleSubmit} className="bg-blue-700 text-white px-8 py-2 rounded-lg hover:opacity-90">
            Send OTP
          </button>
          {otpSent && (
            <>
              <input
                type="text"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter OTP"
                className="border p-2 rounded-lg"
              />
              <button
                onClick={handleVerifyAndSave}
                className="bg-green-700 text-white px-6 py-2 rounded-lg hover:opacity-90"
              >
                Verify & Save
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mx-10 mt-10 bg-white p-8 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-6">Select Emergency Documents</h3>

        <div className="grid grid-cols-3 gap-6 mb-6">
          {documents.length === 0 ? (
            <p className="text-gray-400 col-span-3">No documents in My Documents</p>
          ) : (
            documents.map((doc) => (
              <label key={doc.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedDocIds.includes(doc.id)}
                  onChange={() => toggleEmergencyDoc(doc.id)}
                />
                <span className="truncate">{doc.title}</span>
              </label>
            ))
          )}
        </div>

        <h4 className="font-semibold mb-3">Available Folders from My Documents</h4>
        <div className="grid grid-cols-3 gap-4 mb-6">
          {folderNames.length === 0 ? (
            <p className="text-gray-400 col-span-3">No folders created</p>
          ) : (
            folderNames.map((name) => (
              <div key={name} className="border rounded-lg px-3 py-2 truncate">
                📁 {name}
              </div>
            ))
          )}
        </div>

        <button onClick={saveEmergencyDocs} className="bg-blue-700 text-white px-8 py-2 rounded-lg">
          Save Emergency Documents
        </button>
      </div>

      <div className="mx-10 mt-8 flex gap-4">
        <Link to="/sosmode" className="border px-8 py-2 rounded-lg">
          Back to SOS Mode
        </Link>
      </div>
    </div>
  );
}

export default EmergencySetup;
