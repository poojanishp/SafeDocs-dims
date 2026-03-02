import { Link } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import api from "../utils/api";

function SOSMode() {
  const [contacts, setContacts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [folderNames, setFolderNames] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState("");
  const [userId, setUserId] = useState(null);

  const emergencyDocsKey = useMemo(() => (userId ? `safedocs_emergency_docs_${userId}` : ""), [userId]);
  const foldersKey = useMemo(() => (userId ? `safedocs_folders_${userId}` : ""), [userId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactsRes, docsRes, profileRes] = await Promise.all([
          api.get("/emergency/all"),
          api.get("/documents/all"),
          api.get("/profile"),
        ]);
        setContacts(contactsRes.data || []);
        setDocuments(docsRes.data || []);
        setUserId(profileRes.data?.id || null);

        const familyRes = await api.get("/family/all");
        setFamilyMembers(familyRes.data || []);
      } catch (err) {
        console.error("Failed to fetch SOS data", err);
      }
    };
    fetchData();
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

  const selectedDocuments = documents.filter((doc) => selectedDocIds.includes(doc.id));
  const emergencyEmails = new Set(contacts.map((c) => String(c.email || "").toLowerCase()));
  const availableFamilyMembers = familyMembers.filter((m) => {
    const email = String(m.mobile || "").toLowerCase();
    return email && !emergencyEmails.has(email);
  });

  const handleSOS = async () => {
    if (confirm("Are you sure you want to trigger SOS? This will alert all your emergency contacts.")) {
      try {
        await api.post("/emergency/sos", { docIds: selectedDocIds });
        alert("SOS Alert Sent Successfully!");
      } catch (err) {
        console.error(err);
        alert(err?.response?.data?.message || "Failed to send SOS");
      }
    }
  };
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

      {/* PAGE TITLE */}
      <div className="mx-10 mt-8 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa] rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold">
          SOS Mode – Emergency Access
        </h2>
        <p>
          Instantly share critical documents with trusted contacts
        </p>
      </div>

      {/* ACTIVATE SOS */}
      <div className="mx-10 mt-8 flex justify-center">
        <button
          onClick={handleSOS}
          className="bg-red-200 text-red-700 text-2xl font-bold px-16 py-6 rounded-xl shadow flex items-center gap-4 hover:scale-105 transition"
        >
          🔔 Activate SOS Mode
        </button>
      </div>

      {/* TRUSTED CONTACTS */}
      <div className="mx-10 mt-10">
        <h3 className="text-xl font-semibold mb-6">
          Trusted Emergency Contacts
        </h3>

        <div className="grid grid-cols-3 gap-6">
          {contacts.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow text-center text-gray-400 col-span-3">
              No emergency contacts added
            </div>
          ) : (
            contacts.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-xl shadow">
                <p className="font-bold">{c.name}</p>
                <p className="text-sm text-gray-600">{c.relation}</p>
                <p className="text-sm text-gray-500">Email: {c.email}</p>
                {c.phone && c.phone !== "-" ? (
                  <p className="text-sm text-gray-400">Phone: {c.phone}</p>
                ) : null}
                <button
                  onClick={async () => {
                    if (!confirm("Remove this emergency contact?")) return;
                    try {
                      await api.delete(`/emergency/delete/${c.id}`);
                      setContacts((prev) => prev.filter((contact) => contact.id !== c.id));
                    } catch (err) {
                      alert(err?.response?.data?.message || "Failed to delete contact");
                    }
                  }}
                  className="mt-3 text-sm text-red-600 font-semibold"
                >
                  Delete Contact
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-6">
          <Link
            to="/emergencysetup"
            className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:scale-105 transition inline-block"
          >
            Add Emergency Contact
          </Link>
        </div>

        <div className="mt-6 bg-white p-4 rounded-xl shadow">
          <h4 className="font-semibold mb-3">Add Existing Family Member (No OTP)</h4>
          <div className="flex gap-3">
            <select
              className="border rounded-lg px-3 py-2 flex-1"
              value={selectedFamilyMemberId}
              onChange={(e) => setSelectedFamilyMemberId(e.target.value)}
            >
              <option value="">Select family member</option>
              {availableFamilyMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name && m.name.trim() ? m.name : `Family Member #${m.id}`}
                </option>
              ))}
            </select>
            <button
              onClick={async () => {
                const id = Number(selectedFamilyMemberId);
                if (!id) return alert("Select a family member");
                try {
                  const res = await api.post(`/emergency/add-from-family/${id}`);
                  setContacts((prev) => [res.data, ...prev]);
                  setSelectedFamilyMemberId("");
                  alert("Family member added to emergency contacts");
                } catch (err) {
                  alert(err?.response?.data?.message || "Failed to add family member");
                }
              }}
              className="bg-indigo-700 text-white px-4 py-2 rounded-lg"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* EMERGENCY DOCUMENTS */}
      <div className="mx-10 mt-10">
        <h3 className="text-xl font-semibold mb-6">
          Documents for Emergency Contacts
        </h3>

        <div className="grid grid-cols-2 gap-6">
          {selectedDocuments.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow text-center text-gray-400 col-span-2">
              No emergency documents selected
            </div>
          ) : (
            selectedDocuments.map((doc) => (
              <div key={doc.id} className="bg-white p-6 rounded-xl shadow">
                <p className="font-semibold truncate">{doc.title}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-6">
          <Link
            to="/emergencysetup"
            className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:scale-105 transition inline-block"
          >
            Select Emergency Documents
          </Link>
        </div>
      </div>

      <div className="mx-10 mt-10">
        <h3 className="text-xl font-semibold mb-6">Folders from My Documents</h3>
        <div className="grid grid-cols-3 gap-6">
          {folderNames.length === 0 ? (
            <div className="bg-white p-6 rounded-xl shadow text-center text-gray-400 col-span-3">
              No folders created
            </div>
          ) : (
            folderNames.map((name) => (
              <div key={name} className="bg-white p-4 rounded-xl shadow truncate">
                📁 {name}
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

export default SOSMode;
