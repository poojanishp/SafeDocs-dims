import nodemailer from "nodemailer";
<<<<<<< HEAD
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server/.env regardless of where node is started from.
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const MAIL_USER = String(process.env.MAIL_USER || "").trim();
const MAIL_PASS = String(process.env.MAIL_PASS || "").trim();

const assertMailConfig = () => {
  if (!MAIL_USER || !MAIL_PASS) {
    throw new Error(
      "Mail is not configured. Set MAIL_USER and MAIL_PASS in server/.env and restart the server."
    );
  }
};

const withMailError = (error) => {
  const details = [error?.code, error?.responseCode, error?.response].filter(Boolean).join(" | ");
  throw new Error(`Failed to send email${details ? `: ${details}` : ""}`);
};
=======
>>>>>>> 60b5bf141b6f4391bc131bdc8477845e9af8d43d

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
<<<<<<< HEAD
    user: MAIL_USER,
    pass: MAIL_PASS,
=======
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
>>>>>>> 60b5bf141b6f4391bc131bdc8477845e9af8d43d
  },
});

export const sendOtpMail = async (to, otp) => {
<<<<<<< HEAD
  assertMailConfig();
  const subject = "Your OTP for Safedocs";
  const html = `<h2>Your OTP is: ${otp}</h2><p>This OTP is valid for 10 minutes.</p>`;

  try {
    await transporter.sendMail({
      from: MAIL_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    withMailError(error);
  }
};

export const sendCustomOtpMail = async (to, otp, subject, html) => {
  assertMailConfig();
  try {
    await transporter.sendMail({
      from: MAIL_USER,
      to,
      subject,
      html: html || `<h2>Your OTP is: ${otp}</h2><p>This OTP is valid for 10 minutes.</p>`,
    });
  } catch (error) {
    withMailError(error);
  }
};

export const sendHtmlMail = async (to, subject, html) => {
  assertMailConfig();
  try {
    await transporter.sendMail({
      from: MAIL_USER,
      to,
      subject,
      html,
    });
  } catch (error) {
    withMailError(error);
  }
=======
  const subject = "Your OTP for Safedocs";
  const html = `<h2>Your OTP is: ${otp}</h2><p>This OTP is valid for 10 minutes.</p>`;

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    html,
  });
};

export const sendCustomOtpMail = async (to, otp, subject, html) => {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    html: html || `<h2>Your OTP is: ${otp}</h2><p>This OTP is valid for 10 minutes.</p>`,
  });
};

export const sendHtmlMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject,
    html,
  });
>>>>>>> 60b5bf141b6f4391bc131bdc8477845e9af8d43d
};
