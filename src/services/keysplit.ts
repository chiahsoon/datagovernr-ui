import forge from 'node-forge';

/* Splits the key k into n shares:
 *   k^x_0, x_0^x_1, ... x_n
 * for independent random x_i
 */
export const splitKey = (keyBinStr: string, numShares: number =2): string[] => {
    /*
    const otpBinStr = forge.random.getBytesSync(keyBinStr.length);
    let cipherBinStr = '';
    for (let i = 0; i < keyBinStr.length; i++) {
        cipherBinStr += String.fromCharCode(keyBinStr.charCodeAt(i) ^ otpBinStr.charCodeAt(i));
    }
    return [otpBinStr, cipherBinStr];
    */
    if (!Number.isInteger(numShares) || numShares < 2) {
        throw new RangeError('Invalid parameter.');
    }
    let tempBinStr = keyBinStr.slice();
    let randBinStr = '';
    const shareArray = [];
    for (let j = 1; j < numShares; j++) {
        randBinStr = forge.random.getBytesSync(keyBinStr.length);
        let cipherBinStr = '';
        for (let i = 0; i < tempBinStr.length; i++) {
            cipherBinStr += String.fromCharCode(tempBinStr.charCodeAt(i) ^ randBinStr.charCodeAt(i));
        }
        shareArray.push(cipherBinStr);
        tempBinStr = randBinStr.slice();
    }
    shareArray.push(randBinStr);
    return shareArray;
};

export const rebuildKey = (shareBinStrArr: string[]): string => {
    if (shareBinStrArr.length < 2) {
        throw new RangeError('Not enough shares.');
    }
    let keyBinStr = shareBinStrArr[0].slice();
    let tempBinStr = '';
    for (let j = 1; j < shareBinStrArr.length; j++) {
        const shareBinStr = shareBinStrArr[j];
        for (let i = 0; i < shareBinStr.length; i++) {
            tempBinStr += String.fromCharCode(keyBinStr.charCodeAt(i) ^ shareBinStr.charCodeAt(i));
        }
        keyBinStr = tempBinStr.slice();
        tempBinStr = '';
    }
    return keyBinStr;
};
