import {md, util} from 'node-forge';

self.onmessage = (e: MessageEvent<ArrayBuffer[]>) => {
    const dataBinBufs = e.data;
    const hashes: string[] = [];
    for (let idx = 0; idx < dataBinBufs.length; idx++) {
        const dataBinBuf = dataBinBufs[idx];
        const chunkSize = 64 * 1024;
        const hasher = md.sha512.create();
        for (let i = 0; i < dataBinBuf.byteLength; i+=chunkSize) {
            console.log('Hashing buffer ...');
            const chunkBinBuf = dataBinBuf.slice(i, i + chunkSize);
            const chunkBinStr = new TextDecoder().decode(chunkBinBuf);
            hasher.update(chunkBinStr);
        }
        // Fixed size so safe to store as string
        hashes.push(util.encode64(hasher.digest().getBytes()));
    }
    self.postMessage(hashes);
};

