import React, {useEffect, useState} from 'react';
import {Button, Col, Descriptions, List, message, Row, Tooltip, Typography} from 'antd';
import {ErrorPage} from './ErrorPage';
import {EmptyVerificationDetails, getConcatenatedHashes, isNotSentForVerification,
    isNotVerified, VerificationDetails} from '../types/verificationDetails';
import {getFileVerificationDetails} from '../web/api';
import {displayError} from '../utils/error';
import MainLayout from './MainLayout';
import Title from 'antd/es/typography/Title';
import {CopyOutlined, DownloadOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import {
    areSourceDatasetParamsIncomplete, getSourceParams,
} from '../types/dataverseSourceParams';
import {FileVerificationListItem} from '../components/FileVerificationListItem';
import {pageColumnProps} from '../styles/common';
import {useLocation} from 'react-router-dom';
import {GlobalLocationState} from '../types/globalLocationState';
import {DownloadFileModal} from '../components/DownloadFileModal';
import {HashVerifierForm} from '../components/HashVerifierForm';

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
    const [hashVerifierVisible, setHashVerifierVisible] = useState(false);

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
        console.log('HERE: ', details);
        const link = details.verifier.link;
        const isApiLinkPrefix = 'api://';
        const apiUrl = process.env.REACT_APP_API_URL || '';
        if (link.startsWith(isApiLinkPrefix)) return link.replace(isApiLinkPrefix, apiUrl + '/');
        return link;
    };

    const parseLinkForHashVerifier = async (): Promise<string> => {
        // TODO: Parse PDF and get verification link
        return '';
    };

    return (
        <MainLayout name={'DataGovernR'}>
            <Row gutter={[16, 16]}>
                <Col {...pageColumnProps}>
                    <Title level={2} style={{display: 'inline', marginRight: '16px'}}>File Details</Title>
                    <Button
                        type='primary'
                        icon={<DownloadOutlined />}
                        onClick={() => setIsDownloadFileModalVisible(true)}>
                        Download
                    </Button>
                </Col>
                <Col {...pageColumnProps}>
                    <Descriptions bordered size='small' column={1}>
                        <Descriptions.Item label="File ID">{fileId}</Descriptions.Item>
                        <Descriptions.Item label="Proof File">
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
                                <Tooltip
                                    title={'Click on the \'Verify Hash\' button to see how the hashes are aggregated.'}>
                                    <QuestionCircleOutlined style={{marginLeft: '8px'}}/>
                                </Tooltip>
                                <Button
                                    icon={<CopyOutlined style={{cursor: 'pointer'}}/>}
                                    onClick={() => {
                                        navigator.clipboard.writeText(getConcatenatedHashes(verificationDetails));
                                        message.success('Copied file hashes to clipboard!');
                                    }}
                                    style={{border: '0px'}}/>
                                <Button
                                    style={{float: 'right'}}
                                    disabled={isNotSentForVerification(verificationDetails)}
                                    onClick={() => {
                                        parseLinkForHashVerifier().then(() => setHashVerifierVisible(true));
                                    }}>
                                    Verify Hashes
                                </Button>
                                <HashVerifierForm
                                    visible={hashVerifierVisible}
                                    onCancel={() => setHashVerifierVisible(false)}
                                />
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
