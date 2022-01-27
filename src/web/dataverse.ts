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
    const promises: Promise<any>[] = [];
    files.forEach((file) => {
        const formData = new FormData();
        // TODO: Add formData['jsonData'] if necessary (description, directoryLabel, categories, restrict)
        formData.append('file', file); // OR 'file[]'
        const uploadPromise = fetch(url, {
            method: 'POST',
            body: formData,
            headers: {'X-Dataverse-key': sourceParams.apiToken},
        });
        promises.push(uploadPromise);
    });

    return Promise.all(promises)
        .then((filesResponses) => Promise.all(filesResponses.map((resp) => resp.json())))
        .then((jsonDataArr) => {
            const filesArr: DatasetFile[][] = jsonDataArr.map((jsonData) => jsonData.data.files);
            const empty: DatasetFile[] = [];
            return empty.concat(...filesArr);
        });
};

export const getDownloadFileLink = (fileId: number, siteUrl: string, apiToken?: string): string => {
    let url = `${siteUrl}/api/access/datafile/${fileId}`;
    if (apiToken != null) url += `?key=${apiToken}`;
    return url;
};
