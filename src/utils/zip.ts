import {zipSync, Zip, ZipDeflate} from 'fflate';

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

export const zipStreams = async (streams: ReadableStream<Uint8Array>[], filenames: string[], out: WritableStream) => {
    const start = Date.now();
    const resultWriter = out.getWriter();
    const zip = new Zip((err, dat, final) => {
        if (err) throw Error('failed to zip');
        resultWriter.write(dat);
        if (final) resultWriter.close();
    });

    for (let streamIdx = 0; streamIdx < streams.length; streamIdx ++) {
        const stream = streams[streamIdx];
        const filename = filenames[streamIdx];
        const reader = stream.getReader();
        const zipFile = new ZipDeflate(filename);
        zip.add(zipFile);
        let chunk = await reader.read();
        while (true) {
            const nextChunk = await reader.read();
            const isFinal = nextChunk.done;
            if (chunk.value != null) zipFile.push(chunk.value, isFinal);
            if (isFinal) break;
            chunk = nextChunk;
        };
    }

    zip.end();
    console.log(`Zipping completed in ${(Date.now() - start) / 1000}s`);
};

