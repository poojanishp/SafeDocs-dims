import prisma from "../prismaClient.js";
import { createAuditLog } from "./AuditLogController.js";
import { sendCustomOtpMail, sendHtmlMail } from "../utils/mailer.js";
import crypto from "crypto";

const pendingEmergencyContacts = new Map();
const OTP_VALIDITY_MS = 10 * 60 * 1000;
const buildOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const buildPendingKey = (userId, email) => `${userId}:${String(email || "").trim().toLowerCase()}`;
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
const getPublicBaseUrl = (req) => {
    const configured = String(process.env.PUBLIC_BASE_URL || "").trim();
    if (configured) return configured.replace(/\/+$/, "");
    return `${req.protocol}://${req.get("host")}`;
};

export const sendEmergencyContactOtp = async (req, res) => {
    try {
        const { name, email, phone, relation } = req.body;
        const userId = req.userId;

        const normalizedEmail = String(email || "").trim().toLowerCase();
        const normalizedPhone = String(phone || "").trim();

        if (!name || !normalizedEmail || !relation) {
            return res.status(400).json({ message: "Name, email and relation are required" });
        }

        if (!isValidEmail(normalizedEmail)) {
            return res.status(400).json({ message: "Invalid email address" });
        }

        const owner = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        if (!owner?.email) {
            return res.status(404).json({ message: "User email not found" });
        }

        const otp = buildOtp();
        const otpExpiry = Date.now() + OTP_VALIDITY_MS;
        const key = buildPendingKey(userId, normalizedEmail);

        pendingEmergencyContacts.set(key, {
            userId,
            name: String(name).trim(),
            email: normalizedEmail,
            phone: normalizedPhone || "-",
            relation: String(relation).trim(),
            otp,
            otpExpiry,
        });

        await sendCustomOtpMail(
            owner.email,
            otp,
            "SafeDocs OTP for Emergency Contact",
            `<h2>Your OTP is: ${otp}</h2><p>Use this OTP to confirm adding emergency contact ${normalizedEmail}. Valid for 10 minutes.</p>`
        );

        return res.status(200).json({ message: "OTP sent to your registered email" });
    } catch (error) {
        console.error("Send emergency contact OTP error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const addEmergencyContact = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const userId = req.userId;

        const normalizedEmail = String(email || "").trim().toLowerCase();
        if (!normalizedEmail || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const key = buildPendingKey(userId, normalizedEmail);
        const pending = pendingEmergencyContacts.get(key);

        if (!pending) {
            return res.status(400).json({ message: "No pending emergency contact request found" });
        }

        if (pending.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (pending.otpExpiry < Date.now()) {
            pendingEmergencyContacts.delete(key);
            return res.status(400).json({ message: "OTP expired" });
        }

        const existing = await prisma.emergencyContact.findFirst({
            where: { userId, email: normalizedEmail },
        });

        if (existing) {
            pendingEmergencyContacts.delete(key);
            return res.status(400).json({ message: "Contact with this email already exists" });
        }

        const contact = await prisma.emergencyContact.create({
            data: {
                userId,
                name: pending.name,
                email: pending.email,
                phone: pending.phone,
                relation: pending.relation,
            },
        });

        pendingEmergencyContacts.delete(key);
        await createAuditLog(userId, "ADD_EMERGENCY_CONTACT", `Added contact ${pending.name}`);

        res.status(201).json(contact);
    } catch (error) {
        console.error("Add contact error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const addEmergencyContactFromFamily = async (req, res) => {
    try {
        const userId = req.userId;
        const familyMemberId = Number(req.params.familyMemberId);

        if (!Number.isInteger(familyMemberId) || familyMemberId <= 0) {
            return res.status(400).json({ message: "Invalid family member id" });
        }

        const familyMember = await prisma.familyMember.findUnique({
            where: { id: familyMemberId },
        });

        if (!familyMember) return res.status(404).json({ message: "Family member not found" });
        if (familyMember.userId !== userId) return res.status(403).json({ message: "Unauthorized" });

        const email = String(familyMember.mobile || "").trim().toLowerCase();
        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Selected family member has no valid email" });
        }

        const existing = await prisma.emergencyContact.findFirst({
            where: { userId, email },
        });
        if (existing) {
            return res.status(400).json({ message: "This family member is already an emergency contact" });
        }

        const contact = await prisma.emergencyContact.create({
            data: {
                userId,
                name: familyMember.name || "Family Member",
                email,
                phone: "-",
                relation: familyMember.relation || "Family",
            },
        });

        await createAuditLog(userId, "ADD_EMERGENCY_FROM_FAMILY", `Added ${contact.email} from family vault`);
        return res.status(201).json(contact);
    } catch (error) {
        console.error("Add emergency contact from family error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const getEmergencyContacts = async (req, res) => {
    try {
        const contacts = await prisma.emergencyContact.findMany({
            where: { userId: req.userId },
        });
        res.status(200).json(contacts);
    } catch (error) {
        console.error("Get contacts error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteEmergencyContact = async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await prisma.emergencyContact.findUnique({ where: { id: parseInt(id) } });

        if (!contact) return res.status(404).json({ message: "Contact not found" });
        if (contact.userId !== req.userId) return res.status(403).json({ message: "Unauthorized" });

        await prisma.emergencyContact.delete({ where: { id: parseInt(id) } });
        await createAuditLog(req.userId, "DELETE_EMERGENCY_CONTACT", `Deleted contact ${id}`);
        res.status(200).json({ message: "Contact deleted" });
    } catch (error) {
        console.error("Delete contact error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const triggerSOS = async (req, res) => {
    try {
        const { docIds } = req.body || {};
        const contacts = await prisma.emergencyContact.findMany({
            where: { userId: req.userId },
        });

        if (contacts.length === 0) {
            return res.status(400).json({ message: "No emergency contacts set up." });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { name: true, email: true },
        });

        const selectedIds = Array.isArray(docIds) ? docIds.map(Number).filter(Number.isInteger) : [];
        const selectedDocs = selectedIds.length > 0
            ? await prisma.document.findMany({
                where: { userId: req.userId, id: { in: selectedIds } },
                select: { id: true, title: true },
            })
            : [];

        const baseUrl = getPublicBaseUrl(req);
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const emergencyLinks = [];
        for (const doc of selectedDocs) {
            const token = crypto.randomBytes(16).toString("hex");
            await prisma.sharedLink.create({
                data: {
                    docId: doc.id,
                    token,
                    expiry,
                    isActive: true,
                },
            });

            emergencyLinks.push({
                title: doc.title,
                url: `${baseUrl}/api/share/view/${token}`,
            });
        }

        for (const contact of contacts) {
            const linksHtml = emergencyLinks.length
                ? `<ul>${emergencyLinks
                    .map((l) => `<li><a href="${l.url}">${l.title}</a></li>`)
                    .join("")}</ul><p>These links expire in 24 hours.</p>`
                : "<p>No emergency documents were selected for this SOS alert.</p>";

            const html = `
                <h2>Emergency SOS Alert</h2>
                <p>${user?.name || "A SafeDocs user"} has triggered SOS mode and shared emergency details.</p>
                <p>Contact email: ${user?.email || "-"}</p>
                ${linksHtml}
            `;

            await sendHtmlMail(contact.email, "SafeDocs SOS Alert", html);
        }

        await createAuditLog(
            req.userId,
            "TRIGGER_SOS",
            `SOS sent to ${contacts.length} contacts with ${emergencyLinks.length} document links`
        );

        res.status(200).json({ message: "SOS Alert Sent successfully!" });

    } catch (error) {
        console.error("SOS error:", error);
        res.status(500).json({ message: "Server error" });
    }
}
