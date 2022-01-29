import {DataverseSourceParams} from './dataverseSourceParams';

// TODO: Really need to store this better
export interface GlobalLocationState {
    fileName?: string,
    fileId?: number,
    sourceParams?: DataverseSourceParams
}
