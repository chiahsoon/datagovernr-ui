import {AES256GCMInstance} from './encryption/aes256gcm';

export interface FileEncryptionInstance {
    getKey(): string;
    encryptFile(dataBinaryBuf: ArrayBuffer): string;
    encryptFileToStream(dataBinaryBuf: ArrayBuffer): Promise<ReadableStream<string>>;
    decryptFile(dataBinaryBuf: ArrayBuffer): string;
    decryptFileToStream(dataBinaryBuf: ArrayBuffer): Promise<ReadableStream<string>>;
}

export enum FileEncryptionScheme {
    AES256GCM = 'aesgcm'
}

export class FileEncryptionService {
    public static createEncryptionInstance(scheme: FileEncryptionScheme, key?: string): FileEncryptionInstance {
        switch (scheme) {
        case FileEncryptionScheme.AES256GCM:
            return new AES256GCMInstance(key);

        default:
            throw new RangeError('Invalid encryption scheme');
        }
    }

    public static getKeyLength(scheme: FileEncryptionScheme): number {
        switch (scheme) {
        case FileEncryptionScheme.AES256GCM:
            return AES256GCMInstance.KEY_LENGTH;

        default:
            throw new RangeError('Invalid encryption scheme');
        }
    }
}
