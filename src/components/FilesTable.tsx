import React from 'react';
import {Button, Table} from 'antd';
import {ColumnsType} from 'antd/es/table';
import {DatasetFile} from '../types/datasetFile';
import {Link} from 'react-router-dom';
import {DataverseSourceParams} from '../types/dataverseSourceParams';
import {ExportOutlined} from '@ant-design/icons';
import {GlobalLocationState} from '../types/globalLocationState';

interface FilesTableProps {
    sourceParams: DataverseSourceParams
    files: DatasetFile[]
}

export const FilesTable = (props: FilesTableProps) => {
    const {files, sourceParams} = props;
    const columns: ColumnsType<DatasetFile> = [
        {
            title: 'File Name',
            dataIndex: 'label',
        },
        {
            title: 'Created At',
            dataIndex: ['dataFile', 'creationDate'],
        },
        {
            title: 'Access Link',
            dataIndex: ['dataFile', 'id'],
            render: ((_, record) => {
                const state: GlobalLocationState = {
                    fileId: record.dataFile.id,
                    fileName: record.label,
                    sourceParams,
                };
                return (
                    <Button type="link">
                        <Link to='/file' state={state}><ExportOutlined /></Link>
                    </Button>
                );
            }),
        },
    ];

    return <Table dataSource={files} columns={columns} />;
};
