import {DatasetFile} from '../types/datasetFile';
import {DataverseSourceParams} from '../types/dataverseSourceParams';
import {Dataset} from '../types/dataset';
import JSZip from 'jszip';

export const getLatestDatasetInfo = async (sourceParams: DataverseSourceParams): Promise<Dataset> => {
    const {siteUrl, datasetId} = sourceParams;
    const url = `${siteUrl}/api/datasets/${datasetId}/versions/:latest`;
    const resp = await fetch(url, {
        headers: {'X-Dataverse-key': sourceParams.apiToken}, // Compulsory to retrieve draft
    });
    const jsonData = await resp.json();
    const dataset: Dataset = jsonData.data;
    dataset.files.forEach((f: DatasetFile) => f.key = f.dataFile.id);
    return dataset;
};

export const addFilesToDataset = async (sourceParams: DataverseSourceParams, files: File[]): Promise<DatasetFile[]> => {
    const url = `${sourceParams.siteUrl}/api/datasets/${sourceParams.datasetId}/add`;
    // When added as zip-file, dataverse automatially unpacks the files
    const zip = new JSZip();
    files.forEach((file) => zip.file(file.name, file));
    const zipFile = await zip.generateAsync({type: 'blob'}).then((content) => {
        return new File([content], 'data.zip');
    });
    // TODO: Add formData['jsonData'] i.e. metadata if necessary
    const formData = new FormData();
    formData.append('file', zipFile);
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
