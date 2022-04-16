import React from 'react';
import {Button, Table, Tooltip} from 'antd';
import {ColumnsType} from 'antd/es/table';
import {DatasetFile} from '../types/datasetFile';
import {Link} from 'react-router-dom';
import {DataverseParams} from '../types/dataverseParams';
import {GlobalLocationState} from '../types/globalLocationState';
import {SafetyCertificateOutlined} from '@ant-design/icons';

interface FilesTableProps {
    dvParams: DataverseParams
    files: DatasetFile[]
}

export const FilesTable:React.FC<FilesTableProps> = (props) => {
    const {files, dvParams} = props;
    const columns: ColumnsType<DatasetFile> = [
        {
            title: 'File Name',
            dataIndex: 'label',
            render: ((_, record) => {
                return (
                    <>
                        {record.label} {
                            record.dataFile.inDG ?
                                (<Tooltip title='Encrypted by DataGovernR'>
                                    <SafetyCertificateOutlined
                                        style={{fontSize: '14px', color: '#02B382'}}/>
                                </Tooltip>) :
                                null
                        }
                    </>
                );
            }),
        },
        {
            title: 'Created At',
            dataIndex: ['dataFile', 'creationDate'],
        },
        {
            title: 'Actions',
            dataIndex: ['dataFile', 'id'],
            render: ((_, record) => {
                const state: GlobalLocationState = {
                    fileId: record.dataFile.id,
                    fileName: record.label,
                    dvParams: dvParams,
                };
                return (
                    <Button type='link' disabled={!record.dataFile.inDG}>
                        <Link to='/file' state={state}>View</Link>
                    </Button>
                );
            }),
        },
    ];

    return <Table dataSource={files} columns={columns} />;
};
