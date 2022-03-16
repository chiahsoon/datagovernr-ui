import {DataverseParams} from './dataverseParams';

export interface UploadWorkerParams {
    dvParams: DataverseParams
    fileBufs: ArrayBuffer[]
    filenames: string[]
    password: string
    splitKeys: boolean
}
