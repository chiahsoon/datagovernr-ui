import forge from 'node-forge';

export const SALT_LENGTH = 64;
const NUM_ITERATIONS = 120000; // OWASP recommended count for SHA512

// Key Derivation using PBKDF2-SHA512
export function generateKey(password: string, salt: string, keyLength: number): string {
    const md = forge.md.sha512.create();
    const key = forge.pkcs5.pbkdf2(password, salt, NUM_ITERATIONS, keyLength, md);
    return key;
}
