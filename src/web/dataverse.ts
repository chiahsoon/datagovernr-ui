import {DatasetFile} from '../types/datasetFile';
import {DataverseSourceParams} from '../types/dataverseSourceParams';
import {Dataset} from '../types/dataset';
import {checkFilesExistence} from './api';
import {zipFilesStream} from '../utils/fileHelper';
import {createStream} from '../utils/streams';

export const getLatestDatasetInfo = async (sourceParams: DataverseSourceParams): Promise<Dataset> => {
    const {siteUrl, datasetId} = sourceParams;
    const url = `${siteUrl}/api/datasets/${datasetId}/versions/:latest`;
    const resp = await fetch(url, {
        headers: {'X-Dataverse-key': sourceParams.apiToken}, // Compulsory to retrieve draft
    });
    const jsonData = await resp.json();
    const dataset: Dataset = jsonData.data;

    // Fill in extra attributes
    const exists = await checkFilesExistence(dataset.files.map((f) => f.dataFile.id));
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

export const addFilesToDataset = async (
    sourceParams: DataverseSourceParams,
    streams: [ReadableStream, string][]): Promise<DatasetFile[]> => {
    // Convert to files
    const files = await Promise.all(streams.map(async ([s, filename]) => {
        const reader = s.getReader();
        const blobParts: BlobPart[] = [];
        for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
            blobParts.push(chunk.value);
        }
        return new File(blobParts, filename);
    }));

    const stream = createStream();
    await zipFilesStream(files, stream.writable);
    const zippedReader = stream.readable.getReader();
    const zippedBlobParts: BlobPart[] = [];
    for (let chunk = await zippedReader.read(); !chunk.done; chunk = await zippedReader.read()) {
        zippedBlobParts.push(chunk.value);
    }
    const zipFile = new File(zippedBlobParts, 'data.zip');

    // TODO: Add formData['jsonData'] i.e. metadata if necessary
    const formData = new FormData();
    formData.append('file', zipFile);
    const url = `${sourceParams.siteUrl}/api/datasets/${sourceParams.datasetId}/add`;
    const respData = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {'X-Dataverse-key': sourceParams.apiToken},
    });
    const jsonData = await respData.json();
    const empty: DatasetFile[] = [];
    return empty.concat(jsonData.data.files);
};

export const downloadFile = async (sourceParams: DataverseSourceParams, fileId: number): Promise<ArrayBuffer> => {
    let url = `${sourceParams.siteUrl}/api/access/datafile/${fileId}?format=original`;
    if (sourceParams.apiToken != null) url += `&key=${sourceParams.apiToken}`;
    const resp = await fetch(url);
    const data = await resp.blob();
    return await data.arrayBuffer();
};
