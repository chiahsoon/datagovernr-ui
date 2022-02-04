import forge, {} from 'node-forge';
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
        cipher.update(forge.util.createBuffer(dataBinaryBuf));
        cipher.finish();
        const cipherTextBsb = cipher.output;
        const tagBsb = cipher.mode.tag;
        // Convert to hex and concat
        const ivHex = forge.util.bytesToHex(ivBinary);
        const cipherTextHex = cipherTextBsb.toHex();
        const tagHex = tagBsb.toHex();
        return ivHex + cipherTextHex + tagHex;
    }

    decryptFile(dataBinaryBuf: ArrayBuffer): string {
        const dataHex = new TextDecoder().decode(dataBinaryBuf);
        // Extract IV from file
        const ivHex = dataHex.slice(0, AES256GCMInstance.IV_LENGTH * 2);
        const cipherTextHex = dataHex.slice(
            AES256GCMInstance.IV_LENGTH * 2,
            -AES256GCMInstance.TAG_LENGTH * 2,
        );
        // Extract auth tag from file
        const tagHex = dataHex.slice(-AES256GCMInstance.TAG_LENGTH * 2);

        const ivBinary = forge.util.hexToBytes(ivHex);
        const cipherTextBinary = forge.util.hexToBytes(cipherTextHex);
        const tagBinary = forge.util.hexToBytes(tagHex);

        const ivBsb = forge.util.createBuffer(ivBinary);
        const cipherTextBsb = forge.util.createBuffer(cipherTextBinary);
        const tagBsb = forge.util.createBuffer(tagBinary);

        // Instantiate the cipher
        const cipher = forge.cipher.createDecipher('AES-GCM', this.key);
        cipher.start({
            iv: ivBsb,
            additionalData: '',
            tagLength: AES256GCMInstance.TAG_LENGTH * 8,
            tag: tagBsb});
        cipher.update(cipherTextBsb);

        if (!cipher.finish()) {
            throw new Error('Decryption Error');
        }
        return cipher.output.getBytes();
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
