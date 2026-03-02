import crypto from "crypto";

const algorithm = "aes-256-ctr";
// Ideally, this key should be in .env and 32 bytes long. 
// For this implementation, I'll generate a consistent key from a secret or use a fixed one if env is missing, but ensuring length.
const secretKey = process.env.ENCRYPTION_KEY || "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3"; // 32 chars
const ivLength = 16;

export const encrypt = (text) => {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString("hex"),
        content: encrypted.toString("hex"),
    };
};

export const decrypt = (hash) => {
    const decipher = crypto.createDecipheriv(
        algorithm,
        Buffer.from(secretKey),
        Buffer.from(hash.iv, "hex")
    );
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(hash.content, "hex")),
        decipher.final(),
    ]);

    return decrypted.toString();
};
