import { Router } from "express";
import { getAuditLogs } from "../controllers/AuditLogController.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const AuditRoute = Router();

AuditRoute.get("/all", verifyToken, getAuditLogs);

export default AuditRoute;
