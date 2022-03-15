/* eslint-disable max-len */
import forge from 'node-forge';
import {createStream} from '../../utils/streams';
import {FileEncryptionInstance} from '../encryption';

export class AES256GCMInstance implements FileEncryptionInstance {
    /*  Ciphertext Format
     *  nonce | ciphertext | tag
     *  12    | *          | 16 bytes
     */
    static readonly CHUNK_SIZE = 64 * 1024;
    static readonly IV_LENGTH = 12;
    static readonly TAG_LENGTH = 16;
    // AES-256 uses a 256-bit = 32-byte key
    static readonly KEY_LENGTH = 32;
    // Maintain a single key, which can be used to encrypt (using different nonces) or decrypt multiple files.
    private readonly key!: string;
    // Set of used nonces stored as base64 strings
    private noncesAlreadyUsed: Set<string> = new Set<string>();

    constructor(key?: string) {
        if (typeof key !== 'undefined') {
            // Validate the given key
            if (!this.isValidKey(key)) {
                throw new RangeError('Invalid key');
            }
            this.key = key;
        } else {
            // Generate a random key
            this.key = forge.random.getBytesSync(AES256GCMInstance.KEY_LENGTH);
        }
    }

    encryptFile(dataBinaryBuf: ArrayBuffer): string {
        // Generate a new unique nonce
        const ivBinary = this.generateNewNonce();
        // Instantiate the new cipher
        const cipher = forge.cipher.createCipher('AES-GCM', this.key);
        cipher.start({
            iv: ivBinary,
            additionalData: '',
            tagLength: AES256GCMInstance.TAG_LENGTH * 8,
        });
        // Encrypt the plaintext
        for (let idx = 0; idx < dataBinaryBuf.byteLength; idx += AES256GCMInstance.CHUNK_SIZE) {
            const slice = dataBinaryBuf.slice(idx, idx + AES256GCMInstance.CHUNK_SIZE);
            cipher.update(forge.util.createBuffer(slice));
        }
        cipher.finish();
        const cipherTextBsb = cipher.output;
        const tagBsb = cipher.mode.tag;
        // Convert to bytes and concat
        const cipherTextBinary = cipherTextBsb.getBytes();
        const tagBinary = tagBsb.getBytes();
        return ivBinary + cipherTextBinary + tagBinary;
    }

    async encryptFileToStream(dataBinaryBuf: ArrayBuffer, result: WritableStream) {
        const writer = result.getWriter();
        const ivBinary = this.generateNewNonce();
        writer.write(new TextEncoder().encode(ivBinary));

        // Instantiate the new cipher
        const cipher = forge.cipher.createCipher('AES-GCM', this.key);
        cipher.start({
            iv: ivBinary,
            additionalData: '',
            tagLength: AES256GCMInstance.TAG_LENGTH * 8,
        });
        // Encrypt the plaintext
        for (let idx = 0; idx < dataBinaryBuf.byteLength; idx += AES256GCMInstance.CHUNK_SIZE) {
            const chunk = dataBinaryBuf.slice(idx, idx + AES256GCMInstance.CHUNK_SIZE);
            cipher.update(forge.util.createBuffer(chunk));
            const encryptedChunk = cipher.output.getBytes();
            writer.write(new TextEncoder().encode(encryptedChunk));
            console.log('Encrypting stream ...');
        }
        cipher.finish();

        // Convert to bytes and concat
        const tagBinary = cipher.mode.tag.getBytes();
        writer.write(new TextEncoder().encode(tagBinary));
        writer.close();
    }

