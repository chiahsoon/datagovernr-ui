export interface DataverseSourceParams {
    siteUrl: string,
    apiToken: string,
    datasetVersion: string, // Not in use, just for storage
    datasetId: string,
    datasetPid: string,
}

export const getSourceParams = (): DataverseSourceParams => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const params: DataverseSourceParams = {
        siteUrl: urlParams.get('siteUrl') || '',
        apiToken: urlParams.get('apiToken') || '',
        datasetVersion: urlParams.get('datasetVersion') || '',
        datasetId: urlParams.get('datasetId') || '',
        datasetPid: urlParams.get('datasetPid') || '',
    };

    // For localhost, dataverse returns e.g. http://<OS host name>:8080 instead of http://localhost:8080
    // Using http as indicator to change to localhost since it's unsafe
    if (params.siteUrl.startsWith('http')) {
        const url = new URL(params.siteUrl);
        url.host = 'localhost';
        const urlString = url.toString();
        params.siteUrl = urlString.endsWith('/') ? urlString.substring(0, urlString.length - 1) : urlString;
    }

    return params;
};

export const areSourceCoreParamsIncomplete = (sourceParams: DataverseSourceParams): boolean => {
    return !sourceParams.siteUrl || !sourceParams.apiToken;
};

export const areSourceDatasetParamsIncomplete = (sourceParams: DataverseSourceParams): boolean => {
    return areSourceCoreParamsIncomplete(sourceParams) || !sourceParams.datasetVersion ||
        !sourceParams.datasetId || !sourceParams.datasetPid;
};
