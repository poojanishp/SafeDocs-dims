import { Link, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import api from "../utils/api";

function UploadDocument() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [processingNote, setProcessingNote] = useState("");
  const [suggestionStatus, setSuggestionStatus] = useState("");
  const [aiSuggestedName, setAiSuggestedName] = useState("");
  const [detectedExpiryDate, setDetectedExpiryDate] = useState("");
  const [detectedExpirySource, setDetectedExpirySource] = useState("");
  const [confirmExpiryReminder, setConfirmExpiryReminder] = useState(false);
  const [expiryReminderTime, setExpiryReminderTime] = useState("09:00");
  const [dragActive, setDragActive] = useState(false);
  const browseInputRef = useRef(null);
  const tesseractLoaderRef = useRef(null);
  const pdfjsLoaderRef = useRef(null);
  const mammothLoaderRef = useRef(null);

  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = src;
    });

  const estimateBackgroundColor = (pixels, width, height) => {
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;

    const sampleRow = (y) => {
      for (let x = 0; x < width; x += 3) {
        const idx = (y * width + x) * 4;
        red += pixels[idx];
        green += pixels[idx + 1];
        blue += pixels[idx + 2];
        count += 1;
      }
    };

    const sampleCol = (x) => {
      for (let y = 0; y < height; y += 3) {
        const idx = (y * width + x) * 4;
        red += pixels[idx];
        green += pixels[idx + 1];
        blue += pixels[idx + 2];
        count += 1;
      }
    };

    sampleRow(0);
    sampleRow(Math.max(0, height - 1));
    sampleCol(0);
    sampleCol(Math.max(0, width - 1));

    if (!count) return { red: 240, green: 240, blue: 240 };
    return { red: red / count, green: green / count, blue: blue / count };
  };

  const findDocumentBounds = (canvas) => {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return null;

    const { width, height } = canvas;
    const { data } = context.getImageData(0, 0, width, height);
    const bg = estimateBackgroundColor(data, width, height);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const alpha = data[idx + 3];
        if (alpha < 12) continue;

        const distance = Math.abs(r - bg.red) + Math.abs(g - bg.green) + Math.abs(b - bg.blue);
        if (distance > 55) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX <= minX || maxY <= minY) return null;

    const margin = 16;
    const boundedX = Math.max(0, minX - margin);
    const boundedY = Math.max(0, minY - margin);
    const boundedWidth = Math.min(width - boundedX, maxX - minX + 2 * margin);
    const boundedHeight = Math.min(height - boundedY, maxY - minY + 2 * margin);

    return { x: boundedX, y: boundedY, width: boundedWidth, height: boundedHeight };
  };

  const autoCropDocumentImage = async (inputFile) => {
    const objectUrl = URL.createObjectURL(inputFile);
    try {
      const sourceImage = await loadImage(objectUrl);
      const maxDetectDimension = 900;
      const detectScale = Math.min(1, maxDetectDimension / Math.max(sourceImage.width, sourceImage.height));

      const detectCanvas = document.createElement("canvas");
      detectCanvas.width = Math.max(1, Math.round(sourceImage.width * detectScale));
      detectCanvas.height = Math.max(1, Math.round(sourceImage.height * detectScale));

      const detectContext = detectCanvas.getContext("2d");
      if (!detectContext) return inputFile;
      detectContext.drawImage(sourceImage, 0, 0, detectCanvas.width, detectCanvas.height);

      const detectBounds = findDocumentBounds(detectCanvas);
      if (!detectBounds) return inputFile;

      const scaledBounds = {
        x: Math.round(detectBounds.x / detectScale),
        y: Math.round(detectBounds.y / detectScale),
        width: Math.round(detectBounds.width / detectScale),
        height: Math.round(detectBounds.height / detectScale),
      };

      const sourceArea = sourceImage.width * sourceImage.height;
      const cropArea = scaledBounds.width * scaledBounds.height;
      const cropRatio = cropArea / sourceArea;
      if (cropArea <= 0 || cropRatio > 0.95 || cropRatio < 0.15) {
        return inputFile;
      }

      const cropCanvas = document.createElement("canvas");
      cropCanvas.width = scaledBounds.width;
      cropCanvas.height = scaledBounds.height;

      const cropContext = cropCanvas.getContext("2d");
      if (!cropContext) return inputFile;
      cropContext.drawImage(
        sourceImage,
        scaledBounds.x,
        scaledBounds.y,
        scaledBounds.width,
        scaledBounds.height,
        0,
        0,
        scaledBounds.width,
        scaledBounds.height
      );

      const blob = await new Promise((resolve) => {
        cropCanvas.toBlob(resolve, "image/jpeg", 0.92);
      });
      if (!blob) return inputFile;

      const baseName = inputFile.name.replace(/\.[^/.]+$/, "");
      return new File([blob], `${baseName || "document"}-scan.jpg`, {
        type: "image/jpeg",
        lastModified: Date.now(),
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const sanitizeNameToken = (value) =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0] || "";

  const detectDocumentType = (ocrText, fileName) => {
    const combined = `${ocrText || ""} ${fileName || ""}`.toLowerCase();
    if (/(aadhaar|aadhar|uidai|government of india)/.test(combined)) return "aadhar";
    if (/(permanent account number|income tax department|\bpan\b)/.test(combined)) return "pan";
    if (/(driving licence|driving license|dl no|transport department)/.test(combined)) return "drivinglicence";
    if (/(passport|republic of india)/.test(combined)) return "passport";
    return "document";
  };

  const monthMap = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12,
  };

  const isValidDateParts = (year, month, day) => {
    if (!year || !month || !day) return false;
    if (year < 1900 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    const dt = new Date(Date.UTC(year, month - 1, day));
    return (
      dt.getUTCFullYear() === year &&
      dt.getUTCMonth() === month - 1 &&
      dt.getUTCDate() === day
    );
  };

  const toIsoDate = (year, month, day) => {
    const y = String(year).padStart(4, "0");
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const parseCandidateDate = (candidate) => {
    const raw = String(candidate || "").trim().toLowerCase();
    if (!raw) return "";

    let match = raw.match(/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/);
    if (match) {
      let day = Number(match[1]);
      let month = Number(match[2]);
      let year = Number(match[3]);
      if (year < 100) year += 2000;
      if (isValidDateParts(year, month, day)) return toIsoDate(year, month, day);
    }

    match = raw.match(/\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      if (isValidDateParts(year, month, day)) return toIsoDate(year, month, day);
    }

    match = raw.match(/\b(\d{1,2})\s+([a-z]{3,9})\s+(\d{2,4})\b/i);
    if (match) {
      const day = Number(match[1]);
      const month = monthMap[match[2].toLowerCase()];
      let year = Number(match[3]);
      if (year < 100) year += 2000;
      if (isValidDateParts(year, month, day)) return toIsoDate(year, month, day);
    }

    return "";
  };

  const detectExpiryDateFromText = (ocrText) => {
    const lines = String(ocrText || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) return { isoDate: "", sourceLine: "" };

    const keywordPattern = /(exp|expiry|expires|valid till|valid until|valid upto|valid up to|due date|renew by)/i;
    const fullText = lines.join(" ");
    const candidates = [];

    const pushCandidate = (isoDate, sourceLine, score) => {
      if (!isoDate) return;
      const dateObj = new Date(`${isoDate}T00:00:00`);
      if (Number.isNaN(dateObj.getTime())) return;
      const now = new Date();
      const futureBonus = dateObj.getTime() >= now.setHours(0, 0, 0, 0) ? 20 : 0;
      candidates.push({ isoDate, sourceLine, score: score + futureBonus, dateObj });
    };

    for (const line of lines) {
      const dateTokens = line.match(
        /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4})\b/g
      );
      if (!dateTokens) continue;
      for (const token of dateTokens) {
        const isoDate = parseCandidateDate(token);
        const score = keywordPattern.test(line) ? 100 : 30;
        pushCandidate(isoDate, line, score);
      }
    }

    if (candidates.length === 0) {
      const fallbackTokens = fullText.match(
        /\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/g
      );
      if (fallbackTokens) {
        for (const token of fallbackTokens) {
          const isoDate = parseCandidateDate(token);
          pushCandidate(isoDate, "Detected from document text", 10);
        }
      }
    }

    if (candidates.length === 0) return { isoDate: "", sourceLine: "" };
    candidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.dateObj.getTime() - b.dateObj.getTime();
    });
    return { isoDate: candidates[0].isoDate, sourceLine: candidates[0].sourceLine };
  };

  const extractLikelyPersonName = (ocrText) => {
    if (!ocrText) return "";
    const lines = String(ocrText)
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const ignorePattern =
      /(government|india|dob|male|female|year|address|aadhaar|aadhar|uidai|authority|identity|card|passport|number|no\.?)/i;

    for (const line of lines) {
      if (line.length < 3 || line.length > 40) continue;
      if (/\d/.test(line)) continue;
      if (ignorePattern.test(line)) continue;
      const parts = line.split(/\s+/);
      if (parts.length > 4) continue;
      const first = sanitizeNameToken(parts[0]);
      if (first.length >= 3) return first;
    }
    return "";
  };

  const ensureTesseractLoaded = async () => {
    if (window.Tesseract) return window.Tesseract;
    if (tesseractLoaderRef.current) return tesseractLoaderRef.current;

    tesseractLoaderRef.current = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
      script.async = true;
      script.onload = () => {
        if (window.Tesseract) resolve(window.Tesseract);
        else reject(new Error("Tesseract failed to load"));
      };
      script.onerror = () => reject(new Error("Failed to load OCR engine"));
      document.body.appendChild(script);
    });

    return tesseractLoaderRef.current;
  };

  const ensurePdfJsLoaded = async () => {
    if (window.pdfjsLib) return window.pdfjsLib;
    if (pdfjsLoaderRef.current) return pdfjsLoaderRef.current;

    pdfjsLoaderRef.current = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.min.js";
      script.async = true;
      script.onload = () => {
        if (!window.pdfjsLib) {
          reject(new Error("PDF engine failed to load"));
          return;
        }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/legacy/build/pdf.worker.min.js";
        resolve(window.pdfjsLib);
      };
      script.onerror = () => reject(new Error("Failed to load PDF engine"));
      document.body.appendChild(script);
    });

    return pdfjsLoaderRef.current;
  };

  const ensureMammothLoaded = async () => {
    if (window.mammoth) return window.mammoth;
    if (mammothLoaderRef.current) return mammothLoaderRef.current;

    mammothLoaderRef.current = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mammoth@1.9.1/mammoth.browser.min.js";
      script.async = true;
      script.onload = () => {
        if (window.mammoth) resolve(window.mammoth);
        else reject(new Error("DOCX engine failed to load"));
      };
      script.onerror = () => reject(new Error("Failed to load DOCX engine"));
      document.body.appendChild(script);
    });

    return mammothLoaderRef.current;
  };

  const extractTextFromImage = async (inputFile) => {
    const tesseract = await ensureTesseractLoaded();
    const objectUrl = URL.createObjectURL(inputFile);
    try {
      const result = await tesseract.recognize(objectUrl, "eng");
      return result?.data?.text || "";
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const extractTextFromPdf = async (inputFile) => {
    const pdfjsLib = await ensurePdfJsLoaded();
    const bytes = await inputFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: bytes });
    const pdfDoc = await loadingTask.promise;

    const pageTexts = [];
    const maxPages = Math.min(pdfDoc.numPages, 10);
    for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      const text = (content.items || [])
        .map((item) => item?.str || "")
        .join(" ")
        .trim();
      if (text) pageTexts.push(text);
    }
    return pageTexts.join("\n");
  };

  const extractTextFromDocx = async (inputFile) => {
    const mammoth = await ensureMammothLoaded();
    const arrayBuffer = await inputFile.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result?.value || "";
  };

  const extractTextForAnalysis = async (inputFile) => {
    const type = String(inputFile?.type || "").toLowerCase();
    const ext = String(inputFile?.name || "").toLowerCase().split(".").pop() || "";

    if (type.startsWith("image/")) {
      return await extractTextFromImage(inputFile);
    }
    if (type === "application/pdf" || ext === "pdf") {
      return await extractTextFromPdf(inputFile);
    }
    if (
      type === "text/plain" ||
      ext === "txt" ||
      ext === "csv" ||
      ext === "log" ||
      ext === "md"
    ) {
      return await inputFile.text();
    }
    if (
      type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      ext === "docx"
    ) {
      return await extractTextFromDocx(inputFile);
    }
    return "";
  };

  const suggestNameWithAI = async (inputFile) => {
    setSuggestionStatus("AI: reading document text to suggest filename and expiry...");
    try {
      const extractedText = await extractTextForAnalysis(inputFile);
      const docType = detectDocumentType(extractedText, inputFile.name);
      const personToken = extractLikelyPersonName(extractedText);
      const { isoDate, sourceLine } = detectExpiryDateFromText(extractedText);
      const base = personToken || sanitizeNameToken(inputFile.name.replace(/\.[^/.]+$/, ""));
      const suggestedName = !base ? "" : docType === "document" ? `${base}document` : `${base}${docType}`;
      return {
        suggestedName,
        detectedExpiry: isoDate,
        expirySourceLine: sourceLine,
      };
    } catch (error) {
      console.error("AI suggestion failed:", error);
      return { suggestedName: "", detectedExpiry: "", expirySourceLine: "" };
    }
  };

  const processSelectedFile = async (selectedFile) => {
    if (!selectedFile) return;
    setProcessingImage(true);
    setProcessingNote(
      selectedFile.type.startsWith("image/")
        ? "AI scan in progress: isolating document from background..."
        : "AI analysis in progress..."
    );
    setSuggestionStatus("");
    try {
      const processedFile = selectedFile.type.startsWith("image/")
        ? await autoCropDocumentImage(selectedFile)
        : selectedFile;
      setFile(processedFile);
      const aiResult = await suggestNameWithAI(processedFile);
      const suggestion = aiResult.suggestedName;
      const fallback = processedFile.name.replace(/\.[^/.]+$/, "");
      const finalName = suggestion || fallback;
      setName(finalName);
      setAiSuggestedName(suggestion);
      setSuggestionStatus(suggestion ? `AI suggested name: ${suggestion}` : "AI could not confidently suggest a name.");
      setDetectedExpiryDate(aiResult.detectedExpiry || "");
      setDetectedExpirySource(aiResult.expirySourceLine || "");
      setConfirmExpiryReminder(Boolean(aiResult.detectedExpiry));
      if (selectedFile.type.startsWith("image/")) {
        setProcessingNote(
          processedFile.name !== selectedFile.name
            ? "Document-focused crop applied."
            : "No reliable boundary detected. Original image kept."
        );
      } else {
        setProcessingNote("AI analysis completed.");
      }
    } catch (error) {
      console.error("Image processing failed:", error);
      setFile(selectedFile);
      setName(selectedFile.name);
      setDetectedExpiryDate("");
      setDetectedExpirySource("");
      setConfirmExpiryReminder(false);
      setProcessingNote("AI processing failed. Original file kept.");
    } finally {
      setProcessingImage(false);
    }
  };

  const handleFileChange = async (event) => {
    const selectedFile = event.target.files?.[0];
    await processSelectedFile(selectedFile);
    event.target.value = "";
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = event.dataTransfer?.files?.[0];
    if (!droppedFile) return;

    await processSelectedFile(droppedFile);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a file");
    if (processingImage) return alert("Please wait until image processing completes");
    const finalTitle = String(name || "").trim() || file.name.replace(/\.[^/.]+$/, "");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", finalTitle);
    formData.append("category", "Uncategorized");

    setUploading(true);
    try {
      const uploadRes = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (confirmExpiryReminder && detectedExpiryDate && uploadRes?.data?.id) {
        try {
          await api.post("/reminders/add", {
            docId: uploadRes.data.id,
            type: "Personal",
            date: detectedExpiryDate,
            time: expiryReminderTime || "09:00",
            note: "Auto-detected from uploaded document",
          });
          alert("Upload successful. Expiry reminder added.");
        } catch (reminderError) {
          console.error("Failed to create expiry reminder:", reminderError);
          alert("Upload successful, but failed to save expiry reminder.");
        }
      } else {
        alert("Upload Successful!");
      }
      navigate("/mydocuments");
    } catch (error) {
      alert("Upload Failed");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef1f7]">
      <div className="bg-gradient-to-r from-[#1e3a8a] to-[#60a5fa] px-10 py-4 flex justify-between items-center text-white">
        <h1 className="text-2xl font-bold">SAFEDOCS</h1>

        <div className="flex gap-8 items-center">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/mydocuments">My Documents</Link>
        </div>
      </div>

      <div className="flex justify-center mt-16 px-4">
        <div className="bg-white w-[650px] max-w-full p-10 rounded-xl shadow">
          <div
            className={`border-2 border-dashed p-8 text-center text-gray-700 mb-6 transition ${
              dragActive ? "border-green-600 bg-green-50" : "border-blue-700"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="text-green-600 font-bold break-all">{file.name}</div>
            ) : (
              <div className="text-sm">Drag and drop file here, or browse from device</div>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <button
                type="button"
                onClick={() => browseInputRef.current?.click()}
                className="bg-blue-700 text-white px-5 py-2 rounded-lg"
              >
                Browse Files
              </button>
            </div>

            <input
              ref={browseInputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
              tabIndex={-1}
              aria-hidden="true"
            />
          </div>

          {processingNote && <p className="text-sm mb-4 text-gray-700">{processingNote}</p>}
          {suggestionStatus && <p className="text-sm mb-4 text-blue-700">{suggestionStatus}</p>}

          {detectedExpiryDate && (
            <div className="mb-6 border border-amber-300 bg-amber-50 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <input
                  id="confirm-expiry-reminder"
                  type="checkbox"
                  checked={confirmExpiryReminder}
                  onChange={(event) => setConfirmExpiryReminder(event.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label htmlFor="confirm-expiry-reminder" className="font-semibold text-amber-900 cursor-pointer">
                    Expiry date detected: {detectedExpiryDate}
                  </label>
                  <p className="text-xs text-amber-800 mt-1">
                    Confirm to add this automatically in Expiry Reminder after upload.
                  </p>
                  {detectedExpirySource && (
                    <p className="text-xs text-amber-700 mt-1 truncate">Detected from: {detectedExpirySource}</p>
                  )}
                  {confirmExpiryReminder && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="date"
                        value={detectedExpiryDate}
                        onChange={(event) => setDetectedExpiryDate(event.target.value)}
                        className="border border-amber-300 rounded px-3 py-2"
                      />
                      <input
                        type="time"
                        value={expiryReminderTime}
                        onChange={(event) => setExpiryReminderTime(event.target.value)}
                        className="border border-amber-300 rounded px-3 py-2"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">Rename file</label>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter file name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
            {aiSuggestedName && (
              <p className="text-xs text-gray-600 mt-2">
                Suggested by AI from scanned text. You can edit this before upload.
              </p>
            )}
          </div>

          <div className="flex justify-center gap-8">
            <button
              onClick={handleUpload}
              disabled={uploading || processingImage}
              className="bg-blue-700 text-white px-10 py-2 rounded-lg shadow disabled:opacity-50"
            >
              {processingImage ? "Processing..." : uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploadDocument;
