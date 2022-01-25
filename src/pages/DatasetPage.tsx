import React, {useEffect, useState} from 'react';
import {Col, Row, Button, Tag, Tooltip} from 'antd';
import Title from 'antd/es/typography/Title';
import {getLatestDatasetInfo} from '../web/dataverse';
import {FilesTable} from '../components/FilesTable';
import {PlusOutlined} from '@ant-design/icons';
import {UploadFileModal} from '../components/UploadFileModal';
import {Skeleton} from 'antd/es';
import {
    DataverseSourceParams,
    getSourceParams,
    areSourceDatasetParamsIncomplete,
} from '../types/dataverseSourceParams';
import {displayError} from '../utils/error';
import {
    DRAFT_VERSION_STATE,
    EmptyDataset,
    getDatasetTitle,
    getDatasetVersion,
} from '../types/dataset';
import {ErrorPage} from './ErrorPage';
import MainLayout from './MainLayout';
import {pageColumnProps} from '../styles/common';


export const DatasetPage = () => {
    useEffect(() => {
        if (areSourceDatasetParamsIncomplete(sourceParams)) return;
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

    if (areSourceDatasetParamsIncomplete(sourceParams)) {
        return <ErrorPage
            title='Invalid entry method'
            message='Please access DataGovernR via a dataset in your Dataverse Dashboard.' />;
    }

    return (
        <MainLayout name={'DataGovernR (Dataset)'}>
            <Row gutter={[16, 16]}>
                <Col {...pageColumnProps}>
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
                <Col {...pageColumnProps}>
                    <Button
                        type='primary'
                        icon={<PlusOutlined />}
                        style={{float: 'right'}}
                        onClick={() => setIsUploadFilesModalVisible(true)}>
                        Upload Files
                    </Button>
                </Col>
                <Col {...pageColumnProps}>
                    <FilesTable files={dataset.files} sourceParams={sourceParams}/>
                </Col>
            </Row>
            <UploadFileModal
                sourceParams={sourceParams}
                visible={isUploadFilesModalVisible}
                setVisible={setIsUploadFilesModalVisible}
                callbackFn={() => fetchAndUpdateDataset()}
            />
        </MainLayout>
    );
};

