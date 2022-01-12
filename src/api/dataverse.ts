import {MetadataBlockField} from 'js-dataverse/dist/@types/metadataBlockField';

export const getDatasetInfo = async (serverUrl: string, datasetId: string,
    datasetVersion: string, apiToken?: string) => {
    const resp = await fetch(`${serverUrl}/api/datasets/${datasetId}/versions/${datasetVersion}`, {
        headers: apiToken !== undefined ? {'X-Dataverse-key': apiToken} : {}, // Not really necessary
    });
    const jsonData = await resp.json();
    return jsonData.data;
};

export const getDatasetTitle = (datasetInfo: any): string => {
    const metadataBlocks: MetadataBlockField[] = datasetInfo.metadataBlocks.citation.fields;
    const titleBlock = metadataBlocks.filter((field) => field.typeName === 'title')[0];
    return titleBlock.value.toString();
};

