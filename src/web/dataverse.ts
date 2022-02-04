import {DatasetFile} from '../types/datasetFile';
import {DataverseSourceParams} from '../types/dataverseSourceParams';
import {Dataset} from '../types/dataset';

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
    // TODO: Re-confirm if Dataverse API only supports adding a single file
    // Seems to only allow adding a single file since additional jsonData is only for a single file
    const url = `${sourceParams.siteUrl}/api/datasets/${sourceParams.datasetId}/add`;
    let filesArr: DatasetFile[] = [];
    for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        // TODO: Add formData['jsonData'] if necessary (description, directoryLabel, categories, restrict)
        formData.append('file', files[i]); // OR 'file[]'
        const respData = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {'X-Dataverse-key': sourceParams.apiToken},
        });
        const jsonData = await respData.json();
        filesArr = filesArr.concat(jsonData.data.files);
    }
    return filesArr;
};

export const downloadFile = async (sourceParams: DataverseSourceParams, fileId: number): Promise<ArrayBuffer> => {
    let url = `${sourceParams.siteUrl}/api/access/datafile/${fileId}?format=original`;
    if (sourceParams.apiToken != null) url += `&key=${sourceParams.apiToken}`;
    const resp = await fetch(url);
    const data = await resp.blob();
    return await data.arrayBuffer();
};
