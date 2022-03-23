import {AES256GCMInstance} from './encryption/aes256gcm';

export interface FileEncryptionInstance {
    getKey(): string;
    encryptFileToStream(blob: Blob, out: WritableStream<Uint8Array>): void;
    decryptFileToStream(blob: Blob, out: WritableStream<Uint8Array>): Promise<void>;
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
