import {DatasetFile} from '../types/datasetFile';
import {DataverseParams} from '../types/dataverseParams';
import {Dataset} from '../types/dataset';
import {checkFilesExistence} from './api';
import {streamToArr} from '../utils/stream';
import {zipFilesStream} from '../utils/zip';

export const getLatestDatasetInfo = async (dvParams: DataverseParams): Promise<Dataset> => {
    const {siteUrl, datasetId} = dvParams;
    const url = `${siteUrl}/api/datasets/${datasetId}/versions/:latest`;
    const resp = await fetch(url, {
        headers: {'X-Dataverse-key': dvParams.apiToken}, // Compulsory to retrieve draft
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
    dvParams: DataverseParams,
    files: File[]): Promise<DatasetFile[]> => {
    const zipStream = await zipFilesStream(files);
    const zippedBlobParts: BlobPart[] = await streamToArr(zipStream);
    const zipFile = new File(zippedBlobParts, 'data.zip');

    // TODO: Add formData['jsonData'] i.e. metadata if necessary
    const formData = new FormData();
    formData.append('file', zipFile);
    const url = `${dvParams.siteUrl}/api/datasets/${dvParams.datasetId}/add`;
    const respData = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: {'X-Dataverse-key': dvParams.apiToken},
    });
    const jsonData = await respData.json();
    const empty: DatasetFile[] = [];
    return empty.concat(jsonData.data.files);
};

export const downloadFile = async (dvParams: DataverseParams, fileId: number): Promise<ArrayBuffer> => {
    let url = `${dvParams.siteUrl}/api/access/datafile/${fileId}?format=original`;
    if (dvParams.apiToken != null) url += `&key=${dvParams.apiToken}`;
    const resp = await fetch(url);
    const data = await resp.blob();
    return await data.arrayBuffer();
};
