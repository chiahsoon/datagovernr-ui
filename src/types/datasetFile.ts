export const EmptyFiles: DatasetFile[] = [];

export interface DatasetFile {
    label: string
    restricted: boolean
    version: number
    datasetVersionId: number
    dataFile: DataFile
    key: number // Set as dataFile.id to avoid table item warning
}

export interface DataFile {
    id: number
    persistentId: string
    pidUrl: string
    filename: string
    contentType: string
    filesize: number
    storageIdentifier: string
    rootDataFileId: number
    md5: string
    checksum: DataFileChecksum
    creationDate: string

    // DG fields
    inDG: boolean
}

export interface DataFileChecksum {
    type: string
    value: string
}

// // SAMPLE
// {
//     "label":"test.txt",
//     "restricted":false,
//     "version":1,
//     "datasetVersionId":1,
//     "dataFile":{
//         "id":4,
//         "persistentId":"",
//         "pidURL":"",
//         "filename":"test.txt",
//         "contentType":"text/plain",
//         "filesize":0,
//         "storageIdentifier":"file://17e28dfa49d-829934de5527",
//         "rootDataFileId":-1,
//         "md5":"d41d8cd98f00b204e9800998ecf8427e",
//         "checksum":{
//             "type":"MD5",
//                 "value":"d41d8cd98f00b204e9800998ecf8427e"
//         },
//         "creationDate":"2022-01-05"
//     }
// }
