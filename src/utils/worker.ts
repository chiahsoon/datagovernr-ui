import {u8ToBinStr} from './file';
import {CHUNK_SIZE} from './stream';

export const hashFilesWithWorkers = (files: File[]): Promise<string[]> => {
    const start = Date.now();
    const worker = new Worker(new URL('../workers/hash.ts', import.meta.url));
    return new Promise(async (resolve) => {
        worker.onmessage = (e) => {
            console.log(`File Hashing completed in ${(Date.now() - start) / 1000}s`);
            const hashes: string[] = e.data;
            resolve(hashes);
            worker.terminate();
        };
        worker.postMessage(['START', files.length]);
        for (let bufIdx = 0; bufIdx < files.length; bufIdx++) {
            const file = files[bufIdx];
            for (let byteIdx = 0; byteIdx < file.size; byteIdx += CHUNK_SIZE) {
                const chunkBuf = await file.slice(byteIdx, byteIdx + CHUNK_SIZE).arrayBuffer();
                const chunkU8 = new Uint8Array(chunkBuf);
                worker.postMessage(['CHUNK', bufIdx, u8ToBinStr(chunkU8)]);
            }
        }
        worker.postMessage(['END']);
    });
};

export const hashStreamsWithWorkers = (streams: ReadableStream<Uint8Array>[]): Promise<string[]> => {
    const start = Date.now();
    const worker = new Worker(new URL('../workers/hash.ts', import.meta.url));
    return new Promise(async (resolve) => {
        worker.onmessage = (e) => {
            console.log(`Stream Hashing completed in ${(Date.now() - start) / 1000}s`);
            const hashes: string[] = e.data;
            resolve(hashes);
            worker.terminate();
        };
        worker.postMessage(['START', streams.length]);
        for (let idx = 0; idx < streams.length; idx++) {
            const reader = streams[idx].getReader();
            for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
                const chunkU8 = chunk.value;
                worker.postMessage(['CHUNK', idx, u8ToBinStr(chunkU8)]);
            };
        }
        worker.postMessage(['END']);
    });
};

export const generateKeysWithWorkers = (passwordSaltKeyLenArr: [string, string, number][]): Promise<string[]> => {
    const start = Date.now();
    const worker = new Worker(new URL('../workers/pbkdf2.ts', import.meta.url));
    return new Promise(async (resolve) => {
        worker.onmessage = (e) => {
            console.log(`Key Generation completed in ${(Date.now() - start) / 1000}s`);
            const keyBinStrs: string[] = e.data;
            resolve(keyBinStrs);
            worker.terminate();
        };
        worker.postMessage(passwordSaltKeyLenArr);
    });
};
