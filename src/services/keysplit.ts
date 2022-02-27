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

export const rebuildKey = (shareBinaryArr: string[]): string => {
    let keyBinary = shareBinaryArr[0].slice();
    let tempBinary = '';
    for (let j = 1; j < shareBinaryArr.length; j++) {
        const shareBinary = shareBinaryArr[j];
        for (let i = 0; i < shareBinary.length; i++) {
            tempBinary += String.fromCharCode(keyBinary.charCodeAt(i) ^ shareBinary.charCodeAt(i));
        }
        keyBinary = tempBinary.slice();
        tempBinary = '';
    }
    return keyBinary;
};
