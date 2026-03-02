import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../prismaClient.js";
import { sendCustomOtpMail, sendOtpMail } from "../utils/mailer.js";
import { createAuditLog } from "./AuditLogController.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const pendingUsers = new Map();
const OTP_VALIDITY_MS = 10 * 60 * 1000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");

const buildOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const setLoginResponse = (res, user) => {
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "7d",
  });

  const { password: userPassword, ...userInfo } = user;

  return res
    .cookie("token", token, {
      httpOnly: true,
      // secure: true, // Enable for HTTPS environments
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(200)
    .json(userInfo);
};

// ================= REGISTER =================
// Temporary store (in memory)
// ================= REGISTER =================

export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    console.log("Register request received for:", email);

    // Check if already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const otp = buildOtp();
    const otpExpiry = Date.now() + OTP_VALIDITY_MS;

    // Store temporarily (NOT in DB)
    pendingUsers.set(email, {
      name,
      email,
      password: hashedPassword,
      otp,
      otpExpiry,
    });

    console.log("Attempting to send OTP to:", email);
    try {
      await sendOtpMail(email, otp);
      console.log("OTP sent successfully to:", email);
    } catch (mailError) {
      console.error("Failed to send OTP email:", mailError);
      return res.status(500).json({ message: "Failed to send OTP. Check server logs." });
    }

    return res.status(200).json({
      message: "OTP sent to email. Please verify to complete registration.",
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};


export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const pendingUser = pendingUsers.get(email);

    if (!pendingUser) {
      return res.status(400).json({ message: "No pending registration found" });
    }

    if (pendingUser.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (pendingUser.otpExpiry < Date.now()) {
      pendingUsers.delete(email);
      return res.status(400).json({ message: "OTP expired" });
    }

    // Create user in DB NOW (after verification)
    await prisma.user.create({
      data: {
        name: pendingUser.name,
        email: pendingUser.email,
        password: pendingUser.password,
        isVerified: true,
      },
    });

    const newUser = await prisma.user.findUnique({ where: { email } });
    await createAuditLog(newUser.id, "REGISTER", "User registered");

    // Remove from temp store
    pendingUsers.delete(email);

    return res.status(200).json({
      message: "Registration successful. Account verified!",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your account first" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    setLoginResponse(res, user);

    await createAuditLog(user.id, "LOGIN", "User logged in");

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your account first" });
    }

    const otp = buildOtp();
    const otpExpiry = new Date(Date.now() + OTP_VALIDITY_MS);

    await prisma.user.update({
      where: { email },
      data: { otp, otpExpiry },
    });

    await sendCustomOtpMail(
      email,
      otp,
      "Your SafeDocs OTP for login/reset",
      `<h2>Your SafeDocs OTP is: ${otp}</h2><p>Use this OTP to login or reset password. Valid for 10 minutes.</p>`
    );

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Send forgot-password OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const loginWithOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your account first" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpiry || new Date(user.otpExpiry).getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    await prisma.user.update({
      where: { email },
      data: { otp: null, otpExpiry: null },
    });

    setLoginResponse(res, user);
    await createAuditLog(user.id, "LOGIN_OTP", "User logged in with OTP");
  } catch (error) {
    console.error("Login with OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const { email, otp, newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpiry || new Date(user.otpExpiry).getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiry: null,
      },
    });

    await createAuditLog(user.id, "PASSWORD_RESET_OTP", "Password reset with OTP");
    return res.status(200).json({ message: "Password reset successful. Please login." });
  } catch (error) {
    console.error("Reset password with OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  // Ideally we need userId here to log it, but logout is often stateless on server side if just clearing cookie.
  // If we want to log, we need verifyToken middleware on logout or just skip logging for now.
  res.clearCookie("token").status(200).json({ message: "Logout Successful" });
};

export const sendDeleteAccountOtp = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true, isVerified: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your account first" });
    }

    const otp = buildOtp();
    const otpExpiry = new Date(Date.now() + OTP_VALIDITY_MS);

    await prisma.user.update({
      where: { id: req.userId },
      data: { otp, otpExpiry },
    });

    await sendCustomOtpMail(
      user.email,
      otp,
      "SafeDocs OTP for Account Deletion",
      "<h2>Account Deletion OTP</h2><p>Use this OTP to confirm permanent account deletion. Valid for 10 minutes.</p>"
    );

    return res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    console.error("Send delete-account OTP error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const deleteAccountWithOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, otp: true, otpExpiry: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (!user.otpExpiry || new Date(user.otpExpiry).getTime() < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const docs = await prisma.document.findMany({
      where: { userId: req.userId },
      select: { fileUrl: true },
    });

    for (const doc of docs) {
      const normalized = String(doc.fileUrl || "").replace(/\\/g, "/").replace(/^\/+/, "");
      const absolutePath = path.resolve(serverRoot, normalized);
      if (doc.fileUrl && fs.existsSync(absolutePath)) {
        try {
          fs.unlinkSync(absolutePath);
        } catch (fileErr) {
          console.error("Failed deleting file during account delete:", fileErr);
        }
      }
    }

    await prisma.$transaction([
      prisma.sharedLink.deleteMany({
        where: {
          document: { userId: req.userId },
        },
      }),
      prisma.reminder.deleteMany({ where: { userId: req.userId } }),
      prisma.password.deleteMany({ where: { userId: req.userId } }),
      prisma.emergencyContact.deleteMany({ where: { userId: req.userId } }),
      prisma.familyMember.deleteMany({ where: { userId: req.userId } }),
      prisma.document.deleteMany({ where: { userId: req.userId } }),
      prisma.auditLog.deleteMany({ where: { userId: req.userId } }),
      prisma.user.delete({ where: { id: req.userId } }),
    ]);

    return res.clearCookie("token").status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!isValidEmail) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && existing.id !== req.userId) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        name: String(name).trim(),
        email: normalizedEmail,
      },
    });

    await createAuditLog(req.userId, "UPDATE_PROFILE", "Updated profile details");

    const { password, ...userInfo } = updated;
    return res.status(200).json(userInfo);
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashed },
    });

    await createAuditLog(req.userId, "CHANGE_PASSWORD", "Password changed");
    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { password, ...userInfo } = user;

    res.status(200).json(userInfo);

  } catch (error) {
    console.error("Get User error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

