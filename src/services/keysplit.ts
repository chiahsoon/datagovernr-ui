import forge from 'node-forge';

// Extension - support for splitting into more than 2 shares?
export const splitKey = (keyBinary: string): string[] => {
    const otpBinary = forge.random.getBytesSync(keyBinary.length);
    let cipherBinary = '';
    for (let i = 0; i < keyBinary.length; i++) {
        cipherBinary += String.fromCharCode(keyBinary.charCodeAt(i) ^ otpBinary.charCodeAt(i));
    }
    return [otpBinary, cipherBinary];
};
