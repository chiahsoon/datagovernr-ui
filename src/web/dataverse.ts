import {DatasetFile} from '../types/datasetFile';
import {DataverseParams} from '../types/dataverseParams';
import {Dataset} from '../types/dataset';
import {checkFilesExistenceOnDG} from './api';
import {createStream, streamToArr} from '../utils/stream';
import {zipStreams} from '../utils/zip';

export const getDvDatasetInfo = async (dvParams: DataverseParams): Promise<Dataset> => {
    const {siteUrl, datasetId} = dvParams;
    const url = `${siteUrl}/api/datasets/${datasetId}/versions/:latest`;
    const resp = await fetch(url, {
        headers: {'X-Dataverse-key': dvParams.apiToken}, // Compulsory to retrieve draft
    });
    const jsonData = await resp.json();
    const dataset: Dataset = jsonData.data;

    // Fill in extra attributes
    const exists = await checkFilesExistenceOnDG(dataset.files.map((f) => f.dataFile.id));
    dataset.files.forEach((f, idx) => {
        f.dataFile.inDG = exists[idx];
        f.key = f.dataFile.id;
    });

    // Sort and reverse to get latest file first
    dataset.files.sort((a, b) => {
        const aDate = new Date(a.dataFile.creationDate);
        const bDate = new Date(b.dataFile.creationDate);
        return aDate > bDate ? 1 : (aDate < bDate ? -1 : 0);
    });
    dataset.files = dataset.files.reverse();
    return dataset;
};

export const addFilesToDvDataset = async (
    dvParams: DataverseParams,
    streams: ReadableStream<Uint8Array>[],
    filenames: string[]): Promise<DatasetFile[]> => {
    const zipStream = createStream();
    zipStreams(streams, filenames, zipStream.writable);
    // TODO: Is there no way to avoid blobbing this? (High memory usage)
    const zippedBlobParts: BlobPart[] = await streamToArr(zipStream.readable);
    const zipFile = new File(zippedBlobParts, 'data.zip');
    const formData = new FormData();
    formData.append('file', zipFile);
    const url = `${dvParams.siteUrl}/api/datasets/${dvParams.datasetId}/add`;
    const start = Date.now();
    const respData = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {'X-Dataverse-key': dvParams.apiToken},
    });
    const jsonData = await respData.json();
    console.log(`Upload completed in ${(Date.now() - start) / 1000}s`);
    const empty: DatasetFile[] = [];
    return empty.concat(jsonData.data.files);
};

export const downloadDvFile = async (dvParams: DataverseParams, fileId: number): Promise<Blob> => {
    const start = Date.now();
    let url = `${dvParams.siteUrl}/api/access/datafile/${fileId}?format=original`;
    if (dvParams.apiToken != null) url += `&key=${dvParams.apiToken}`;
    const resp = await fetch(url);
    const blob = await resp.blob();
    console.log(`File download completed in: ${(Date.now() - start) / 1000}s`);
    return blob;
};
