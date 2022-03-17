
import {UploadFile} from 'antd/es/upload/interface';
import {RcFile} from 'antd/lib/upload';

export const getUploadedFilesData = (fileList: UploadFile[]): RcFile[] => {
    return fileList
        .map((file) => file.originFileObj)
        .filter((file): file is RcFile => file !== undefined); // Type Guard
};

export const binStrToU8 = (binaryString: string): Uint8Array => {
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

export const stringsToFiles = (data: [string, string, string][]): File[] => {
    const files: File[] = [];
    for (let idx = 0; idx < data.length; idx++) {
        const [fileName, fileType, dataStr] = data[idx];
        const buf = new TextEncoder().encode(dataStr);
        const blob = new Blob([buf]);
        const file = new File([blob], fileName, {
            type: fileType, // Mime-type
        });
        files.push(file);
    }
    return files;
};
