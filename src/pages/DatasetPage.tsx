import React, {useEffect, useState} from 'react';
import {Col, Row, Button, Tag, Tooltip} from 'antd';
import Title from 'antd/es/typography/Title';
import {getDvDatasetInfo} from '../web/dataverse';
import {FilesTable} from '../components/FilesTable';
import {PlusOutlined} from '@ant-design/icons';
import {UploadFileModal} from '../components/UploadFileModal';
import {Skeleton} from 'antd/es';
import {getDvParams, areDvParamsIncomplete} from '../types/dataverseParams';
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


export const DatasetPage: React.FC = () => {
    useEffect(() => {
        if (areDvParamsIncomplete(dvParams)) return;
        fetchAndUpdateDataset();
    }, []);

    const dvParams = getDvParams();
    const [dataset, setDataset] = useState(EmptyDataset);
    const [isUploadFilesModalVisible, setIsUploadFilesModalVisible] = useState(false);

    const fetchAndUpdateDataset = () => {
        getDvDatasetInfo(dvParams)
            .then((dataset) => setDataset(dataset))
            .catch((err) => displayError('Failed to fetch valid dataset information!', err));
    };

    if (areDvParamsIncomplete(dvParams)) {
        return <ErrorPage
            title='Invalid entry method'
            message='Please access DataGovernR via a dataset in your Dataverse Dashboard.' />;
    }

    return (
        <MainLayout name={'DataGovernR'}>
            <Row gutter={[16, 16]}>
                <Col {...pageColumnProps}>
                    {getDatasetTitle(dataset) === '' ?
                        <Skeleton paragraph={{rows: 0}}/> :
                        <div>
                            <Title
                                level={2}
                                style={{display: 'inline', marginRight: '16px'}}>{getDatasetTitle(dataset)}</Title>
                            {
                                dataset.versionState === DRAFT_VERSION_STATE ?
                                    <Tooltip title='There are unpublished changes in this Draft version.'>
                                        <Tag color='orange'>Version: Draft</Tag>
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
                    <FilesTable files={dataset.files} dvParams={dvParams}/>
                </Col>
            </Row>
            <UploadFileModal
                dvParams={dvParams}
                visible={isUploadFilesModalVisible}
                setVisible={setIsUploadFilesModalVisible}
                callbackFn={() => fetchAndUpdateDataset()}
            />
        </MainLayout>
    );
};

