import React, {useEffect, useState} from 'react';
import {Col, Row, Button, Tag, Tooltip} from 'antd';
import Title from 'antd/es/typography/Title';
import {getLatestDatasetInfo} from '../api/dataverse';
import {FilesTable} from '../components/FilesTable';
import {PlusOutlined} from '@ant-design/icons';
import {UploadFileModal} from '../components/UploadFileModal';
import {Skeleton} from 'antd/es';
import {
    DataverseSourceParams,
    getSourceParams,
    isSourceParamsIncomplete,
} from '../types/dataverseSourceParams';
import {displayError} from '../utils/error';
import {
    DRAFT_VERSION_STATE,
    EmptyDataset,
    getDatasetTitle,
    getDatasetVersion,
} from '../types/dataset';

const colProps = {
    span: 16,
    offset: 4,
};

export const DatasetsPage = () => {
    useEffect(() => {
        if (isSourceParamsIncomplete(sourceParams)) {
            window.location.pathname = '/entryError'; // not sure why navigate('/entryError') doesn't work
            return;
        }

        fetchAndUpdateDataset();
    }, []);

    const sourceParams: DataverseSourceParams = getSourceParams();
    const [dataset, setDataset] = useState(EmptyDataset);
    const [isUploadFilesModalVisible, setIsUploadFilesModalVisible] = useState(false);

    const fetchAndUpdateDataset = () => {
        getLatestDatasetInfo(sourceParams)
            .then((latestDatasetInfo) => setDataset(latestDatasetInfo))
            .catch((err) => displayError('Failed to fetch valid dataset information!', err));
    };

    return (
        <>
            <Row gutter={[16, 16]}>
                <Col {...colProps}>
                    {getDatasetTitle(dataset) === '' ?
                        <Skeleton paragraph={{rows: 0}}/> :
                        <div>
                            <Title style={{display: 'inline', marginRight: '16px'}}>{getDatasetTitle(dataset)}</Title>
                            {
                                dataset.versionState === DRAFT_VERSION_STATE ?
                                    <Tooltip title='There are unpublished changes in this Draft version.'>
                                        <Tag color="orange">Version: Draft</Tag>
                                    </Tooltip> :
                                    <Tag color='green'>Version: {getDatasetVersion(dataset).toFixed(2)}</Tag>
                            }
                        </div>
                    }
                </Col>
                <Col {...colProps}>
                    <Button
                        type='primary'
                        icon={<PlusOutlined />}
                        style={{float: 'right'}}
                        onClick={() => setIsUploadFilesModalVisible(true)}>
                        Upload Files
                    </Button>
                </Col>
                <Col {...colProps}>
                    <FilesTable files={dataset.files} />
                </Col>
            </Row>
            <UploadFileModal
                sourceParams={sourceParams}
                visible={isUploadFilesModalVisible}
                setVisible={setIsUploadFilesModalVisible}
                callbackFn={() => fetchAndUpdateDataset()}
            />
        </>
    );
};

