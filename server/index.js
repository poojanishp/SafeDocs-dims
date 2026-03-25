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

/* ---------------- BODY PARSER ---------------- */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ---------------- CORS ---------------- */
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(cookieParser());

/* ---------------- STATIC FILES ---------------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ---------------- GET LOCAL IP ---------------- */
const getLocalIp = () => {
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }

  return "127.0.0.1";
};

/* ---------------- ROUTES ---------------- */
app.use("/api", UserRoute);
app.use("/api/documents", DocumentRoute);
app.use("/api/passwords", PasswordRoute);
app.use("/api/emergency", EmergencyRoute);
app.use("/api/audit-logs", AuditRoute);
app.use("/api/reminders", ReminderRoute);
app.use("/api/family", FamilyRoute);
app.use("/api/share", ShareRoute);

/* ---------------- TEST ROUTE ---------------- */
app.get("/", (req, res) => {
  res.send("SafeDocs Server is Running 🚀");
});

/* ---------------- START SERVER ---------------- */
const host = "0.0.0.0";

app.listen(port, host, () => {
  const localIP = getLocalIp();

  console.log(`🚀 Server running`);
  console.log(`Network: http://${localIP}:${port}`);
});