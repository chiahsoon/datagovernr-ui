import forge from 'node-forge';
import {FileEncryptionScheme, FileEncryptionService} from './encryption';

// TODO: Refactor properly
export const encryptWithPassword = (dataBinaryBuf: ArrayBuffer, password: string): [string, string] => {
    // 20-byte salt to match output length of PBKDF2 hash function (default SHA-1)
    const saltBinary = forge.random.getBytesSync(20);
    const saltHexString = forge.util.bytesToHex(saltBinary); // Convert to hex-format to avoid database encoding issues
    const keyBinary = generateKey(password, saltBinary);
    const cipher = FileEncryptionService.createEncryptionInstance(FileEncryptionScheme.AES256GCM, keyBinary);
    const encryptedHexString = cipher.encryptFile(dataBinaryBuf);
    return [encryptedHexString, saltHexString];
};

export const decryptWithPassword = (dataBinaryBuf: ArrayBuffer, password: string, saltHex: string): string => {
    // dataBinaryBuf is a buffer of binary values that stores data in hex format
    // saltHex is a string that stores the salt in hex format
    const saltBinary = forge.util.hexToBytes(saltHex);
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
