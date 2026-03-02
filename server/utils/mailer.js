import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendOtpMail = async (to, otp) => {
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
};
