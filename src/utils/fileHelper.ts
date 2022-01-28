// https://developers.google.com/web/updates/2014/08/Easier-ArrayBuffer-String-conversion-with-the-Encoding-API
export const ab2str = (buf: ArrayBuffer): string => {
    const decoder = new TextDecoder();
    return decoder.decode(buf);
};

export const str2ab = (str: string): ArrayBuffer => {
    const encoder = new TextEncoder();
    return encoder.encode(str).buffer;
};
