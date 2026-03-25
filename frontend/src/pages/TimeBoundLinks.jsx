import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../utils/api";

function TimeBoundLinks() {
  const [documents, setDocuments] = useState([]);
  const [links, setLinks] = useState([]);
  const [formData, setFormData] = useState({
    docId: "",
    expiryDate: "",
    expiryTime: "",
    details: "",
  });
  const [loading, setLoading] = useState(false);
  const [lastGeneratedLink, setLastGeneratedLink] = useState("");

  const backendBaseUrl = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");

  const buildShareUrl = (token) => `${backendBaseUrl}/api/share/view/${token}`;

  const fetchData = async () => {
    try {
      const [docsRes, linksRes] = await Promise.all([api.get("/documents/all"), api.get("/share/mylinks")]);
      setDocuments(docsRes.data || []);
      setLinks(linksRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerate = async () => {
    if (!formData.docId || !formData.expiryDate || !formData.expiryTime) {
      alert("Please select document, expiry date and expiry time.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/share/create", {
        docId: Number(formData.docId),
        expiryDate: formData.expiryDate,
        expiryTime: formData.expiryTime,
        details: formData.details,
      });

      const generated = res.data?.link || buildShareUrl(res.data?.token);
      setLastGeneratedLink(generated);
      alert("Link generated successfully.");
      fetchData();
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.message || "Failed to generate link");
    } finally {
      setLoading(false);
    }
  };

  const now = Date.now();
  const activeLinks = links.filter((link) => link.isActive && new Date(link.expiry).getTime() > now);
  const expiredLinks = links.filter((link) => !link.isActive || new Date(link.expiry).getTime() <= now);

  return (
    <div className="min-h-screen bg-[#eef1f7] pb-10">
      <div className="bg-gradient-to-r from-[#0b2c6d] to-[#3b82f6] px-10 py-4 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">SAFEDOCS</h1>
        <div className="flex gap-6 items-center">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/mydocuments">My Documents</Link>
        </div>
      </div>

      <div className="mx-10 mt-8 bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa] rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold">Time Bound Links</h2>
        <p>Share documents securely with temporary access links</p>
      </div>

      <div className="mx-10 mt-8 bg-white p-6 rounded-xl shadow">
        <h3 className="font-semibold mb-6">Create New Time-Bound Link</h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block mb-2 font-medium">Select Document</label>
            <select
              className="w-full border p-3 rounded-lg"
              value={formData.docId}
              onChange={(e) => setFormData({ ...formData, docId: e.target.value })}
            >
              <option value="">Select Document</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 font-medium">Expiry Date</label>
            <input
              type="date"
              className="w-full border p-3 rounded-lg"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Expiry Time</label>
            <input
              type="time"
              className="w-full border p-3 rounded-lg"
              value={formData.expiryTime}
              onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Details</label>
            <input
              type="text"
              placeholder="Optional details"
              className="w-full border p-3 rounded-lg"
              value={formData.details}
              onChange={(e) => setFormData({ ...formData, details: e.target.value })}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-blue-700 text-white px-6 py-3 rounded-lg hover:scale-105 transition disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Link"}
          </button>
        </div>

        {lastGeneratedLink && (
          <div className="mt-5 border rounded-lg p-4 bg-blue-50">
            <p className="text-sm font-semibold mb-1">Generated Link</p>
            <a href={lastGeneratedLink} target="_blank" rel="noopener noreferrer" className="text-blue-700 break-all">
              {lastGeneratedLink}
            </a>
            <div className="mt-3 flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(lastGeneratedLink)}
                className="px-3 py-1 border rounded text-sm"
              >
                Copy Link
              </button>
              <a href={lastGeneratedLink} target="_blank" rel="noopener noreferrer" className="px-3 py-1 border rounded text-sm">
                Open Link
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="mx-10 mt-8">
        <h3 className="font-semibold mb-4">Active Time-Bound Links</h3>
        {activeLinks.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow text-gray-400 text-center">No active links yet</div>
        ) : (
          <div className="space-y-4">
            {activeLinks.map((link) => (
              <div key={link.id} className="bg-white p-4 rounded-xl shadow flex justify-between items-center">
                <div>
                  <p className="font-bold">{link.document?.title}</p>
                  <a
                    href={buildShareUrl(link.token)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 break-all"
                  >
                    {buildShareUrl(link.token)}
                  </a>
                </div>
                <div className="text-right">
                  <p className="text-red-500 text-sm">Expires: {new Date(link.expiry).toLocaleString()}</p>
                  <p className="text-green-600 text-xs">Active</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mx-10 mt-8">
        <h3 className="font-semibold mb-4">Expired Time-Bound Links</h3>
        {expiredLinks.length === 0 ? (
          <div className="bg-white p-6 rounded-xl shadow text-gray-400 text-center">No expired links yet</div>
        ) : (
          <div className="space-y-4">
            {expiredLinks.map((link) => (
              <div key={link.id} className="bg-white p-4 rounded-xl shadow flex justify-between items-center opacity-80">
                <div>
                  <p className="font-bold">{link.document?.title}</p>
                  <p className="text-xs text-gray-500">Token: {link.token}</p>
                </div>
                <div className="text-right">
                  <p className="text-red-500 text-sm">Expired: {new Date(link.expiry).toLocaleString()}</p>
                  <p className="text-gray-500 text-xs">Inactive</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TimeBoundLinks;
