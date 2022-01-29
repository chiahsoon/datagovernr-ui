import forge from 'node-forge';
import {FileEncryptionScheme, FileEncryptionService} from './encryption';

// TODO: Refactor properly
export const encryptWithPassword = (plaintext: ArrayBuffer, password: string): [string, string] => {
    // 20-byte salt to match output length of PBKDF2 hash function (default SHA-1)
    const salt = forge.random.getBytesSync(20);
    const key = generateKey(password, salt);
    const cipher = FileEncryptionService.createEncryptionInstance(FileEncryptionScheme.AES256GCM, key);
    const cipherText = cipher.encryptFile(plaintext);
    return [cipherText, salt];
};

export const decryptWithPassword = (encrypted: ArrayBuffer, password: string, salt: string): string => {
    const key = generateKey(password, salt);
    const decipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        key);
    return decipher.decryptFile(encrypted);
};

export const generateKey = (password: string, salt: string): string => {
    // Extract password derivation into new module
    const keySizeBytes = FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM);
    const numIterations = 1000;
    return forge.pkcs5.pbkdf2(password, salt, numIterations, keySizeBytes);
};
