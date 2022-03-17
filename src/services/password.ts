import {util, random} from 'node-forge';
import {SALT_LENGTH, generateKey} from './keygen/pbkdf2';
import {FileEncryptionScheme, FileEncryptionService} from './encryption';
import {rebuildKey, splitKey} from './keysplit';

export const encryptWithPasswordToStream = (
    file: File,
    password: string,
    out: WritableStream,
    keyShares?: string[]): string => {
    const saltBinStr = random.getBytesSync(SALT_LENGTH);
    const saltB64 = util.encode64(saltBinStr);
    const keyBinStr = generateKey(password, saltBinStr,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    if (keyShares != null) {
        const keys = splitKey(keyBinStr);
        for (let idx = 0; idx < keys.length; idx++) {
            const keyB64 = util.encode64(keys[idx]);
            keyShares.push(keyB64);
        }
    }

    const cipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM, keyBinStr);
    cipher.encryptFileToStream(file, out);
    return saltB64;
};

export const genKeySharesFromPassword = (password:string, saltB64: string): string[] => {
    const saltBinStr = util.decode64(saltB64);
    const key = generateKey(password, saltBinStr,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    return splitKey(key);
};

export const passwordDecryptToStream = (
    blob: Blob,
    password: string,
    saltB64: string,
    out: WritableStream) => {
    // saltB64 is a string that stores the salt in base64 format
    const saltBinStr = util.decode64(saltB64);
    const keyBinStr = generateKey(password, saltBinStr,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    const decipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinStr);
    decipher.decryptFileToStream(blob, out);
};

export const sharesDecryptToStream = async (
    blob: Blob,
    shareB64Arr: string[],
    out: WritableStream) => {
    // the shares of the key are stored as base64 strings
    const shareBinStrArr = [];
    for (let i=0; i<shareB64Arr.length; i++) {
        shareBinStrArr.push(util.decode64(shareB64Arr[i]));
    }
    const keyBinStr = rebuildKey(shareBinStrArr);
    const decipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinStr);
    decipher.decryptFileToStream(blob, out);
};
