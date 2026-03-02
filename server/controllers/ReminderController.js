import prisma from "../prismaClient.js";
import { createAuditLog } from "./AuditLogController.js";

export const addReminder = async (req, res) => {
    try {
        const { docId, type, date, time, note } = req.body;
        const userId = req.userId;

        const reminder = await prisma.reminder.create({
            data: {
                userId,
                docId: docId ? parseInt(docId) : null,
                type: type || "General",
                date: new Date(date),
                time,
                note,
            },
        });

        await createAuditLog(userId, "ADD_REMINDER", `Added reminder for ${date}`);
        res.status(201).json(reminder);
    } catch (error) {
        console.error("Add reminder error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getReminders = async (req, res) => {
    try {
        const reminders = await prisma.reminder.findMany({
            where: { userId: req.userId },
            include: { document: { select: { title: true } } }, // Fetch doc title if linked
            orderBy: { date: "asc" },
        });
        res.status(200).json(reminders);
    } catch (error) {
        console.error("Get reminders error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteReminder = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.reminder.delete({ where: { id: parseInt(id) } }); // Simplified check

        await createAuditLog(req.userId, "DELETE_REMINDER", `Deleted reminder ${id}`);
        res.status(200).json({ message: "Reminder deleted" });
    } catch (error) {
        console.error("Delete reminder error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteRemindersByDoc = async (req, res) => {
    try {
        const docId = Number(req.params.docId);
        if (!Number.isInteger(docId) || docId <= 0) {
            return res.status(400).json({ message: "Invalid document id" });
        }

        const doc = await prisma.document.findUnique({
            where: { id: docId },
            select: { userId: true },
        });

        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }
        if (doc.userId !== req.userId) {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const result = await prisma.reminder.deleteMany({
            where: {
                userId: req.userId,
                docId,
            },
        });

        await createAuditLog(req.userId, "DELETE_REMINDER_BY_DOC", `Deleted reminders for document ${docId}`);
        return res.status(200).json({ deletedCount: result.count });
    } catch (error) {
        console.error("Delete reminders by doc error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
