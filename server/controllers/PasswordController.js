import prisma from "../prismaClient.js";
import { encrypt, decrypt } from "../utils/encryption.js";
import { createAuditLog } from "./AuditLogController.js";

export const addPassword = async (req, res) => {
    try {
        const { site, username, password, notes } = req.body;
        const userId = req.userId;

        const encrypted = encrypt(password);
        // Store as JSON string: {"iv": "...", "content": "..."}
        const encryptedString = JSON.stringify(encrypted);

        const newEntry = await prisma.password.create({
            data: {
                userId,
                site,
                username,
                encryptedPassword: encryptedString,
                notes,
            },
        });

        await createAuditLog(userId, "ADD_PASSWORD", `Added password for ${site}`);

        res.status(201).json(newEntry);
    } catch (error) {
        console.error("Add password error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getPasswords = async (req, res) => {
    try {
        const passwords = await prisma.password.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: "desc" },
        });

        // Decrypt passwords before sending to client (OR send encrypted and decrypt on frontend?)
        // Usually, we decrypt on server for display if the server handles the key. 
        // Ideally, Zero-knowledge architecture prefers client-side encryption. 
        // Given the request for "backend", I'll decrypt here for simplicity.

        const decryptedPasswords = passwords.map((p) => {
            try {
                const hash = JSON.parse(p.encryptedPassword);
                const originalPassword = decrypt(hash);
                return { ...p, password: originalPassword }; // Attach 'password' field
            } catch (e) {
                console.error("Decryption failed for id:", p.id, e);
                return { ...p, password: "ERROR_DECRYPTING" };
            }
        });

        res.status(200).json(decryptedPasswords);
    } catch (error) {
        console.error("Get passwords error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deletePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const entry = await prisma.password.findUnique({ where: { id: parseInt(id) } });

        if (!entry) return res.status(404).json({ message: "Entry not found" });
        if (entry.userId !== req.userId) return res.status(403).json({ message: "Unauthorized" });

        await prisma.password.delete({ where: { id: parseInt(id) } });
        await createAuditLog(req.userId, "DELETE_PASSWORD", `Deleted password for ${entry.site}`);
        res.status(200).json({ message: "Password deleted" });
    } catch (error) {
        console.error("Delete password error:", error);
        res.status(500).json({ message: "Server error" });
    }
}
