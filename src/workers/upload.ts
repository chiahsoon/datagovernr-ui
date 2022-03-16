import {encryptWithPasswordToBuf} from '../services/password';
import {DGFile} from '../types/verificationDetails';
import {UploadWorkerParams} from '../types/uploadWorkerParams';
import {filenameToKeyShareName} from '../utils/common';
import {stringsToFiles} from '../utils/file';
import {bufToDecodedStream} from '../utils/stream';
import {zipFiles} from '../utils/zip';
import {saveFilesToDG} from '../web/api';
import {addFilesToDataset} from '../web/dataverse';
import {hashStreamsWithWorkers} from '../utils/worker';

self.onmessage = async (e: MessageEvent<UploadWorkerParams>) => {
    // Consider using streams
    const {dvParams, fileBufs, filenames, password, splitKeys} = e.data;
    if (fileBufs.length !== filenames.length) throw new Error('Number of buffers don\'t match number of filenames');

    const saltsB64: string[] = []; // To send to api
    const plaintextBufs: ArrayBuffer[] = []; // To SHA-512, encode64 then send to api
    const encryptedBufs: ArrayBuffer[] = []; // To SHA-512, encode64 then send to api
    const encryptedFiles: File[] = []; // To send to dataverse
    const allKeyShareB64Files: File[] = []; // To download

    // Start encryption process
    const encryptionStart = Date.now();
    for (let idx = 0; idx < fileBufs.length; idx ++) {
        const fileBuf = fileBufs[idx];
        const filename = filenames[idx];
        plaintextBufs.push(fileBuf);

        const keyShareB64Strs: string[] = []; // To write split keys into
        const [encryptedBuf, saltB64] = await encryptWithPasswordToBuf(
            fileBuf, password, splitKeys ? keyShareB64Strs : undefined);
        saltsB64.push(saltB64);

        encryptedBufs.push(encryptedBuf);
        encryptedFiles.push(new File([encryptedBuf], filename));

        // Convert split keys into appropriately named files
        if (!splitKeys) continue;
        const data: [string, string, string][] = keyShareB64Strs.map((ks, idx) => {
            const keyFileName = filenameToKeyShareName(filename, idx);
            return [keyFileName, 'text/plain', ks];
        });
        allKeyShareB64Files.push(...stringsToFiles(data));
    }
    console.log(`File encryption completed in: ${(Date.now() - encryptionStart) / 1000}s`);

    // Concurrently upload to Dataverse (to get file id) and hash files
    const concrUploadToDvAndHashStart = Date.now();
    const [datasetFiles, [plaintextHashes, encryptedHashes]] = await Promise.all([
        addFilesToDataset(dvParams, encryptedFiles),
        hashOnWorker(plaintextBufs, encryptedBufs),
    ]);
    console.log('Concurrent hashing and uploading to Dataverse completed in: ' +
        `${(Date.now() - concrUploadToDvAndHashStart) / 1000}s`);

    // // Alternatively, hash on current thread
    // const [datasetFiles, plaintextHashes, encryptedHashes] = await Promise.all([
    //     addFilesToDataset(dvParams, encryptedFiles),
    //     hashBuf(plaintextBufs),
    //     hashBuf(encryptedBufs),
    // ]);

    // Saving hashes and salt to DG
    const dgFiles: DGFile[] = datasetFiles.map((datasetFile, idx) => {
        return {
            id: datasetFile.dataFile.id,
            plaintextHash: plaintextHashes[idx],
            encryptedHash: encryptedHashes[idx],
            salt: saltsB64[idx],
        };
    });
    await saveFilesToDG(dgFiles);

    // Download split keys as a zip
    if (!splitKeys) {
        // @ts-expect-error
        self.postMessage(undefined, [...fileBufs]);
        return;
    }

    const genKeySharesStart = Date.now();
    const zipFile = await zipFiles(allKeyShareB64Files, 'keys.zip');
    // @ts-expect-error
    self.postMessage(zipFile, [...fileBufs]);
    console.log(`Generating key shares completed in: ${(Date.now() - genKeySharesStart) / 1000}s`);
};

const hashOnWorker = async (
    plaintextBufs: ArrayBuffer[],
    encryptedBufs: ArrayBuffer[]): Promise<[string[], string[]]> => {
    const data = [...plaintextBufs, ...encryptedBufs];
    const streams = data.map((buf) => bufToDecodedStream(buf));
    const hashes = await hashStreamsWithWorkers(streams);
    const plaintextHashes = hashes.slice(0, plaintextBufs.length);
    const encryptedHashes = hashes.slice(plaintextBufs.length);
    return [plaintextHashes, encryptedHashes];
};

// // Perform hashes on current thread
// const hashBuf = async (binBufs: ArrayBuffer[]): Promise<string[]> => {
//     const res: string[] = [];
//     for (let i = 0; i < binBufs.length; i++) {
//         const dataBinBuf = binBufs[i];
//         const hasher = md.sha512.create();
//         const dataStream = bufToDecodedStream(dataBinBuf);
//         const reader = dataStream.getReader();
//         for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
//             hasher.update(chunk.value);
//         }
//         // Fixed size so safe to store as string
//         res.push(util.encode64(hasher.digest().getBytes()));
//     }
//     return res;
// };
