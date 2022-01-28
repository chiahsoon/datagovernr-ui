// import { crypto } from 'crypto';
// const forge = require('node-forge');
import forge, {} from 'node-forge';
import {FileEncryptionInstance} from '../encryption';

/*  Ciphertext Format
 *  nonce | ciphertext | tag
 *  12    | *          | 16 bytes
 */

export class AES256GCMInstance implements FileEncryptionInstance {
    // Maintain a single key, which can be used to encrypt (using different nonces) or decrypt multiple files.
    private key!: string;
    // Set of used nonces stored as base64 strings
    private noncesAlreadyUsed: Set<string> = new Set<string>();

    constructor(key?: string) {
        if (typeof key !== 'undefined') {
            // Validate the given key
            if (!this.isValidKey(key)) {
                throw new RangeError('Invalid key');
            }
            this.key = key; // forge.util.hexToBytes(key); // Buffer.from(key, 'hex');
        } else {
            // Generate a random key
            // 256-bit key = 32 bytes
            this.key = forge.random.getBytesSync(32);
        }
    }

    encryptFile(plaintextBuffer: ArrayBuffer): string {
        // Generate a new unique nonce
        const iv = this.generateNewNonce();
        // Instantiate the new cipher
        const cipher = forge.cipher.createCipher('AES-GCM', this.key);
        cipher.start({
            iv: iv,
            additionalData: '',
            tagLength: 128});
        // Encrypt the plaintext
        cipher.update(forge.util.createBuffer(plaintextBuffer));
        cipher.finish();
        const ciphertextBuffer = cipher.output;
        const authTag = cipher.mode.tag;
        // Append the auth tag
        return iv + ciphertextBuffer.getBytes() + authTag.getBytes();
    }

    decryptFile(ciphertextBuffer: ArrayBuffer): string {
        // Extract IV from file
        const decoder = new TextDecoder();
        const cipherText = decoder.decode(ciphertextBuffer);
        const iv = forge.util.createBuffer(cipherText.slice(0, 12));
        // Extract auth tag from file
        const tag = forge.util.createBuffer(cipherText.slice(-16));
        // Instantiate the cipher
        const cipher = forge.cipher.createDecipher('AES-GCM', this.key);
        cipher.start({
            iv: iv,
            additionalData: '',
            tagLength: 128,
            tag: tag});
        // Decrypt the ciphertext
        const contents = forge.util.createBuffer(cipherText.slice(12, -16));
        cipher.update(contents);
        if (!cipher.finish()) {
            throw new Error('Decryption Error');
        }
        return cipher.output.getBytes();
    }

    isValidKey(key: string):boolean {
        /* / Validate hex format
        if (!/[0-9A-Fa-f]{6}/g.test(key)) {
            return false;
        }*/

        // Validate key length
        // 256-bit key = 32 bytes = 32 chars
        return key.length == 32;
    }

    getKey(): string {
        return this.key;
        // return this.key.toString('hex');
    }

    private generateNewNonce(): string {
        // 96-bit nonce = 12 bytes
        let iv = forge.random.getBytesSync(12);
        // Ensure that this nonce has not already been used with this key
        while (this.noncesAlreadyUsed.has(iv)) {
            iv = forge.random.getBytesSync(12);
        }
        // Save nonce to prevent reuse
        this.noncesAlreadyUsed.add(iv);
        return iv;
    }
}

// module.exports = {AES256GCMInstance};
