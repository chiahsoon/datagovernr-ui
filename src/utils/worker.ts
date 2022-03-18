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
                const chunk = await file.slice(byteIdx, byteIdx + CHUNK_SIZE).arrayBuffer();
                worker.postMessage(['CHUNK', bufIdx, chunk]);
            }
        }
        worker.postMessage(['END']);
    });
};

export const hashStreamsWithWorkers = (streams: ReadableStream[]): Promise<string[]> => {
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
                worker.postMessage(['CHUNK', idx, chunk.value]);
            };
        }
        worker.postMessage(['END']);
    });
};
