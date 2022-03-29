import {util, random} from 'node-forge';
import {SALT_LENGTH} from './keygen/pbkdf2';
import {FileEncryptionScheme, FileEncryptionService} from './encryption';
import {rebuildKey, splitKey} from './keysplit';
import {generateKeysWithWorkers} from '../utils/worker';

export const genKeyWithSalts = async (password: string, count: number): Promise<[string[], string[]]> => {
    const saltB64Arr: string[] = [];
    for (let i = 0; i < count; i++) {
        saltB64Arr.push(util.encode64(random.getBytesSync(SALT_LENGTH)));
    }
    const keys = await genKeys(password, ...saltB64Arr);
    return [keys, saltB64Arr];
};

export const encryptWithPasswordToStream = (file: File, keyBinStr: string, out: WritableStream<Uint8Array>) => {
    const cipher = FileEncryptionService.createEncryptionInstance(FileEncryptionScheme.AES256GCM, keyBinStr);
    cipher.encryptFileToStream(file, out);
};

export const passwordDecryptToStream = async (
    blob: Blob, password: string, saltB64: string, out: WritableStream<Uint8Array>) => {
    // saltB64 is a string that stores the salt in base64 format
    const keyBinStr = (await genKeys(password, saltB64))[0];
    decryptToStream(blob, keyBinStr, out);
};

export const sharesDecryptToStream = async (
    blob: Blob,
    shareB64Arr: string[],
    out: WritableStream<Uint8Array>) => {
    // Key shares stored as base64 strings
    const shareBinStrArr = [];
    for (let i=0; i<shareB64Arr.length; i++) {
        shareBinStrArr.push(util.decode64(shareB64Arr[i]));
    }
    const keyBinStr = rebuildKey(shareBinStrArr);
    decryptToStream(blob, keyBinStr, out);
};

export const regenKeyShares = async (password:string, saltB64: string): Promise<string[]> => {
    const keyBinStr = (await genKeys(password, saltB64))[0];
    return splitKey(keyBinStr);
};


// Helper Functions
const decryptToStream = async (
    blob: Blob,
    keyBinStr: string,
    out: WritableStream<Uint8Array>) => {
    const decipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        keyBinStr);
    decipher.decryptFileToStream(blob, out);
};

const genKeys = async (password: string, ...saltB64Arr: string[]): Promise<string[]> => {
    // # Salts == # Keys
    const keyLen = FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM);
    const passwordSaltKeyLenArr: [string, string, number][] = saltB64Arr
        .map((saltB64) => [password, util.decode64(saltB64), keyLen]);
    return (await generateKeysWithWorkers(passwordSaltKeyLenArr));
};
