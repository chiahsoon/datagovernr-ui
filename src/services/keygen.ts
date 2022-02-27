import forge from 'node-forge';
import {SALT_LENGTH, generateKey} from './keygen/pbkdf2';
import {FileEncryptionScheme, FileEncryptionService} from './encryption';
import {rebuildKey, splitKey} from './keysplit';

export const encryptWithPassword = (dataBinaryBuf: ArrayBuffer, password: string,
    keyShares?: string[]): [string, string] => {
    // dataBinaryBuf is a buffer that stores the data in binary format
    const saltBinary = forge.random.getBytesSync(SALT_LENGTH);
    const saltBase64 = forge.util.encode64(saltBinary);
    const keyBinary = generateKey(password, saltBinary,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    const cipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinary);
    const encryptedBinaryString = cipher.encryptFile(dataBinaryBuf);
    if (typeof keyShares !== 'undefined') {
        const keys = splitKey(keyBinary);
        for (let idx = 0; idx < keys.length; idx++) {
            const keyBase64=forge.util.encode64(keys[idx]);
            keyShares.push(keyBase64);
        }
    }
    return [encryptedBinaryString, saltBase64];
};

export const genKeyShares = (password:string, saltBase64: string): string[] => {
    const saltBinary = forge.util.decode64(saltBase64);
    const key = generateKey(password, saltBinary,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    return splitKey(key);
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

export const decryptWithShares = (dataBinaryBuf: ArrayBuffer, shareBase64Arr: string[]): string => {
    // the shares of the key are stored as base64 strings
    const shareBinaryArr = [];
    for (let i=0; i<shareBase64Arr.length; i++) {
        shareBinaryArr.push(forge.util.decode64(shareBase64Arr[i]));
    }
    const keyBinary = rebuildKey(shareBinaryArr);
    const decipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinary);
    return decipher.decryptFile(dataBinaryBuf);
};
