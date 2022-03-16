import {zipSync, Zip, ZipDeflate} from 'fflate';
import {createStream} from './stream';

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

export const zipFilesStream = async (files: File[]): Promise<ReadableStream> => {
    const result = createStream();
    const resultWriter = result.writable.getWriter();

    const chunkSize = 64 * 1024;
    const arrBufsWithFileNames: [ArrayBuffer, string][] = await Promise.all(files.map(async (file) => {
        return [await file.arrayBuffer(), file.name];
    }));

    const zip = new Zip((err, dat, final) => {
        if (err) throw Error('failed to zip');
        console.log('Zipping ...');
        resultWriter.write(dat);
        if (final) resultWriter.close();
    });

    for (const arrBufWithFileName of arrBufsWithFileNames) {
        const [arrBuf, filename] = arrBufWithFileName;
        const zipFile = new ZipDeflate(filename); // Consider different compression options
        zip.add(zipFile);
        for (let i = 0; i < arrBuf.byteLength; i+=chunkSize) {
            const chunkU8 = new Uint8Array(arrBuf.slice(i, i + chunkSize));
            const isFinal = i + chunkSize >= arrBuf.byteLength;
            zipFile.push(chunkU8, isFinal);
        }
    }

    zip.end();
    return result.readable;
};
