import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../utils/api";

const VIEWED_DOCS_KEY = "safedocs_viewed_docs_order";

function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [userId, setUserId] = useState(null);
  const [quickAccessItems, setQuickAccessItems] = useState(["All Files", "Photos", "Videos"]);

  const backendBaseUrl = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

  const buildDocumentUrl = (fileUrl) => {
    if (!fileUrl) return "#";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;

    const normalizedPath = String(fileUrl).replace(/\\/g, "/").replace(/^\/+/, "");
    return `${backendBaseUrl}/${normalizedPath}`;
  };

  const sortDocumentsByViewedOrder = (documents) => {
    let viewedOrder = [];
    try {
      const stored = JSON.parse(localStorage.getItem(VIEWED_DOCS_KEY) || "[]");
      viewedOrder = Array.isArray(stored) ? stored.map(Number).filter(Number.isInteger) : [];
    } catch (e) {
      viewedOrder = [];
    }

    const orderIndex = new Map(viewedOrder.map((id, index) => [id, index]));

    return [...documents].sort((a, b) => {
      const aIndex = orderIndex.has(a.id) ? orderIndex.get(a.id) : Number.MAX_SAFE_INTEGER;
      const bIndex = orderIndex.has(b.id) ? orderIndex.get(b.id) : Number.MAX_SAFE_INTEGER;

      if (aIndex !== bIndex) return aIndex - bIndex;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };

  const filterOutTrashedDocuments = (documents, profileId) => {
    if (!profileId) return documents;
    try {
      const trashKey = `safedocs_trash_${profileId}`;
      const savedTrash = JSON.parse(localStorage.getItem(trashKey) || "{}");
      const trashMap = savedTrash && typeof savedTrash === "object" ? savedTrash : {};
      return documents.filter((doc) => !trashMap[doc.id]);
    } catch (e) {
      return documents;
    }
  };

  const markDocumentAsViewed = (docId) => {
    try {
      const parsedId = Number(docId);
      if (!Number.isInteger(parsedId)) return;

      const existing = JSON.parse(localStorage.getItem(VIEWED_DOCS_KEY) || "[]");
      const normalized = Array.isArray(existing) ? existing.map(Number).filter(Number.isInteger) : [];
      const updated = [parsedId, ...normalized.filter((id) => id !== parsedId)];
      localStorage.setItem(VIEWED_DOCS_KEY, JSON.stringify(updated));
      setRecentDocuments((prev) => sortDocumentsByViewedOrder(prev));
    } catch (e) {
      console.error("Failed to update viewed doc order", e);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, docsRes] = await Promise.all([
          api.get("/profile"),
          api.get("/documents/all"),
        ]);
        const profileId = profileRes.data.id;
        const visibleDocs = filterOutTrashedDocuments(docsRes.data || [], profileId);
        setUsername(profileRes.data.name);
        setUserId(profileId);
        setRecentDocuments(sortDocumentsByViewedOrder(visibleDocs));
      } catch (err) {
        console.error("Not authenticated");
        navigate("/login");
      }
    };
    fetchDashboardData();
  }, [navigate]);

  useEffect(() => {
    if (!userId) return;
    try {
      const key = `safedocs_folders_${userId}`;
      const savedFolders = JSON.parse(localStorage.getItem(key) || "{}");
      const folderNames = savedFolders && typeof savedFolders === "object" ? Object.keys(savedFolders) : [];
      setQuickAccessItems(["All Files", "Photos", "Videos", ...folderNames]);
    } catch (e) {
      setQuickAccessItems(["All Files", "Photos", "Videos"]);
    }
  }, [userId]);

  const getMyDocumentsTabForQuickAccess = (item) => {
    if (item === "All Files") return "all";
    if (item === "Photos") return "photos";
    if (item === "Videos") return "videos";
    return `folder:${item}`;
  };

  return (
    <div className="min-h-screen bg-[#eef1f7] pb-10">
      <div className="bg-gradient-to-r from-[#0b2c6d] to-[#3b82f6] px-10 py-4 flex justify-between items-center text-white">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">SAFEDOCS</h1>
        </div>

        <div className="flex gap-6 items-center">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/profile">Profile</Link>
        </div>
      </div>

      <div className="mx-10 mt-8 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa] rounded-xl p-6 flex justify-between items-center text-white">
        <div>
          <h2 className="text-2xl font-bold">Welcome, {username}!</h2>
          <p className="text-lg">Manage Your Documents Securely!</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mx-10 mt-8">
        <Link to="/UploadDocument" className="bg-white p-6 rounded-xl shadow text-center hover:scale-105 transition">
          <div className="text-4xl mb-2">⬆️</div>
          <h3 className="font-bold text-blue-700">Upload Document</h3>
          <p className="text-sm text-gray-600">Add New Files Securely</p>
        </Link>

        <Link to="/mydocuments" className="bg-white p-6 rounded-xl shadow text-center hover:scale-105 transition">
          <div className="text-4xl mb-2">📁</div>
          <h3 className="font-bold text-blue-700">View Documents</h3>
          <p className="text-sm text-gray-600">Open Your Uploaded Files</p>
        </Link>

        <Link to="/familyvault" className="bg-white p-6 rounded-xl shadow text-center hover:scale-105 transition">
          <div className="text-4xl mb-2">👨‍👩‍👧‍👦</div>
          <h3 className="font-bold text-blue-700">Family Vault</h3>
          <p className="text-sm text-gray-600">Shared Family Folder</p>
        </Link>

        <Link to="/expiryreminder" className="bg-white p-6 rounded-xl shadow text-center hover:scale-105 transition">
          <div className="text-4xl mb-2">📅</div>
          <h3 className="font-bold text-blue-700">Expiry Reminders</h3>
          <p className="text-sm text-gray-600">Expiry Date Alerts</p>
        </Link>
      </div>

      <div className="mx-10 mt-8">
        <h3 className="font-semibold mb-4 text-blue-900">Quick Access</h3>
        <div className="grid grid-cols-4 gap-6">
          {quickAccessItems.map((item) => (
            <Link
              key={item}
              to="/mydocuments"
              state={{ tab: getMyDocumentsTabForQuickAccess(item) }}
              className="bg-white p-4 rounded-lg shadow truncate block hover:scale-105 transition"
              title={item}
            >
              {item}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 mx-10 mt-8">
        <Link
          to="/timeboundlinks"
          className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white p-6 rounded-xl shadow hover:scale-105 transition block"
        >
          <h4 className="font-bold">Time-Bound Links</h4>
          <p className="text-sm">Share Files with Expiry Time</p>
        </Link>

        <Link
          to="/sosmode"
          className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white p-6 rounded-xl shadow hover:scale-105 transition block"
        >
          <h4 className="font-bold">SOS Mode</h4>
          <p className="text-sm">Grant Emergency Access</p>
        </Link>

        <Link
          to="/auditlogs"
          className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white p-6 rounded-xl shadow hover:scale-105 transition block"
        >
          <h4 className="font-bold">Audit Logs</h4>
          <p className="text-sm">View your activities</p>
        </Link>

        <Link
          to="/passwordvault"
          className="bg-gradient-to-r from-[#1e3a8a] to-[#3b82f6] text-white p-6 rounded-xl shadow hover:scale-105 transition block"
        >
          <h4 className="font-bold">Password Vault</h4>
          <p className="text-sm">Securely Store Passwords</p>
        </Link>
      </div>

      <div className="mx-10 mt-8">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="font-bold mb-3">Recent Documents</h3>
          {recentDocuments.length === 0 ? (
            <p className="text-gray-500">No documents found.</p>
          ) : (
            <div className="space-y-3">
              {recentDocuments.map((doc, index) => (
                <div key={doc.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-semibold">
                      {index + 1}. {doc.title}
                    </p>
                    <p className="text-xs text-gray-500">{doc.category || "Uncategorized"}</p>
                  </div>
                  <a
                    href={buildDocumentUrl(doc.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markDocumentAsViewed(doc.id)}
                    className="text-blue-600 text-sm"
                  >
                    View
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
