import forge from 'node-forge';
import {binStrToU8, u8ToBinStr} from '../../utils/file';
import {CHUNK_SIZE} from '../../utils/stream';
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

    async encryptFileToStream(blob: Blob, out: WritableStream<Uint8Array>) {
        const start = Date.now();
        const outWriter = out.getWriter();
        const ivBinStr = this.generateNewNonce();
        outWriter.write(this.encodeStr(ivBinStr));

        // Instantiate the new cipher
        const cipher = forge.cipher.createCipher('AES-GCM', this.key);
        cipher.start({
            iv: ivBinStr,
            additionalData: '',
            tagLength: AES256GCMInstance.TAG_LENGTH * 8,
        });
        // Encrypt the plaintext
        for (let idx = 0; idx < blob.size; idx += CHUNK_SIZE) {
            const chunkBuf = await blob.slice(idx, idx + CHUNK_SIZE).arrayBuffer();
            cipher.update(forge.util.createBuffer(chunkBuf));
            const encryptedChunk = cipher.output.getBytes();
            const encodedEncryptedChunk = this.encodeStr(encryptedChunk);
            outWriter.write(encodedEncryptedChunk);
        }
        cipher.finish();

        // Convert to bytes and concat
        const tagBinStr = cipher.mode.tag.getBytes();
        outWriter.write(this.encodeStr(tagBinStr));
        outWriter.close();
        console.log(`Encryption completed in ${(Date.now() - start) / 1000}s`);
    }

    async decryptFileToStream(blob: Blob, out: WritableStream<Uint8Array>) {
        const start = Date.now();
        const writer = out.getWriter();

        const ivBuf = await blob.slice(0, AES256GCMInstance.IV_LENGTH).arrayBuffer();
        const tagBuf = await blob.slice(-AES256GCMInstance.TAG_LENGTH).arrayBuffer();

        const ivBsb = forge.util.createBuffer(this.decodeBuf(ivBuf));
        const tagBsb = forge.util.createBuffer(this.decodeBuf(tagBuf));
        const ciphertextBlob = blob.slice(AES256GCMInstance.IV_LENGTH, -AES256GCMInstance.TAG_LENGTH);

        // Instantiate the cipher
        const decipher = forge.cipher.createDecipher('AES-GCM', this.key);
        decipher.start({
            iv: ivBsb,
            additionalData: '',
            tagLength: AES256GCMInstance.TAG_LENGTH * 8,
            tag: tagBsb,
        });
        for (let i = 0; i < ciphertextBlob.size; i += CHUNK_SIZE) {
            const chunkBuf = await ciphertextBlob.slice(i, i + CHUNK_SIZE).arrayBuffer();
            const chunkStr = this.decodeBuf(chunkBuf);
            decipher.update(forge.util.createBuffer(chunkStr));
            const decryptedChunk = decipher.output.getBytes();
            const encodedDecryptedChunk = this.encodeStr(decryptedChunk);
            writer.write(encodedDecryptedChunk);
        }

        if (!decipher.finish()) throw new Error('Decryption Error');
        writer.write(this.encodeStr(decipher.output.getBytes()));
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

    private encodeStr(s: string): Uint8Array {
        return binStrToU8(s);
    }

    private decodeBuf(buf: ArrayBuffer): string {
        return u8ToBinStr(new Uint8Array(buf));
    }
}