    decryptFile(dataBinaryBuf: ArrayBuffer): string {
        const dataBinary = new TextDecoder().decode(dataBinaryBuf);
        // Extract IV from file
        const ivBinary = dataBinary.slice(0, AES256GCMInstance.IV_LENGTH);
        const cipherTextBinary = dataBinary.slice(
            AES256GCMInstance.IV_LENGTH,
            -AES256GCMInstance.TAG_LENGTH,
        );
        // Extract auth tag from file
        const tagBinary = dataBinary.slice(-AES256GCMInstance.TAG_LENGTH);

        const ivBsb = forge.util.createBuffer(ivBinary);
        const tagBsb = forge.util.createBuffer(tagBinary);

        // Instantiate the cipher
        const decipher = forge.cipher.createDecipher('AES-GCM', this.key);
        decipher.start({
            iv: ivBsb,
            additionalData: '',
            tagLength: AES256GCMInstance.TAG_LENGTH * 8,
            tag: tagBsb});
        let decryptedStr = '';
        for (let idx = 0; idx < cipherTextBinary.length; idx += AES256GCMInstance.CHUNK_SIZE) {
            const slice = cipherTextBinary.slice(idx, idx + AES256GCMInstance.CHUNK_SIZE);
            decipher.update(forge.util.createBuffer(slice));
        }
        if (!decipher.finish()) {
            throw new Error('Decryption Error');
        }
        decryptedStr += decipher.output.getBytes();
        return decryptedStr;
    }

    async decryptFileToStream(dataBinaryBuf: ArrayBuffer, result: WritableStream) {
        const writer = result.getWriter();
        let [ivBinary, tagBinary] = ['', ''];
        let [ivIdx, tagIdx] = [0, dataBinaryBuf.byteLength - 1];

        while (ivIdx < dataBinaryBuf.byteLength) {
            const ivBinaryBuf = dataBinaryBuf.slice(0, ivIdx + 1);
            if (new TextDecoder().decode(ivBinaryBuf).length > AES256GCMInstance.IV_LENGTH) break;
            ivBinary = new TextDecoder().decode(dataBinaryBuf.slice(0, ivIdx + 1));
            ivIdx += 1;
        }

        while (tagIdx >= 0) {
            const tagBinaryBuf = dataBinaryBuf.slice(tagIdx, dataBinaryBuf.byteLength);
            if (new TextDecoder().decode(tagBinaryBuf).length > AES256GCMInstance.TAG_LENGTH) break;
            tagBinary = new TextDecoder().decode(tagBinaryBuf);
            tagIdx -= 1;
        }

        // ivIdx = first data byte, tagIdx = last data byte (exclusive, so +1)
        const ciphertextBuf = dataBinaryBuf.slice(ivIdx, tagIdx+1);
        const ivBsb = forge.util.createBuffer(ivBinary);
        const tagBsb = forge.util.createBuffer(tagBinary);


        // Stream convert using TextDecoderStream
        const tempStream = createStream();
        const tempWriter = tempStream.writable.getWriter();
        for (let idx = 0; idx < ciphertextBuf.byteLength; idx += AES256GCMInstance.CHUNK_SIZE) {
            const chunk = ciphertextBuf.slice(idx, idx + AES256GCMInstance.CHUNK_SIZE);
            tempWriter.write(chunk);
        }
        tempWriter.close();

        const decodedStream = tempStream.readable.pipeThrough(new TextDecoderStream());
        const decodedReader = decodedStream.getReader();

        // Instantiate the cipher
        const decipher = forge.cipher.createDecipher('AES-GCM', this.key);
        decipher.start({
            iv: ivBsb,
            additionalData: '',
            tagLength: AES256GCMInstance.TAG_LENGTH * 8,
            tag: tagBsb,
        });
        for (let chunk = await decodedReader.read(); !chunk.done; chunk = await decodedReader.read()) {
            decipher.update(forge.util.createBuffer(chunk.value));
            const decryptedChunk = decipher.output.getBytes();
            writer.write(new TextEncoder().encode(decryptedChunk));
            console.log('Decrypting ...');
        }

        if (!decipher.finish()) {
            throw new Error('Decryption Error');
        }
        writer.write(new TextEncoder().encode(decipher.output.getBytes()));
        writer.close();
    }

    isValidKey(key: string):boolean {
        return key.length == AES256GCMInstance.KEY_LENGTH;
    }

    getKey(): string {
        return this.key;
    }

    private generateNewNonce(): string {
        // 96-bit nonce = 12 bytes
        let iv = forge.random.getBytesSync(AES256GCMInstance.IV_LENGTH);
        // Generate new nonce if this nonce has already been used with this key
        while (this.noncesAlreadyUsed.has(iv)) {
            iv = forge.random.getBytesSync(AES256GCMInstance.IV_LENGTH);
        }
        // Save nonce to prevent reuse
        this.noncesAlreadyUsed.add(iv);
        return iv;
    }
}

