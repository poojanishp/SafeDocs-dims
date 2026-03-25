import prisma from "../prismaClient.js";

// Helper to create log
export const createAuditLog = async (userId, action, details) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                details,
            },
        });
    } catch (error) {
        console.error("Failed to create audit log:", error);
    }
};

export const getAuditLogs = async (req, res) => {
    try {
        const raw = await prisma.auditLog.findMany({
            where: { userId: req.userId },
            orderBy: { timestamp: "desc" },
        });
        const logs = raw.map(l => ({ ...l, createdAt: l.timestamp }));
        res.status(200).json(logs);
    } catch (error) {
        console.error("Get audit logs error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
