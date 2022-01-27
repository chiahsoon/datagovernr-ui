import React, {useEffect, useState} from 'react';
import {Button, Col, Descriptions, List, Row, Tooltip, Typography} from 'antd';
import {ErrorPage} from './ErrorPage';
import {EmptyVerificationDetails, isNotVerified} from '../types/verificationDetails';
import {getFileVerificationDetails} from '../web/api';
import {displayError} from '../utils/error';
import MainLayout from './MainLayout';
import Title from 'antd/es/typography/Title';
import {DownloadOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import {getDownloadFileLink} from '../web/dataverse';
import {
    areSourceDatasetParamsIncomplete, getSourceParams,
} from '../types/dataverseSourceParams';
import {FileVerificationListItem} from '../components/FileVerificationListItem';
import {pageColumnProps} from '../styles/common';
import {useLocation} from 'react-router-dom';
import {GlobalLocationState} from '../types/globalLocationState';

const {Text, Link} = Typography;

export const FilePage = () => {
    useEffect(() => {
        if (areSourceDatasetParamsIncomplete(sourceParams) || fileId == null) return;
        getFileVerificationDetails(fileId)
            .then((details) => setVerificationDetails(details))
            .catch((err) => displayError('Failed to retrieve verification details', err));
    }, []);

    const fileId = (useLocation().state as GlobalLocationState).fileId;
    const sourceParams = getSourceParams();
    const [verificationDetails, setVerificationDetails] = useState(EmptyVerificationDetails);

    if (areSourceDatasetParamsIncomplete(sourceParams) || fileId == null) {
        return <ErrorPage
            title='Invalid parameters'
            message='Please navigate to this page from a valid file.' />;
    }

    return (
        <MainLayout name={'DataGovernR'}>
            <Row gutter={[16, 16]}>
                <Col {...pageColumnProps}>
                    <Title level={2} style={{display: 'inline', marginRight: '16px'}}>File Details</Title>
                    <Button
                        icon={<DownloadOutlined />}
                        href={getDownloadFileLink(fileId, sourceParams.siteUrl, sourceParams.apiToken)}>
                        Download
                    </Button>
                </Col>
                <Col {...pageColumnProps}>
                    <Descriptions bordered size='small'>
                        <Descriptions.Item label="File ID" span={3}>{fileId}</Descriptions.Item>
                        <Descriptions.Item label="Verification Link" span={3}>
                            {
                                isNotVerified(verificationDetails) ?
                                    <Text italic>File not verified</Text> :
                                    <Link href={verificationDetails.verifier.link} target="_blank">
                                        {verificationDetails.verifier.link}
                                    </Link>
                            }
                        </Descriptions.Item>
                        <Descriptions.Item label="Verified At" span={3}>
                            {
                                isNotVerified(verificationDetails) ?
                                    '-' :
                                    verificationDetails.verifier.createdDate.toDateString()
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
        </MainLayout>
    );
};
