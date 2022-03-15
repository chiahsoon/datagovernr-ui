import {util, random} from 'node-forge';
import {SALT_LENGTH, generateKey} from './keygen/pbkdf2';
import {FileEncryptionScheme, FileEncryptionService} from './encryption';
import {rebuildKey, splitKey} from './keysplit';
import {streamToArr} from '../utils/streams';

export const encryptWithPassword = (dataBinaryBuf: ArrayBuffer, password: string,
    keyShares?: string[]): [string, string] => {
    // dataBinaryBuf is a buffer that stores the data in binary format
    const saltBinary = random.getBytesSync(SALT_LENGTH);
    const saltBase64 = util.encode64(saltBinary);
    const keyBinary = generateKey(password, saltBinary,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    const cipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinary);
    const encryptedBinaryString = cipher.encryptFile(dataBinaryBuf);
    if (typeof keyShares !== 'undefined') {
        const keys = splitKey(keyBinary);
        for (let idx = 0; idx < keys.length; idx++) {
            const keyBase64 = util.encode64(keys[idx]);
            keyShares.push(keyBase64);
        }
    }
    return [encryptedBinaryString, saltBase64];
};

export const encryptWithPasswordToBuf = async (
    binBuf: ArrayBuffer,
    password: string,
    keyShares?: string[]): Promise<[ArrayBuffer, string]> => {
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
        FileEncryptionScheme.AES256GCM,
        keyBinary);
    const encryptedStream = await cipher.encryptFileToStream(binBuf);
    const blobParts: BlobPart[] = await streamToArr(encryptedStream);
    const blob = new Blob(blobParts);
    const arrBuf = await blob.arrayBuffer();
    return [arrBuf, saltBase64];
};

export const genKeySharesFromPassword = (password:string, saltBase64: string): string[] => {
    const saltBinary = util.decode64(saltBase64);
    const key = generateKey(password, saltBinary,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    return splitKey(key);
};

export const decryptWithPasswordToStream = async (
    binBuf: ArrayBuffer,
    password: string,
    saltBase64: string): Promise<ReadableStream> => {
    // saltBase64 is a string that stores the salt in base64 format
    const saltBinary = util.decode64(saltBase64);
    const keyBinary = generateKey(password, saltBinary,
        FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM));
    const decipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinary);
    return await decipher.decryptFileToStream(binBuf);
};

export const decryptWithSharesToStream = async (
    binBuf: ArrayBuffer,
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
    return await decipher.decryptFileToStream(binBuf);
};
