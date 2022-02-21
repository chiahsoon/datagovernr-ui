import React, {useEffect, useState} from 'react';
import {Button, Col, Descriptions, List, Row, Tooltip, Typography} from 'antd';
import {ErrorPage} from './ErrorPage';
import {EmptyVerificationDetails, isNotVerified, VerificationDetails} from '../types/verificationDetails';
import {getFileVerificationDetails} from '../web/api';
import {displayError} from '../utils/error';
import MainLayout from './MainLayout';
import Title from 'antd/es/typography/Title';
import {DownloadOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import {
    areSourceDatasetParamsIncomplete, getSourceParams,
} from '../types/dataverseSourceParams';
import {FileVerificationListItem} from '../components/FileVerificationListItem';
import {pageColumnProps} from '../styles/common';
import {useLocation} from 'react-router-dom';
import {GlobalLocationState} from '../types/globalLocationState';
import {DownloadFileModal} from '../components/DownloadFileModal';

const {Text, Link} = Typography;

export const FilePage = () => {
    useEffect(() => {
        if (areSourceDatasetParamsIncomplete(sourceParams) || fileId == null) return;
        getFileVerificationDetails(fileId)
            .then((details) => setVerificationDetails(details))
            .catch((err) => displayError('Failed to retrieve verification details', err));
    }, []);

    const {fileId, fileName} = useLocation().state as GlobalLocationState;
    const sourceParams = getSourceParams();
    const [verificationDetails, setVerificationDetails] = useState(EmptyVerificationDetails);
    const [isDownloadFileModalVisible, setIsDownloadFileModalVisible] = useState(false);

    if (areSourceDatasetParamsIncomplete(sourceParams) || fileId == null) {
        return <ErrorPage
            title='Invalid parameters'
            message='Please navigate to this page from a valid file.' />;
    }

    const getSalt = (): string => {
        const file = verificationDetails.files.find((f) => f.id === fileId);
        if (file != null) return file.salt;
        return '';
    };

    const getLink = (details: VerificationDetails): string | undefined => {
        if (isNotVerified(details)) return undefined;
        const link = details.verifier.link;
        const isApiLinkPrefix = 'api://';
        const apiUrl = process.env.REACT_APP_API_URL || '';
        if (link.startsWith(isApiLinkPrefix)) return link.replace(isApiLinkPrefix, apiUrl + '/');
        return link;
    };

    return (
        <MainLayout name={'DataGovernR'}>
            <Row gutter={[16, 16]}>
                <Col {...pageColumnProps}>
                    <Title level={2} style={{display: 'inline', marginRight: '16px'}}>File Details</Title>
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={() => setIsDownloadFileModalVisible(true)}>
                        Download
                    </Button>
                </Col>
                <Col {...pageColumnProps}>
                    <Descriptions bordered size='small'>
                        <Descriptions.Item label="File ID" span={3}>{fileId}</Descriptions.Item>
                        <Descriptions.Item label="Verification Link" span={3}>
                            {
                                getLink(verificationDetails) == null ?
                                    <Text italic>File not verified</Text> :
                                    <Link href={getLink(verificationDetails)} target="_blank">
                                        {getLink(verificationDetails)}
                                    </Link>
                            }
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
                <Col {...pageColumnProps}>
                    <List
                        size="large"
                        header={
                            <Title level={5} style={{display: 'inline'}}>
                                File Hashes Involved in Verification
                                <Tooltip title="Insert aggregation formula here">
                                    <QuestionCircleOutlined style={{marginLeft: '8px'}}/>
                                </Tooltip>
                            </Title>
                        }
                        bordered
                        dataSource={verificationDetails.files}
                        renderItem={(item) => <FileVerificationListItem file={item}/>}
                    />
                </Col>
            </Row>
            <DownloadFileModal
                sourceParams={sourceParams}
                fileId={fileId}
                fileName={fileName || ''}
                salt={getSalt()}
                visible={isDownloadFileModalVisible}
                setVisible={setIsDownloadFileModalVisible}/>
        </MainLayout>
    );
};
