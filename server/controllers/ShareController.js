import prisma from "../prismaClient.js";
import { createAuditLog } from "./AuditLogController.js";
import crypto from "crypto";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");

const resolveStoredFilePath = (storedPath) => {
    const normalized = String(storedPath || "").replace(/\\/g, "/").replace(/^\/+/, "");
    return path.resolve(serverRoot, normalized);
};

const getPublicBaseUrl = (req) => {
    const configured = String(process.env.PUBLIC_BASE_URL || "").trim();
    if (configured) return configured.replace(/\/+$/, "");
    return `${req.protocol}://${req.get("host")}`;
};

export const createSharedLink = async (req, res) => {
    try {
        const { docId, expiryDate, expiryTime, details } = req.body;
        const userId = req.userId;
        const parsedDocId = Number(docId);

        if (!Number.isInteger(parsedDocId) || parsedDocId <= 0) {
            return res.status(400).json({ message: "Valid document is required" });
        }

        if (!expiryDate || !expiryTime) {
            return res.status(400).json({ message: "Expiry date and time are required" });
        }

        // Validate ownership
        const doc = await prisma.document.findUnique({ where: { id: parsedDocId } });
        if (!doc) return res.status(404).json({ message: "Document not found" });
        if (doc.userId !== userId) return res.status(403).json({ message: "Unauthorized" });

        // Generate unique token
        const token = crypto.randomBytes(16).toString("hex");

        // Calculate expiry datetime
        const expiry = new Date(`${expiryDate}T${expiryTime}`);
        if (Number.isNaN(expiry.getTime())) {
            return res.status(400).json({ message: "Invalid expiry date/time" });
        }

        if (expiry.getTime() <= Date.now()) {
            return res.status(400).json({ message: "Expiry must be in the future" });
        }

        const link = await prisma.sharedLink.create({
            data: {
                docId: parsedDocId,
                token,
                expiry,
            },
        });

        const logDetails = details
            ? `Created link for ${doc.title}. Details: ${String(details).slice(0, 200)}`
            : `Created link for ${doc.title}`;

        await createAuditLog(userId, "CREATE_SHARED_LINK", logDetails);

        const baseUrl = getPublicBaseUrl(req);
        res.status(201).json({ token, link: `${baseUrl}/api/share/view/${token}` });

    } catch (error) {
        console.error("Create link error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const viewSharedDocument = async (req, res) => {
    try {
        const { token } = req.params;

        const link = await prisma.sharedLink.findUnique({
            where: { token },
            include: { document: true },
        });

        if (!link) return res.status(404).json({ message: "Link not found" });

        if (!link.isActive) return res.status(410).json({ message: "Link is inactive" });

        if (new Date() > new Date(link.expiry)) {
            await prisma.sharedLink.update({
                where: { id: link.id },
                data: { isActive: false },
            });
            return res.status(410).json({ message: "Link has expired" });
        }

        // Serve the file
        // Ideally we stream the file or send it.
        // Since we store local paths, we need to resolve it.
        // SECURITY NOTE: In production, verify path is inside uploads directory to avoid traversal.
        const filePath = resolveStoredFilePath(link.document.fileUrl);

        if (fs.existsSync(filePath)) {
            // Inline view for browser-supported types, with filename fallback.
            res.setHeader("Content-Disposition", `inline; filename="${link.document.title}"`);
            res.sendFile(filePath);
        } else {
            res.status(404).json({ message: "File not found on server" });
        }

    } catch (error) {
        console.error("View link error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMyLinks = async (req, res) => {
    try {
        await prisma.sharedLink.updateMany({
            where: {
                isActive: true,
                expiry: { lt: new Date() },
                document: { userId: req.userId },
            },
            data: { isActive: false },
        });

        // Links for documents owned by user
        const links = await prisma.sharedLink.findMany({
            where: {
                document: {
                    userId: req.userId
                }
            },
            include: { document: { select: { title: true } } },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json(links);
    } catch (error) {
        console.error("Get links error:", error);
        res.status(500).json({ message: "Server error" });
    }
}
