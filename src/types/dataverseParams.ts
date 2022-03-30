import {useLocation} from 'react-router-dom';
import {GlobalLocationState} from './globalLocationState';

export interface DataverseParams {
    siteUrl: string,
    apiToken: string,
    datasetVersion: string, // Not in use, just for storage
    datasetId: string,
    datasetPid: string,
}

export const getDvParams = (): DataverseParams => {
    const fromLocation = useLocation().state as GlobalLocationState;
    if (fromLocation != null &&
        fromLocation.dvParams != null &&
        !areDvParamsIncomplete(fromLocation.dvParams)) {
        return fromLocation.dvParams;
    }

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const params: DataverseParams = {
        siteUrl: urlParams.get('siteUrl') || '',
        apiToken: urlParams.get('apiToken') || '',
        datasetVersion: urlParams.get('datasetVersion') || '',
        datasetId: urlParams.get('datasetId') || '',
        datasetPid: urlParams.get('datasetPid') || '',
    };

    // For localhost, dataverse returns e.g. http://<OS host name>:8080 instead of http://localhost:8080
    // Using http as indicator to change to localhost since it's unsafe
    if (params.siteUrl.startsWith('http://')) {
        const url = new URL(params.siteUrl);
        url.host = 'localhost';
        const urlString = url.toString();
        params.siteUrl = urlString.endsWith('/') ? urlString.substring(0, urlString.length - 1) : urlString;
    }

    return params;
};

export const areDvCoreParamsIncomplete = (dvParams: DataverseParams): boolean => {
    return !dvParams.siteUrl || !dvParams.apiToken;
};

export const areDvParamsIncomplete = (dvParams: DataverseParams): boolean => {
    return areDvCoreParamsIncomplete(dvParams) || !dvParams.datasetVersion ||
        !dvParams.datasetId || !dvParams.datasetPid;
};
