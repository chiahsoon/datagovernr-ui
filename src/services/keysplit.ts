import forge from 'node-forge';

/* Splits the key k into n shares:
 *   k^x_0, x_0^x_1, ... x_n
 * for independent random x_i
 */
export const splitKey = (keyBinary: string, numShares: number =2): string[] => {
    /*
    const otpBinary = forge.random.getBytesSync(keyBinary.length);
    let cipherBinary = '';
    for (let i = 0; i < keyBinary.length; i++) {
        cipherBinary += String.fromCharCode(keyBinary.charCodeAt(i) ^ otpBinary.charCodeAt(i));
    }
    return [otpBinary, cipherBinary];
    */
    if (!Number.isInteger(numShares) || numShares < 2) {
        throw new RangeError("Invalid parameter.");
    }
    let tempBinary = keyBinary.slice();
    let randBinary = '';
    let shareArray = [];
    for (let j = 1; j < numShares; j++) {
        randBinary = forge.random.getBytesSync(keyBinary.length);
        let cipherBinary = '';
        for (let i = 0; i < tempBinary.length; i++) {
            cipherBinary += String.fromCharCode(tempBinary.charCodeAt(i) ^ randBinary.charCodeAt(i));
        }
        shareArray.push(cipherBinary);
        tempBinary = randBinary.slice();
    }
    shareArray.push(randBinary);
    return shareArray;
};

export const rebuildKey = (shareBinaryArr: string[]): string => {
    if (shareBinaryArr.length < 2) {
        throw new RangeError("Not enough shares.");
    }
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
