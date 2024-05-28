import * as crypto from "crypto";
import * as cryptoJS from "crypto-js";

export class EncryptHelper {
    /**
     * SHA256
     * @param data
     */
    public static SHA256JS(data: string): string {
        return crypto.createHash("sha256").update(data).digest("hex");
    }

    /**
     * MD5加密
     * @param data
     * @returns
     */
    public static md5(data?: any): any {
        const hash = crypto.createHash("md5");
        if (data) {
            return hash.update(data).digest("hex");
        }
        return hash;
    }

    static aes256Encrypt(data: string, key: string, version: number) {
        if (!data) return "";
        const dataBuffer = Buffer.from(data);
        switch (version) {
            case 1:
                const iv = crypto.randomBytes(16);
                const pwd_uint8 = new Uint8Array(crypto.createHash("sha256").update(key).digest().buffer);
                const encipher = crypto.createCipheriv("AES-256-CTR", pwd_uint8, iv);
                return Buffer.concat([new Uint8Array([1]), iv, encipher.update(dataBuffer)]).toString("base64");
            default:
                return "";
        }
    }

    static aes256Decrypt(encrypted: string, key: string) {
        if (!encrypted) return "";
        const dataBuffer = Buffer.from(encrypted, "base64");
        const version = dataBuffer[0];
        switch (version) {
            case 1:
                const iv = dataBuffer.slice(1, 17);
                const pwd_uint8 = new Uint8Array(crypto.createHash("sha256").update(key).digest().buffer);
                const clearEncoding = "utf8";
                const decipher = crypto.createDecipheriv("AES-256-CTR", pwd_uint8, iv);
                return decipher.update(dataBuffer.slice(17), undefined, clearEncoding);
            default:
                return "";
        }
    }

    /**
     * 对称加密
     * @param password 密码
     * @param text     明文
     */
    public static cipher(password: string, text: string): string {
        const algorithm = "aes-192-cbc";
        const key = crypto.scryptSync(password, "salt", 24);
        const iv = Buffer.alloc(16, 0);
        try {
            const cipher = crypto.createCipheriv(algorithm, key, iv);
            let encrypted = cipher.update(text, "utf8", "base64");
            encrypted += cipher.final("base64");
            return encrypted;
        } catch (err) {
            return "";
        }
    }

    /**
     * 对称解密
     * @param password  密码
     * @param encrypted 密文
     */
    public static decipher(password: string, encrypted: string): string {
        const algorithm = "aes-192-cbc";
        const key = crypto.scryptSync(password, "salt", 24);
        const iv = Buffer.alloc(16, 0);
        try {
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            let decrypted = decipher.update(encrypted, "base64", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
        } catch (err) {
            return "";
        }
    }

    /**
     * 对称加密
     * @param password 密码
     * @param text     明文
     */
    static cipherJS(password: string, text: string): string {
        try {
            const encrypted = cryptoJS.AES.encrypt(text, password);
            return encrypted.toString();
        } catch (err) {
            return "";
        }
    }

    /**
     * 对称解密
     * @param password  密码
     * @param encrypted 密文
     */
    static decipherJS(password: string, encrypted: string): string {
        try {
            const decrypted = cryptoJS.AES.decrypt(encrypted, password);
            const decryptedStr = decrypted.toString(cryptoJS.enc.Utf8);
            return decryptedStr;
        } catch (err) {
            return "";
        }
    }
}
