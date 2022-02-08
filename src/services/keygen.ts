import forge from 'node-forge';
import {FileEncryptionScheme, FileEncryptionService} from './encryption';

// TODO: Refactor properly
export const encryptWithPassword = (dataBinaryBuf: ArrayBuffer, password: string): [string, string] => {
    // 20-byte salt to match output length of PBKDF2 hash function (default SHA-1)
    const saltBinary = forge.random.getBytesSync(20);
    const saltBase64 = forge.util.encode64(saltBinary);
    const keyBinary = generateKey(password, saltBinary);
    const cipher = FileEncryptionService.createEncryptionInstance(FileEncryptionScheme.AES256GCM, keyBinary);
    const encryptedBinaryString = cipher.encryptFile(dataBinaryBuf);
    return [encryptedBinaryString, saltBase64];
};

export const decryptWithPassword = (dataBinaryBuf: ArrayBuffer, password: string, saltBase64: string): string => {
    // dataBinaryBuf is a buffer that stores the data in binary format
    // saltBase64 is a string that stores the salt in base64 format
    const saltBinary = forge.util.decode64(saltBase64);
    const keyBinary = generateKey(password, saltBinary);
    const decipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinary);
    return decipher.decryptFile(dataBinaryBuf);
};

export const generateKey = (password: string, salt: string): string => {
    // Extract password derivation into new module
    const keySizeBytes = FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM);
    const numIterations = 1000;
    return forge.pkcs5.pbkdf2(password, salt, numIterations, keySizeBytes);
};
