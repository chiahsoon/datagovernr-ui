import {DatasetFile} from './datasetFile';

export const DRAFT_VERSION_STATE = 'DRAFT';
export const DRAFT_VERSION_TAG = ':draft';

export interface Dataset {
    datasetId: string
    datasetPersistentId: string
    metadataBlocks: DatasetMetadataBlocks
    versionState: string
    versionNumber?: number
    versionMinorNumber?: number
    files: DatasetFile[]
}

export interface DatasetMetadataBlocks {
    citation: DatasetCitation
}

export interface DatasetCitation {
    fields: MetadataBlockField[]
}

export interface MetadataBlockField {
    typeName: string;
    typeClass: string;
    multiple: boolean;
    value: string | MetadataBlockField[];
}

export const EmptyDataset: Dataset = {
    datasetId: '',
    datasetPersistentId: '',
    metadataBlocks: {
        citation: {
            fields: [],
        },
    },
    versionState: '',
    files: [],
};

export const getDatasetTitle = (dataset: Dataset): string => {
    const metadataBlocks: MetadataBlockField[] = dataset.metadataBlocks.citation.fields;
    const blocks = metadataBlocks.filter((field) => field.typeName === 'title');
    if (blocks.length === 0) return '';
    const titleBlock = blocks[0];
    return titleBlock.value.toString();
};

export const getDatasetVersion = (dataset: Dataset): number => {
    if (dataset.versionNumber == null) return 1.0;
    if (dataset.versionMinorNumber == null) return 1.0;
    return ((dataset.versionNumber) + (dataset.versionMinorNumber / 10.0));
};
