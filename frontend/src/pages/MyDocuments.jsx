import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import api from "../utils/api";

function MyDocuments() {
  const navigate = useNavigate();
  const location = useLocation();
  const [documents, setDocuments] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [newFolderName, setNewFolderName] = useState("");
  const [folders, setFolders] = useState({});
  const [trashMap, setTrashMap] = useState({});
  const [userId, setUserId] = useState(null);
  const [openMenuDocId, setOpenMenuDocId] = useState(null);
  const [folderAddDocId, setFolderAddDocId] = useState("");
  const [previewDoc, setPreviewDoc] = useState(null);
  const [downloadingDocId, setDownloadingDocId] = useState(null);

  const backendBaseUrl = (api.defaults.baseURL || "").replace(/\/api\/?$/, "");
  const folderStorageKey = useMemo(() => (userId ? `safedocs_folders_${userId}` : ""), [userId]);
  const trashStorageKey = useMemo(() => (userId ? `safedocs_trash_${userId}` : ""), [userId]);

  const getFileExtension = (doc) => {
    const source = String(doc?.fileUrl || doc?.title || "");
    const clean = source.split("?")[0].split("#")[0];
    const parts = clean.split(".");
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
  };

  const getFileType = (doc) => {
    const ext = getFileExtension(doc);
    const photoExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
    const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "m4v"];
    if (photoExts.includes(ext)) return "photos";
    if (videoExts.includes(ext)) return "videos";
    return "documents";
  };

  const getDownloadFileName = (doc) => {
    const title = String(doc?.title || "document").trim() || "document";
    const titleHasExtension = /\.[a-z0-9]{2,6}$/i.test(title);
    if (titleHasExtension) return title;

    const ext = getFileExtension(doc);
    return ext ? `${title}.${ext}` : title;
  };

  const getPreviewKind = (doc) => {
    const ext = getFileExtension(doc);
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"];
    const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "m4v"];
    if (imageExts.includes(ext)) return "image";
    if (videoExts.includes(ext)) return "video";
    if (ext === "pdf") return "pdf";
    if (ext === "txt") return "text";
    return "other";
  };

  const buildDocumentUrl = (fileUrl) => {
    if (!fileUrl) return "#";
    if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
    const normalizedPath = String(fileUrl).replace(/\\/g, "/").replace(/^\/+/, "");
    return `${backendBaseUrl}/${normalizedPath}`;
  };

  const downloadDocument = async (doc) => {
    if (!doc?.fileUrl) return;
    const fileUrl = buildDocumentUrl(doc.fileUrl);
    const fileName = getDownloadFileName(doc);

    setDownloadingDocId(doc.id);
    try {
      const response = await fetch(fileUrl, { credentials: "include" });
      if (!response.ok) throw new Error("Unable to download file");
      const blob = await response.blob();

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingDocId(null);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, sharedRes, profileRes] = await Promise.all([
          api.get("/documents/all"),
          api.get("/documents/shared").catch(() => ({ data: [] })),
          api.get("/profile"),
        ]);
        setDocuments(docsRes.data || []);
        setSharedDocuments(sharedRes.data || []);
        setUserId(profileRes.data?.id || null);
      } catch (err) {
        console.error("Failed to fetch documents", err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const requestedTab = location.state?.tab;
    if (typeof requestedTab === "string" && requestedTab.trim()) {
      setActiveTab(requestedTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (!folderStorageKey || !trashStorageKey) return;
    try {
      const savedFolders = JSON.parse(localStorage.getItem(folderStorageKey) || "{}");
      const savedTrash = JSON.parse(localStorage.getItem(trashStorageKey) || "{}");
      setFolders(savedFolders && typeof savedFolders === "object" ? savedFolders : {});
      setTrashMap(savedTrash && typeof savedTrash === "object" ? savedTrash : {});
    } catch (e) {
      setFolders({});
      setTrashMap({});
    }
  }, [folderStorageKey, trashStorageKey]);

  const persistFolders = (nextFolders) => {
    setFolders(nextFolders);
    if (folderStorageKey) localStorage.setItem(folderStorageKey, JSON.stringify(nextFolders));
  };

  const persistTrash = (nextTrash) => {
    setTrashMap(nextTrash);
    if (trashStorageKey) localStorage.setItem(trashStorageKey, JSON.stringify(nextTrash));
  };

  const markDocumentAsViewed = (docId) => {
    try {
      const existing = JSON.parse(localStorage.getItem("safedocs_viewed_docs_order") || "[]");
      const normalized = Array.isArray(existing) ? existing.map(Number).filter(Number.isInteger) : [];
      const updated = [docId, ...normalized.filter((id) => id !== docId)];
      localStorage.setItem("safedocs_viewed_docs_order", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to store viewed doc order", e);
    }
  };

  const createFolder = () => {
    const folderName = newFolderName.trim();
    if (!folderName) return alert("Enter a folder name");
    if (folders[folderName]) return alert("Folder already exists");

    const nextFolders = { ...folders, [folderName]: [] };
    persistFolders(nextFolders);
    setNewFolderName("");
    setActiveTab(`folder:${folderName}`);
  };

  const moveToTrash = async (docId) => {
    try {
      await api.delete(`/reminders/delete-by-doc/${docId}`);
    } catch (error) {
      console.error("Failed to delete reminders for doc:", error);
    }

    try {
      const existingViewed = JSON.parse(localStorage.getItem("safedocs_viewed_docs_order") || "[]");
      const normalizedViewed = Array.isArray(existingViewed)
        ? existingViewed.map(Number).filter(Number.isInteger)
        : [];
      const nextViewed = normalizedViewed.filter((id) => id !== Number(docId));
      localStorage.setItem("safedocs_viewed_docs_order", JSON.stringify(nextViewed));
    } catch (error) {
      console.error("Failed to cleanup recent-doc order for deleted file:", error);
    }

    const nextTrash = { ...trashMap, [docId]: Date.now() };
    persistTrash(nextTrash);
  };

  const renameDocument = async (docId, currentTitle) => {
    const nextTitle = prompt("Enter new file name", currentTitle || "");
    if (!nextTitle || !nextTitle.trim()) return;

    try {
      const res = await api.put(`/documents/rename/${docId}`, { title: nextTitle.trim() });
      setDocuments((prev) => prev.map((d) => (d.id === docId ? { ...d, title: res.data?.title || nextTitle.trim() } : d)));
    } catch (e) {
      alert(e?.response?.data?.message || "Rename failed");
    } finally {
      setOpenMenuDocId(null);
    }
  };

  const handleSetExpiry = (docId) => {
    setOpenMenuDocId(null);
    navigate("/addexpiryreminder", { state: { docId } });
  };

  const restoreFromTrash = (docId) => {
    const nextTrash = { ...trashMap };
    delete nextTrash[docId];
    persistTrash(nextTrash);
  };

  const deletePermanently = async (docId) => {
    if (!confirm("Delete this file permanently?")) return;
    try {
      await api.delete(`/documents/delete/${docId}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));

      const nextTrash = { ...trashMap };
      delete nextTrash[docId];
      persistTrash(nextTrash);

      const nextFolders = Object.fromEntries(
        Object.entries(folders).map(([name, ids]) => [name, ids.filter((id) => id !== docId)])
      );
      persistFolders(nextFolders);
    } catch (e) {
      alert(e?.response?.data?.message || "Permanent delete failed");
    }
  };

  const folderNames = Object.keys(folders);
  const isInTrash = (docId) => Boolean(trashMap[docId]);
  const activeFolderName = activeTab.startsWith("folder:") ? activeTab.slice(7) : "";
  const activeFolderDocIds = activeFolderName ? folders[activeFolderName] || [] : [];
  const addableDocsForActiveFolder = documents.filter(
    (doc) => !isInTrash(doc.id) && !activeFolderDocIds.includes(doc.id)
  );

  let filteredDocuments = documents;
  if (activeTab === "all") {
    filteredDocuments = documents.filter((doc) => !isInTrash(doc.id));
  } else if (activeTab === "shared") {
    filteredDocuments = sharedDocuments;
  } else if (activeTab === "photos" || activeTab === "videos") {
    filteredDocuments = documents.filter((doc) => !isInTrash(doc.id) && getFileType(doc) === activeTab);
  } else if (activeTab === "trash") {
    filteredDocuments = documents
      .filter((doc) => isInTrash(doc.id))
      .sort((a, b) => (trashMap[b.id] || 0) - (trashMap[a.id] || 0));
  } else if (activeTab.startsWith("folder:")) {
    const folderName = activeTab.slice(7);
    const folderDocIds = folders[folderName] || [];
    filteredDocuments = documents.filter((doc) => !isInTrash(doc.id) && folderDocIds.includes(doc.id));
  }

  return (
    <div className="min-h-screen bg-[#e6e7ee] pb-10">
      <div className="bg-gradient-to-r from-[#2f1a6f] to-[#6f8df5] px-10 py-4 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">SAFEDOCS</h1>
        <div className="flex gap-8 items-center">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/UploadDocument">Upload</Link>
        </div>
      </div>

      <div className="mx-10 mt-8 bg-gradient-to-r from-[#2f1a6f] to-[#6f8df5] rounded-xl p-6 text-white">
        <h2 className="text-3xl font-bold">My Documents</h2>
        <p>Your Secure Files at Glance</p>
        <div className="h-1 w-64 bg-white mt-2"></div>
      </div>

      <div className="flex mx-10 mt-8 gap-6">
        <div className="bg-white rounded-xl p-6 w-72">
          <h3 className="font-bold mb-4">Quick Access</h3>
          <button onClick={() => setActiveTab("all")} className="block mb-3 text-left w-full">
            All Files
          </button>
          <button onClick={() => setActiveTab("photos")} className="block mb-3 text-left w-full">
            Photos
          </button>
          <button onClick={() => setActiveTab("videos")} className="block mb-3 text-left w-full">
            Videos
          </button>
          <button onClick={() => setActiveTab("shared")} className="block mb-3 text-left w-full text-indigo-700">
            Shared Documents
          </button>

          {folderNames.length > 0 && <p className="text-xs text-gray-500 mt-4 mb-2">Your Folders</p>}
          {folderNames.map((name) => (
            <button
              key={name}
              onClick={() => setActiveTab(`folder:${name}`)}
              className="block mb-2 text-left w-full truncate text-indigo-700"
            >
              {name}
            </button>
          ))}

          <button onClick={() => setActiveTab("trash")} className="block mt-4 text-left w-full text-red-600">
            Trash
          </button>
        </div>

        <div className="flex-1">
          {activeTab !== "shared" && (
            <div className="bg-white rounded-xl p-4 mb-6">
              <h3 className="font-semibold mb-3">Create Folder</h3>
              <div className="flex gap-3">
                <input
                  placeholder="Folder name"
                  className="flex-1 border px-4 py-2 rounded-lg"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                />
                <button onClick={createFolder} className="bg-indigo-700 text-white px-4 py-2 rounded-lg">
                  Create Group
                </button>
              </div>
            </div>
          )}

          <h3 className="text-xl mb-4 capitalize">
            {activeTab.startsWith("folder:") ? `Folder: ${activeTab.slice(7)}` : activeTab}
          </h3>

          {activeTab.startsWith("folder:") && activeTab !== "shared" && (
            <div className="bg-white rounded-xl p-4 mb-6">
              <h4 className="font-semibold mb-3">Add File To This Folder</h4>
              <div className="flex gap-3">
                <select
                  className="flex-1 border px-4 py-2 rounded-lg"
                  value={folderAddDocId}
                  onChange={(e) => setFolderAddDocId(e.target.value)}
                >
                  <option value="">Select file</option>
                  {addableDocsForActiveFolder.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.title}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    const docId = Number(folderAddDocId);
                    if (!docId) return alert("Select a file");
                    const nextFolders = {
                      ...folders,
                      [activeFolderName]: [...new Set([...(folders[activeFolderName] || []), docId])],
                    };
                    persistFolders(nextFolders);
                    setFolderAddDocId("");
                  }}
                  className="bg-indigo-700 text-white px-4 py-2 rounded-lg"
                >
                  Add File
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-4 gap-6">
            {filteredDocuments.length === 0 ? (
              <p>No files found.</p>
            ) : (
              filteredDocuments.map((doc) => (
                <div
                  key={`${doc.id}-${doc.isShared ? "shared" : "own"}`}
                  className="bg-white p-4 rounded-xl shadow relative cursor-pointer"
                  onClick={() => {
                    if (activeTab === "trash") return;
                    markDocumentAsViewed(doc.id);
                    setPreviewDoc(doc);
                  }}
                >
                  {activeTab !== "shared" && (
                    <div className="absolute right-3 top-3 text-left">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuDocId((prev) => (prev === doc.id ? null : doc.id));
                        }}
                        className="px-2 py-1 rounded hover:bg-gray-100"
                        aria-label="More options"
                      >
                        ...
                      </button>
                      {openMenuDocId === doc.id && (
                        <div className="absolute right-0 mt-1 w-40 bg-white border rounded-lg shadow z-10">
                          {activeTab === "trash" ? (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  restoreFromTrash(doc.id);
                                  setOpenMenuDocId(null);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Restore
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deletePermanently(doc.id);
                                  setOpenMenuDocId(null);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                              >
                                Delete Permanently
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSetExpiry(doc.id);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Set Expiry
                              </button>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await moveToTrash(doc.id);
                                  setOpenMenuDocId(null);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100 text-red-600"
                              >
                                Delete
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  renameDocument(doc.id, doc.title);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                              >
                                Rename
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pr-8">
                    <span className="text-lg">Doc</span>
                    <p className="font-semibold truncate">{doc.title}</p>
                  </div>
                  {activeTab === "shared" && (
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      Shared by {doc.sharedByName || "Family Member"}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {previewDoc && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl h-[85vh] rounded-xl shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <h4 className="font-semibold truncate pr-4">{previewDoc.title}</h4>
                {previewDoc.isShared && (
                  <p className="text-xs text-gray-500">
                    Shared by {previewDoc.sharedByName || "Family Member"}
                    {previewDoc.sharedByEmail ? ` (${previewDoc.sharedByEmail})` : ""}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadDocument(previewDoc)}
                  disabled={downloadingDocId === previewDoc.id}
                  className="px-3 py-1 border rounded text-blue-700 border-blue-700 disabled:opacity-60"
                >
                  {downloadingDocId === previewDoc.id ? "Downloading..." : "Download"}
                </button>
                <button onClick={() => setPreviewDoc(null)} className="px-3 py-1 border rounded">
                  Close
                </button>
              </div>
            </div>

            <div className="h-[calc(85vh-56px)]">
              {getPreviewKind(previewDoc) === "image" && (
                <img
                  src={buildDocumentUrl(previewDoc.fileUrl)}
                  alt={previewDoc.title}
                  className="w-full h-full object-contain bg-black"
                />
              )}

              {getPreviewKind(previewDoc) === "video" && (
                <video src={buildDocumentUrl(previewDoc.fileUrl)} controls className="w-full h-full bg-black" />
              )}

              {getPreviewKind(previewDoc) === "pdf" && (
                <iframe title={previewDoc.title} src={buildDocumentUrl(previewDoc.fileUrl)} className="w-full h-full" />
              )}

              {getPreviewKind(previewDoc) === "text" && (
                <iframe title={previewDoc.title} src={buildDocumentUrl(previewDoc.fileUrl)} className="w-full h-full" />
              )}

              {getPreviewKind(previewDoc) === "other" && (
                <div className="h-full flex items-center justify-center text-gray-600 px-6 text-center">
                  Preview not supported for this file type.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyDocuments;
