
import {UploadFile} from 'antd/es/upload/interface';
import {RcFile} from 'antd/lib/upload';
import {saveAs} from 'file-saver';
import streamSaver from 'streamsaver';
import {zipSync} from 'fflate';

export const getUploadedFilesData = (fileList: UploadFile[]): RcFile[] => {
    return fileList
        .map((file) => file.originFileObj)
        .filter((file): file is RcFile => file !== undefined); // Type Guard
};

export const byteStringToBytes = (binaryString: string): Uint8Array => {
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

export const zipFiles = async (files: File[], zipFileName: string): Promise<File> => {
    const zipObj: {[name: string]: Uint8Array} = {};
    for (const file of files) {
        zipObj[file.name] = new Uint8Array(await file.arrayBuffer());
    }

    const zipU8 = zipSync(zipObj);
    const zipBlob = new Blob([zipU8]);
    const zipFile = new File([zipBlob], zipFileName);
    return zipFile;
};

// Different download methods
export const downloadViaATag = (fileName: string, data: Blob) => {
    const dataLink = URL.createObjectURL(data);
    const element = document.createElement('a');
    element.setAttribute('href', dataLink);
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

export const downloadViaFileSaver = (fileName: string, data: Blob) => {
    saveAs(data, fileName);
};

export const downloadViaStreamSaver = (fileName: string, bytes: Uint8Array) => {
    const fileStream = streamSaver.createWriteStream(fileName);
    const writer = fileStream.getWriter();
    writer.write(bytes);
    writer.close();
};
