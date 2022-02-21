import React from 'react';
import {Button, Table, Tooltip} from 'antd';
import {ColumnsType} from 'antd/es/table';
import {DatasetFile} from '../types/datasetFile';
import {Link} from 'react-router-dom';
import {DataverseSourceParams} from '../types/dataverseSourceParams';
import {GlobalLocationState} from '../types/globalLocationState';
import {IoShieldCheckmarkOutline} from 'react-icons/io5';

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
            render: ((_, record) => {
                return (
                    <>
                        {record.label} {
                            record.dataFile.inDG ?
                                (<Tooltip title="Encrypted by DataGovernR">
                                    <IoShieldCheckmarkOutline
                                        style={{fontSize: '18px', color: '#02B382'}}/>
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
                    sourceParams,
                };
                return (
                    <Button type="link" disabled={!record.dataFile.inDG}>
                        <Link to='/file' state={state}>View</Link>
                    </Button>
                );
            }),
        },
    ];

    return <Table dataSource={files} columns={columns} />;
};
