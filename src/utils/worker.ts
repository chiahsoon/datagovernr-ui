import {UploadWorkerParams} from '../types/uploadWorkerParams';
import {CHUNK_SIZE} from './stream';

export const hashBufsWithWorkers = (bufs: ArrayBuffer[]): Promise<string[]> => {
    const worker = new Worker(new URL('../workers/hash.ts', import.meta.url));
    return new Promise(async (resolve) => {
        worker.onmessage = (e) => {
            const hashes: string[] = e.data;
            resolve(hashes);
            worker.terminate();
        };
        worker.postMessage(['START', bufs.length]);
        for (let bufIdx = 0; bufIdx < bufs.length; bufIdx++) {
            const buf = bufs[bufIdx];
            for (let byteIdx = 0; byteIdx < buf.byteLength; byteIdx += CHUNK_SIZE) {
                const chunk = buf.slice(byteIdx, byteIdx + CHUNK_SIZE);
                worker.postMessage(['CHUNK', bufIdx, chunk]);
            }
        }
        worker.postMessage(['END']);
    });
};

export const hashStreamsWithWorkers = (streams: ReadableStream<string>[]): Promise<string[]> => {
    const worker = new Worker(new URL('../workers/hash.ts', import.meta.url));
    return new Promise(async (resolve) => {
        worker.onmessage = (e) => {
            const hashes: string[] = e.data;
            resolve(hashes);
            worker.terminate();
        };
        worker.postMessage(['START', streams.length]);
        for (let idx = 0; idx < streams.length; idx++) {
            const reader = streams[idx].getReader();
            for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
                worker.postMessage(['CHUNK', idx, chunk.value]);
            };
        }
        worker.postMessage(['END']);
    });
};

export const uploadWithWorkers = (params: UploadWorkerParams): Promise<File | null> => {
    const worker = new Worker(new URL('../workers/upload.ts', import.meta.url));
    return new Promise(async (resolve) => {
        worker.onmessage = (e) => {
            const keySharesZip: File = e.data;
            resolve(keySharesZip);
            worker.terminate();
        };
        worker.postMessage(params, [...params.fileBufs]);
    });
};
