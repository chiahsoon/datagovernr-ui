import {util, random} from 'node-forge';
import {SALT_LENGTH, generateKey} from './keygen/pbkdf2';
import {FileEncryptionScheme, FileEncryptionService} from './encryption';
import {rebuildKey, splitKey} from './keysplit';

export const encryptWithPasswordToStream = (
    file: File,
    password: string,
    out: WritableStream,
    keyShares?: string[]): string => {
    const saltBinary = random.getBytesSync(SALT_LENGTH);
    const saltBase64 = util.encode64(saltBinary);
    const keyBinary = generateKey(password, saltBinary,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    if (keyShares != null) {
        const keys = splitKey(keyBinary);
        for (let idx = 0; idx < keys.length; idx++) {
            const keyBase64 = util.encode64(keys[idx]);
            keyShares.push(keyBase64);
        }
    }

    const cipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM, keyBinary);
    cipher.encryptFileToStream(file, out);
    return saltBase64;
};

export const genKeySharesFromPassword = (password:string, saltBase64: string): string[] => {
    const saltBinary = util.decode64(saltBase64);
    const key = generateKey(password, saltBinary,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    return splitKey(key);
};

export const decryptWithPasswordToStream = async (
    blob: Blob,
    password: string,
    saltBase64: string): Promise<ReadableStream> => {
    // saltBase64 is a string that stores the salt in base64 format
    const saltBinary = util.decode64(saltBase64);
    const keyBinary = generateKey(password, saltBinary,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    const decipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinary);
    return await decipher.decryptFileToStream(blob);
};

export const decryptWithSharesToStream = async (
    blob: Blob,
    shareBase64Arr: string[]): Promise<ReadableStream> => {
    // the shares of the key are stored as base64 strings
    const shareBinaryArr = [];
    for (let i=0; i<shareBase64Arr.length; i++) {
        shareBinaryArr.push(util.decode64(shareBase64Arr[i]));
    }
    const keyBinary = rebuildKey(shareBinaryArr);
    const decipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinary);
    return await decipher.decryptFileToStream(blob);
};
