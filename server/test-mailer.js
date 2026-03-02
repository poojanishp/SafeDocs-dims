import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

async function testMail() {
    console.log("Testing mail with:", process.env.MAIL_USER);
    try {
        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: process.env.MAIL_USER, // Send to self
            subject: "Test Email",
            text: "It works!",
        });
        console.log("Mail sent successfully!");
    } catch (error) {
        console.error("Mail failed:", error);
    }
}

testMail();
