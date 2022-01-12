import React, {useEffect, useState} from 'react';
import {Col, Row, Button, Tag} from 'antd';
import Title from 'antd/es/typography/Title';
import {getTitleFromDatasetMetadata, getDatasetInfo, getDatasetFiles} from '../api/dataverse';
import {DatasetFile, EmptyFiles} from '../types/datasetFile';
import {FilesTable} from '../components/FilesTable';
import {PlusOutlined} from '@ant-design/icons';
import {UploadFileModal} from '../components/UploadFileModal';
import {Skeleton} from 'antd/es';
import {DataverseSourceParams, getSourceParams, isSourceParamsComplete} from '../types/dataverseSourceParams';
import {displayError} from '../utils/error';

export const DatasetsPage = () => {
    useEffect(() => {
        if (isSourceParamsComplete(sourceParams)) {
            window.location.pathname = '/entryError'; // not sure why navigate('/entryError') doesn't work
            return;
        }

        getDatasetInfo(sourceParams)
            .then((datasetInfo) => {
                setDatasetTitle(getTitleFromDatasetMetadata(datasetInfo));
                datasetInfo.files.forEach((f: DatasetFile) => f.key = f.dataFile.id);
                setFiles(datasetInfo.files);
            })
            .catch((err) => displayError('Failed to fetch valid dataset information!', err));
    }, []);

    const sourceParams: DataverseSourceParams = getSourceParams();
    // TODO: Consider adding everything into a Dataset object instead
    const [datasetTitle, setDatasetTitle] = useState('');
    const [files, setFiles] = useState(EmptyFiles);
    const [isUploadFilesModalVisible, setIsUploadFilesModalVisible] = useState(false);

    const handleUploadFilesModalOk = () => {
        getDatasetFiles(sourceParams)
            .then((files: DatasetFile[]) => {
                files.forEach((f: DatasetFile) => f.key = f.dataFile.id);
                setFiles(files);
            })
            .catch((err) => displayError('Failed to refresh dataset\'s files information.', err));
    };

    return (
        <>
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    {datasetTitle === '' ?
                        <Skeleton paragraph={{rows: 0}}/> :
                        <div>
                            <Title style={{display: 'inline', marginRight: '16px'}}>{datasetTitle}</Title>
                            <Tag color="green">
                                {
                                    sourceParams.datasetVersion === ':draft' ?
                                        'Draft' :
                                        `v${sourceParams.datasetVersion}`
                                }
                            </Tag>
                        </div>
                    }
                </Col>
                <Col span={8} offset={16}>
                    <Button
                        type='primary'
                        icon={<PlusOutlined />}
                        style={{float: 'right'}}
                        onClick={() => setIsUploadFilesModalVisible(true)}>
                        Upload Files
                    </Button>
                </Col>
                <Col span={24}>
                    <FilesTable files={files} />
                </Col>
            </Row>
            <UploadFileModal
                sourceParams={sourceParams}
                visible={isUploadFilesModalVisible}
                setVisible={setIsUploadFilesModalVisible}
                callbackFn={handleUploadFilesModalOk}
            />
        </>
    );
};

