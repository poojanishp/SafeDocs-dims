import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import os from "os";
import UserRoute from "./routes/UserRoute.js";
import DocumentRoute from "./routes/DocumentRoute.js";
import PasswordRoute from "./routes/PasswordRoute.js";
import EmergencyRoute from "./routes/EmergencyRoute.js";
import AuditRoute from "./routes/AuditRoute.js";
import ReminderRoute from "./routes/ReminderRoute.js";
import FamilyRoute from "./routes/FamilyRoute.js";
import ShareRoute from "./routes/ShareRoute.js";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// ✅ IMPORTANT: Body parsers (this fixes req.body = undefined)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: "http://localhost:5173", // Allow frontend
  credentials: true
}));
app.use(cookieParser());

// Static uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Get local IP
const getLocalIp = () => {
  const networkInterfaces = os.networkInterfaces();
  for (let iface in networkInterfaces) {
    for (let addr of networkInterfaces[iface]) {
      if (addr.family === "IPv4" && !addr.internal) {
        return addr.address;
      }
    }
  }
  return "127.0.0.1";
};

// Routes
app.use("/api", UserRoute);
app.use("/api/documents", DocumentRoute);
app.use("/api/passwords", PasswordRoute);
app.use("/api/emergency", EmergencyRoute);
app.use("/api/audit-logs", AuditRoute);
app.use("/api/reminders", ReminderRoute);
app.use("/api/family", FamilyRoute);
app.use("/api/share", ShareRoute);

// Test route
app.get("/", (req, res) => {
  res.send("SafeDocs Server is Running! 🚀");
});

// Start server
// Start server
const host = "0.0.0.0"; // Bind to all interfaces for better connectivity
app.listen(port, host, () => {
  console.log(`Server running at http://localhost:${port}`);
});
