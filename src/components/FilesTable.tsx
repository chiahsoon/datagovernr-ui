import React from 'react';
import {Table} from 'antd';
import {ColumnsType} from 'antd/es/table';
import {DatasetFile} from '../types/datasetFile';

interface FilesTableProps {
    files: DatasetFile[]
}

export const FilesTable = (props: FilesTableProps) => {
    const {files} = props;
    const columns: ColumnsType<DatasetFile> = [
        {
            title: 'File Name',
            dataIndex: 'label',
        },
        {
            title: 'Created At',
            dataIndex: ['dataFile', 'creationDate'],
        },
    ];

    return <Table dataSource={files} columns={columns} />;
};
