// src: https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
export const ab2str = (buf: ArrayBuffer) => {
    return String.fromCharCode.apply(null, Array.from(new Uint16Array(buf)));
};

export const str2ab = (str: string) => {
    const buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    const bufView = new Uint16Array(buf);
    for (let i=0, strLen=str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
};
