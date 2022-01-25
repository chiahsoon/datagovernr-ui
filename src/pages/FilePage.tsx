import React, {useEffect, useState} from 'react';
import {Button, Col, Descriptions, List, Row} from 'antd';
import {ErrorPage} from './ErrorPage';
import {EmptyVerificationDetails} from '../types/verificationDetails';
import {getFileVerificationDetails} from '../web/api';
import {displayError} from '../utils/error';
import MainLayout from './MainLayout';
import Title from 'antd/es/typography/Title';
import {DownloadOutlined} from '@ant-design/icons';
import {getDownloadFileLink} from '../web/dataverse';
import {
    areSourceDatasetParamsIncomplete,
    DataverseSourceParams,
} from '../types/dataverseSourceParams';
import {FileVerificationListItem} from '../components/FileVerificationListItem';
import {pageColumnProps} from '../styles/common';
import {useLocation} from 'react-router-dom';
interface FilePageProps {
    fileId: string
    sourceParams: DataverseSourceParams
}


// TODO: To navigate to this page, it is necessary to pass in FilePageProps for location.state
// At least until this is better designed
export const FilePage = () => {
    useEffect(() => {
        if (areSourceDatasetParamsIncomplete(sourceParams) || fileId === '') return;
        getFileVerificationDetails(fileId)
            .then((details) => setVerificationDetails(details))
            .catch((err) => displayError('Failed to retrieve verification details', err));
    }, []);

    const {fileId, sourceParams} = useLocation().state as FilePageProps;
    const [verificationDetails, setVerificationDetails] = useState(EmptyVerificationDetails);

    if (areSourceDatasetParamsIncomplete(sourceParams) || fileId === '') {
        return <ErrorPage
            title='Invalid parameters'
            message='Please navigate to this page from a valid file.' />;
    }

    return (
        <MainLayout name={'DataGovernR (File)'}>
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
                            <a href={verificationDetails.verifier.link}>{verificationDetails.verifier.link}</a>
                        </Descriptions.Item>
                        <Descriptions.Item label="Verified At" span={3}>
                            {verificationDetails.verifier.createdDate.toDateString()}
                        </Descriptions.Item>
                    </Descriptions>
                </Col>
                <Col {...pageColumnProps}>
                    <List
                        size="large"
                        header={<Title level={5}>File Hashes Involved in Verification</Title>}
                        bordered
                        dataSource={verificationDetails.files}
                        renderItem={(item) => <FileVerificationListItem file={item}/>}
                    />
                </Col>
            </Row>
        </MainLayout>
    );
};
