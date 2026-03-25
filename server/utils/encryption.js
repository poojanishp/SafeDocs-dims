import crypto from "crypto";

const algorithm = "aes-256-ctr";
const ivLength = 16;
const defaultSecret = "vOVH6sdmpNWjRRIqCc7rdxs01lwHzfr3";
const secret = String(process.env.ENCRYPTION_KEY || defaultSecret);

// Always derive a valid 32-byte key for AES-256, regardless of env secret length.
const primaryKey = crypto.createHash("sha256").update(secret).digest();

// Backward compatibility for older data encrypted with a direct 32-byte secret.
const legacyKeys = [];
const envKeyBuffer = Buffer.from(secret);
if (envKeyBuffer.length === 32) legacyKeys.push(envKeyBuffer);
const defaultKeyBuffer = Buffer.from(defaultSecret);
if (defaultKeyBuffer.length === 32) legacyKeys.push(defaultKeyBuffer);

const decryptWithKey = (hash, key) => {
    const decipher = crypto.createDecipheriv(
        algorithm,
        key,
        Buffer.from(hash.iv, "hex")
    );
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(hash.content, "hex")),
        decipher.final(),
    ]);
    return decrypted.toString();
};

export const encrypt = (text) => {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, primaryKey, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString("hex"),
        content: encrypted.toString("hex"),
    };
};

export const decrypt = (hash) => {
    try {
        return decryptWithKey(hash, primaryKey);
    } catch {
        for (const key of legacyKeys) {
            try {
                return decryptWithKey(hash, key);
            } catch {
                // try next key
            }
        }
        throw new Error("Unable to decrypt password with configured encryption key");
    }
};
