import React, {useEffect, useState} from 'react';
import {Button, Col, Descriptions, Dropdown, List, Menu, Row, Tooltip, Typography} from 'antd';
import {ErrorPage} from './ErrorPage';
import {EmptyVerificationDetails, getConcatenatedHashes, isNotSentForVerification,
    VerificationDetails} from '../types/verificationDetails';
import {getDGFileVerificationDetails} from '../web/api';
import {displayError} from '../utils/error';
import MainLayout from './MainLayout';
import Title from 'antd/es/typography/Title';
import {DownloadOutlined, DownOutlined, QuestionCircleOutlined, ShareAltOutlined} from '@ant-design/icons';
import {areDvParamsIncomplete, getDvParams} from '../types/dataverseParams';
import {FileVerificationListItem} from '../components/FileVerificationListItem';
import {pageColumnProps} from '../styles/common';
import {useLocation} from 'react-router-dom';
import {GlobalLocationState} from '../types/globalLocationState';
import {DownloadFileModal} from '../components/DownloadFileModal';
import {AggregationVerifierModal} from '../components/AggregationVerifierModal';
import {RegenKeySharesModal} from '../components/RegenKeySharesModal';
import {LabelWithCopyBtn} from '../components/LabelWithCopyBtn';

const {Text, Link} = Typography;

enum FileActions {
    Download = 'download',
    GenKeyShares = 'genKeyShares',
}

export const FilePage: React.FC = () => {
    useEffect(() => {
        if (fileId == null) return;
        getDGFileVerificationDetails(fileId)
            .then((details) => setVerificationDetails(details))
            .catch((err) => displayError('Failed to retrieve verification details', err));
    }, []);

    const getSalt = (): string => {
        const file = verificationDetails.files.find((f) => f.id === fileId);
        if (file != null) return file.salt;
        return '';
    };

    const getPlaintextHash = (): string => {
        const file = verificationDetails.files.find((f) => f.id === fileId);
        if (file != null) return file.plaintextHash;
        return '';
    };

    const getEncryptedHash = (): string => {
        const file = verificationDetails.files.find((f) => f.id === fileId);
        if (file != null) return file.encryptedHash;
        return '';
    };

    const getLink = (details: VerificationDetails): string | undefined => {
        if (details.verifier == null) return undefined;
        if (details.verifier.link == null || details.verifier.link === '') return undefined;
        const link = details.verifier.link;
        const isApiLinkPrefix = 'api://';
        const apiUrl = process.env.REACT_APP_API_URL || '';
        if (link.startsWith(isApiLinkPrefix)) return link.replace(isApiLinkPrefix, apiUrl + '/');
        return link;
    };

    function handleMenuClick(e: any) {
        const {key} = e;
        if (key === FileActions.Download) {
            setIsDownloadFileModalVisible(true);
        } else if (key === FileActions.GenKeyShares) {
            setIsRegenKeySharesModalVisible(true);
        }
    }

    const {fileId, fileName} = useLocation().state as GlobalLocationState;
    const dvParams = getDvParams();
    const [verificationDetails, setVerificationDetails] = useState(EmptyVerificationDetails);
    const [isDownloadFileModalVisible, setIsDownloadFileModalVisible] = useState(false);
    const [isRegenKeySharesModalVisible, setIsRegenKeySharesModalVisible] = useState(false);
    const [hashVerifierVisible, setHashVerifierVisible] = useState(false);

    if (areDvParamsIncomplete(dvParams) || fileId == null) {
        return <ErrorPage
            title='Invalid parameters'
            message='Please navigate to this page from a valid file.' />;
    }

    return (
        <MainLayout name={'DataGovernR'}>
            <Row gutter={[16, 16]}>
                <Col {...pageColumnProps}>
                    <Title level={3} style={{display: 'inline', marginRight: '16px'}}>{fileName}</Title>
                    <Dropdown
                        trigger={['click']}
                        overlay={
                            <Menu onClick={handleMenuClick}>
                                <Menu.Item key={FileActions.Download} icon={<DownloadOutlined />}>
                                    Download
                                </Menu.Item>
                                <Menu.Item key={FileActions.GenKeyShares} icon={<ShareAltOutlined />}>
                                    Generate Key Shares
                                </Menu.Item>
                            </Menu>
                        }>
                        <Button style={{float: 'right'}}>Options <DownOutlined /></Button>
                    </Dropdown>
                </Col>
                <Col {...pageColumnProps}>
                    <Descriptions bordered size='small' column={1}>
                        <Descriptions.Item label='File ID'>{fileId}</Descriptions.Item>
                        <Descriptions.Item label={<LabelWithCopyBtn label='Plaintext Hash' data={getPlaintextHash()}/>}>
                            {getPlaintextHash()}
                        </Descriptions.Item>
                        <Descriptions.Item label={<LabelWithCopyBtn label='Encrypted Hash' data={getEncryptedHash()}/>}>
                            {getEncryptedHash()}
                        </Descriptions.Item>
                        <Descriptions.Item label='Proof File'>
                            {
                                getLink(verificationDetails) == null ?
                                    <Text italic>File not verified</Text> :
                                    <Link href={getLink(verificationDetails)} target='_blank'>
                                        {getLink(verificationDetails)}
                                    </Link>
                            }
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
                <Col {...pageColumnProps}>
                    <List
                        size='large'
                        header={
                            <Title level={5} style={{display: 'inline'}}>
                                Files involved in upload proof
                                <Tooltip
                                    title={`Hashes of multiple files are aggregated for efficiency in proving uploads.
                                    Click on the \'Verify Aggregation\' button to verify the aggregation process.`}>
                                    <QuestionCircleOutlined style={{marginLeft: '8px'}}/>
                                </Tooltip>
                                <LabelWithCopyBtn data={getConcatenatedHashes(verificationDetails)}/>
                                <Button
                                    style={{float: 'right'}}
                                    disabled={isNotSentForVerification(verificationDetails)}
                                    onClick={() => setHashVerifierVisible(true)}>
                                    Verify Aggregation
                                </Button>
                                <AggregationVerifierModal
                                    visible={hashVerifierVisible}
                                    onCancel={() => setHashVerifierVisible(false)}
                                />
                            </Title>
                        }
                        bordered
                        dataSource={verificationDetails.files}
                        renderItem={(item) => {
                            return <FileVerificationListItem file={item} isCurrentFile={item.id === fileId}/>;
                        }}
                    />
                </Col>
            </Row>
            <DownloadFileModal
                dvParams={dvParams}
                fileId={fileId}
                fileName={fileName || ''}
                salt={getSalt()}
                visible={isDownloadFileModalVisible}
                setVisible={setIsDownloadFileModalVisible}/>
            <RegenKeySharesModal
                fileName={fileName || ''}
                salt={getSalt()}
                visible={isRegenKeySharesModalVisible}
                setVisible={setIsRegenKeySharesModalVisible}/>
        </MainLayout>
    );
};
