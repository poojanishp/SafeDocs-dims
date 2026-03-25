import prisma from "../prismaClient.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createAuditLog } from "./AuditLogController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");

const resolveStoredFilePath = (storedPath) => {
    const normalized = String(storedPath || "").replace(/\\/g, "/").replace(/^\/+/, "");
    return path.resolve(serverRoot, normalized);
};

export const uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const { title, category, tags, expiryDate } = req.body;
        const userId = req.userId; // From verifyToken middleware

        const newDoc = await prisma.document.create({
            data: {
                userId,
                title: title || req.file.originalname,
                fileUrl: `uploads/${req.file.filename}`,
                category: category || "Uncategorized",
                tags: tags || "",
                expiryDate: expiryDate ? new Date(expiryDate) : null,
            },
        });

        await createAuditLog(userId, "UPLOAD_DOCUMENT", `Uploaded ${newDoc.title}`);

        res.status(201).json(newDoc);
    } catch (error) {
        console.error("Upload error:", error);
        res.status(500).json({ message: "Server error during upload" });
    }
};

export const getDocuments = async (req, res) => {
    try {
        const documents = await prisma.document.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(documents);
    } catch (error) {
        console.error("Get documents error:", error);
        res.status(500).json({ message: "Server error fetching documents" });
    }
};

export const deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const docId = Number(id);

        if (!Number.isInteger(docId) || docId <= 0) {
            return res.status(400).json({ message: "Invalid document id" });
        }

        const doc = await prisma.document.findUnique({
            where: { id: docId }
        });

        if (!doc) return res.status(404).json({ message: "Document not found" });
        if (doc.userId !== req.userId) return res.status(403).json({ message: "Unauthorized" });

        // Delete dependent records first to satisfy FK constraints, then delete document.
        await prisma.$transaction([
            prisma.sharedLink.deleteMany({ where: { docId } }),
            prisma.reminder.deleteMany({ where: { docId } }),
            prisma.document.delete({ where: { id: docId } }),
        ]);

        // Delete file from filesystem (best-effort).
        const absoluteFilePath = resolveStoredFilePath(doc.fileUrl);
        if (doc.fileUrl && fs.existsSync(absoluteFilePath)) {
            fs.unlinkSync(absoluteFilePath);
        }

        await createAuditLog(req.userId, "DELETE_DOCUMENT", `Deleted document ${id}`);

        res.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
        console.error("Delete document error:", error);
        res.status(500).json({ message: error?.message || "Server error deleting document" });
    }
};

export const getSharedDocuments = async (req, res) => {
    try {
        const currentUser = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { email: true },
        });

        const currentEmail = String(currentUser?.email || "").trim().toLowerCase();
        if (!currentEmail) {
            return res.status(200).json([]);
        }

        const familyLinks = await prisma.familyMember.findMany({
            where: {
                mobile: currentEmail,
                status: "Verified",
            },
            select: { userId: true },
        });

        const ownerIds = [...new Set(familyLinks.map((link) => link.userId).filter(Number.isInteger))];
        if (ownerIds.length === 0) {
            return res.status(200).json([]);
        }

        const sharedDocs = await prisma.document.findMany({
            where: { userId: { in: ownerIds } },
            include: {
                user: {
                    select: { id: true, name: true, email: true },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        const payload = sharedDocs.map((doc) => ({
            ...doc,
            isShared: true,
            sharedByName: doc.user?.name || "Family Member",
            sharedByEmail: doc.user?.email || "",
        }));

        return res.status(200).json(payload);
    } catch (error) {
        console.error("Get shared documents error:", error);
        return res.status(500).json({ message: "Server error fetching shared documents" });
    }
};

export const renameDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const docId = Number(id);

        if (!Number.isInteger(docId) || docId <= 0) {
            return res.status(400).json({ message: "Invalid document id" });
        }

        const trimmedTitle = String(title || "").trim();
        if (!trimmedTitle) {
            return res.status(400).json({ message: "Document title is required" });
        }

        const doc = await prisma.document.findUnique({
            where: { id: docId },
        });

        if (!doc) return res.status(404).json({ message: "Document not found" });
        if (doc.userId !== req.userId) return res.status(403).json({ message: "Unauthorized" });

        const updatedDoc = await prisma.document.update({
            where: { id: docId },
            data: { title: trimmedTitle },
        });

        await createAuditLog(req.userId, "RENAME_DOCUMENT", `Renamed document ${docId}`);
        return res.status(200).json(updatedDoc);
    } catch (error) {
        console.error("Rename document error:", error);
        return res.status(500).json({ message: "Server error renaming document" });
    }
};
