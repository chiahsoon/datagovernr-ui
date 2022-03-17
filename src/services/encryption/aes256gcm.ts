import forge from 'node-forge';
import {binStrToU8} from '../../utils/file';
import {CHUNK_SIZE, createStream, blobToStream} from '../../utils/stream';
import {FileEncryptionInstance} from '../encryption';

export class AES256GCMInstance implements FileEncryptionInstance {
    /*  Ciphertext Format
     *  nonce | ciphertext | tag
     *  12    | *          | 16 bytes
     */
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

    encryptFile(binBuf: ArrayBuffer): string {
        // Generate a new unique nonce
        const ivBinStr = this.generateNewNonce();
        // Instantiate the new cipher
        const cipher = forge.cipher.createCipher('AES-GCM', this.key);
        cipher.start({
            iv: ivBinStr,
            additionalData: '',
            tagLength: AES256GCMInstance.TAG_LENGTH * 8,
        });
        // Encrypt the plaintext
        for (let idx = 0; idx < binBuf.byteLength; idx += CHUNK_SIZE) {
            const slice = binBuf.slice(idx, idx + CHUNK_SIZE);
            cipher.update(forge.util.createBuffer(slice));
        }
        cipher.finish();
        const cipherTextBsb = cipher.output;
        const tagBsb = cipher.mode.tag;
        // Convert to bytes and concat
        const cipherTextBinStr = cipherTextBsb.getBytes();
        const tagBinStr = tagBsb.getBytes();
        return ivBinStr + cipherTextBinStr + tagBinStr;
    }

    async encryptFileToStream(blob: Blob, out: WritableStream<Uint8Array>) {
        const start = Date.now();
        const outWriter = out.getWriter();
        const ivBinStr = this.generateNewNonce();
        outWriter.write(new TextEncoder().encode(ivBinStr));

        // Instantiate the new cipher
        const cipher = forge.cipher.createCipher('AES-GCM', this.key);
        cipher.start({
            iv: ivBinStr,
            additionalData: '',
            tagLength: AES256GCMInstance.TAG_LENGTH * 8,
        });
        // Encrypt the plaintext
        for (let idx = 0; idx < blob.size; idx += CHUNK_SIZE) {
            const chunk = await blob.slice(idx, idx + CHUNK_SIZE).arrayBuffer();
            cipher.update(forge.util.createBuffer(chunk));
            const encryptedChunk = cipher.output.getBytes();
            outWriter.write(new TextEncoder().encode(encryptedChunk));
        }
        cipher.finish();

        // Convert to bytes and concat
        const tagBinStr = cipher.mode.tag.getBytes();
        outWriter.write(new TextEncoder().encode(tagBinStr));
        outWriter.close();
        console.log(`Encryption completed in ${(Date.now() - start) / 1000}s`);
    }

    decryptFile(binBuf: ArrayBuffer): string {
        const dataBinStr = new TextDecoder().decode(binBuf);
        // Extract IV from file
        const ivBinStr = dataBinStr.slice(0, AES256GCMInstance.IV_LENGTH);
        const cipherTextBinStr = dataBinStr.slice(
            AES256GCMInstance.IV_LENGTH,
            -AES256GCMInstance.TAG_LENGTH,
        );
        // Extract auth tag from file
        const tagBinStr = dataBinStr.slice(-AES256GCMInstance.TAG_LENGTH);

        const ivBsb = forge.util.createBuffer(ivBinStr);
        const tagBsb = forge.util.createBuffer(tagBinStr);

        // Instantiate the cipher
        const decipher = forge.cipher.createDecipher('AES-GCM', this.key);
        decipher.start({
            iv: ivBsb,
            additionalData: '',
            tagLength: AES256GCMInstance.TAG_LENGTH * 8,
            tag: tagBsb});
        let decryptedStr = '';
        for (let idx = 0; idx < cipherTextBinStr.length; idx += CHUNK_SIZE) {
            const slice = cipherTextBinStr.slice(idx, idx + CHUNK_SIZE);
            decipher.update(forge.util.createBuffer(slice));
        }
        if (!decipher.finish()) {
            throw new Error('Decryption Error');
        }
        decryptedStr += decipher.output.getBytes();
        return decryptedStr;
    }

    async decryptFileToStream(blob: Blob, out: WritableStream) {
        const start = Date.now();
        const writer = out.getWriter();
        let [ivBinStr, tagBinStr] = ['', ''];
        let [ivIdx, tagIdx] = [0, blob.size - 1];

        while (ivIdx < blob.size) {
            const ivBinStrBuf = await blob.slice(0, ivIdx + 1).arrayBuffer();
            if (new TextDecoder().decode(ivBinStrBuf).length > AES256GCMInstance.IV_LENGTH) break;
            ivBinStr = new TextDecoder().decode(ivBinStrBuf);
            ivIdx += 1;
        }

        while (tagIdx >= 0) {
            const tagBinStrBuf = await blob.slice(tagIdx, blob.size).arrayBuffer();
            if (new TextDecoder().decode(tagBinStrBuf).length > AES256GCMInstance.TAG_LENGTH) break;
            tagBinStr = new TextDecoder().decode(tagBinStrBuf);
            tagIdx -= 1;
        }

        // ivIdx = first data byte, tagIdx = last data byte (exclusive, so +1)
        const ivBsb = forge.util.createBuffer(ivBinStr);
        const tagBsb = forge.util.createBuffer(tagBinStr);
        const ciphertextBlob = blob.slice(ivIdx, tagIdx+1);

        // Decode buffer bytes to UTF-8
        // If directly slice and decode, some files have issue
        const decodedStream = createStream();
        blobToStream(ciphertextBlob, decodedStream.writable); // Do not await
        const decodedReader = decodedStream.readable.pipeThrough(new TextDecoderStream()).getReader();

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
            writer.write(binStrToU8(decryptedChunk));
        }

        if (!decipher.finish()) throw new Error('Decryption Error');
        writer.write(binStrToU8(decipher.output.getBytes()));
        writer.close();
        console.log(`Decryption completed in ${(Date.now() - start) / 1000}s`);
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

