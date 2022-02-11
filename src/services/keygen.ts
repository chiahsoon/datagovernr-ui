import forge from 'node-forge';
import {SALT_LENGTH, generateKey} from './keygen/pbkdf2';
import {FileEncryptionScheme, FileEncryptionService} from './encryption';

export const encryptWithPassword = (dataBinaryBuf: ArrayBuffer, password: string): [string, string] => {
    // dataBinaryBuf is a buffer that stores the data in binary format
    const saltBinary = forge.random.getBytesSync(SALT_LENGTH);
    const saltBase64 = forge.util.encode64(saltBinary);
    const keyBinary = generateKey(password, saltBinary,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    const cipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinary);
    const encryptedBinaryString = cipher.encryptFile(dataBinaryBuf);
    return [encryptedBinaryString, saltBase64];
};

export const decryptWithPassword = (dataBinaryBuf: ArrayBuffer, password: string, saltBase64: string): string => {
    // saltBase64 is a string that stores the salt in base64 format
    const saltBinary = forge.util.decode64(saltBase64);
    const keyBinary = generateKey(password, saltBinary,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    const decipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinary);
    return decipher.decryptFile(dataBinaryBuf);
};
