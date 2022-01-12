import {MetadataBlockField} from 'js-dataverse/dist/@types/metadataBlockField';
import {DatasetFile} from '../types/datasetFile';
import {DataverseSourceParams} from '../types/dataverseSourceParams';

export const getDatasetInfo = async (sourceParams: DataverseSourceParams) => {
    const {siteUrl, datasetId, datasetVersion} = sourceParams;
    const url = `${siteUrl}/api/datasets/${datasetId}/versions/${datasetVersion}`;
    const resp = await fetch(url, {
        headers: {'X-Dataverse-key': sourceParams.apiToken}, // Not really necessary
    });
    const jsonData = await resp.json();
    return jsonData.data;
};

export const getTitleFromDatasetMetadata = (datasetInfo: any): string => {
    const metadataBlocks: MetadataBlockField[] = datasetInfo.metadataBlocks.citation.fields;
    const titleBlock = metadataBlocks.filter((field) => field.typeName === 'title')[0];
    return titleBlock.value.toString();
};

export const getDatasetFiles = async (sourceParams: DataverseSourceParams): Promise<DatasetFile[]> => {
    const {siteUrl, datasetId, datasetVersion} = sourceParams;
    const url = `${siteUrl}/api/datasets/${datasetId}/versions/${datasetVersion}/files`;
    const resp = await fetch(url, {
        headers: {'X-Dataverse-key': sourceParams.apiToken}, // Not really necessary
    });
    const jsonData = await resp.json();
    return jsonData.data;
};

export const addFilesToDataset = async (sourceParams: DataverseSourceParams, files: File[]): Promise<any[]> => {
    // TODO: Re-confirm if Dataverse API only supports adding a single file
    // Seems to only allow adding a single file since additional jsonData is only for a single file
    const url = `${sourceParams.siteUrl}/api/datasets/${sourceParams.datasetId}/add`;
    const promises: Promise<any>[] = [];
    files.forEach((file) => {
        const formData = new FormData();
        // TODO: Confirm how to handle file metadata
        // const additionalData = {
        //     description: "My description.",
        //     directoryLabel: `${file.name}`,
        //     categories: ["Data"],
        //     restrict: "false"
        // }
        // formData.append('jsonData', JSON.stringify(additionalData));
        formData.append('file', file); // OR 'file[]'
        const uploadPromise = fetch(url, {
            method: 'POST',
            body: formData,
            headers: {'X-Dataverse-key': sourceParams.apiToken},
        });
        promises.push(uploadPromise);
    });
    return Promise.all(promises);
};
