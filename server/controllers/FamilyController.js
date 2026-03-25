import prisma from "../prismaClient.js";
import { createAuditLog } from "./AuditLogController.js";
import { sendCustomOtpMail } from "../utils/mailer.js";

const pendingFamilyMembers = new Map();
const OTP_VALIDITY_MS = 10 * 60 * 1000;

const buildOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const buildPendingKey = (userId, email) => `${userId}:${email.toLowerCase()}`;

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());

export const sendFamilyMemberOtp = async (req, res) => {
    try {
        const { email, name, relation } = req.body;
        const userId = req.userId;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Invalid email address" });
        }

        const otp = buildOtp();
        const otpExpiry = Date.now() + OTP_VALIDITY_MS;
        const key = buildPendingKey(userId, email);

        pendingFamilyMembers.set(key, {
            userId,
            email: email.trim().toLowerCase(),
            name: name || "Family Member",
            relation: relation || "Member",
            otp,
            otpExpiry,
        });

        await sendCustomOtpMail(
            email.trim().toLowerCase(),
            otp,
            "SafeDocs OTP for Family Member",
            `<h2>Your OTP is: ${otp}</h2><p>Use this OTP to confirm adding member access for this email. Valid for 10 minutes.</p>`
        );

        return res.status(200).json({ message: "OTP sent to the member email" });
    } catch (error) {
        console.error("Send family member OTP error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};

export const addFamilyMember = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const userId = req.userId;

        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required" });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const key = buildPendingKey(userId, normalizedEmail);
        const pending = pendingFamilyMembers.get(key);

        if (!pending) {
            return res.status(400).json({ message: "No pending OTP request found" });
        }

        if (pending.otp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (pending.otpExpiry < Date.now()) {
            pendingFamilyMembers.delete(key);
            return res.status(400).json({ message: "OTP expired" });
        }

        const existingMember = await prisma.familyMember.findFirst({
            where: { userId, mobile: normalizedEmail },
        });

        if (existingMember) {
            pendingFamilyMembers.delete(key);
            return res.status(400).json({ message: "Member with this email already exists" });
        }

        const member = await prisma.familyMember.create({
            data: {
                userId,
                mobile: normalizedEmail,
                name: pending.name,
                relation: pending.relation,
                status: "Verified",
            },
        });

        pendingFamilyMembers.delete(key);
        await createAuditLog(userId, "ADD_FAMILY_MEMBER", `Added member ${normalizedEmail}`);
        res.status(201).json(member);
    } catch (error) {
        console.error("Add family member error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getFamilyMembers = async (req, res) => {
    try {
        const members = await prisma.familyMember.findMany({
            where: { userId: req.userId },
        });
        res.status(200).json(members);
    } catch (error) {
        console.error("Get family members error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteFamilyMember = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.familyMember.delete({ where: { id: parseInt(id) } });

        await createAuditLog(req.userId, "DELETE_FAMILY_MEMBER", `Deleted member ${id}`);
        res.status(200).json({ message: "Member deleted" });
    } catch (error) {
        console.error("Delete family member error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
