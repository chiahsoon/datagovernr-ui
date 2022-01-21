import React, {useEffect, useState} from 'react';
import {Button, Col, Descriptions, List, Row} from 'antd';
import {ErrorPage} from './ErrorPage';
import {DGFile, EmptyVerificationDetails} from '../types/verificationDetails';
import {getFileVerificationDetails} from '../web/api';
import {displayError} from '../utils/error';
import MainLayout from './MainLayout';
import Title from 'antd/es/typography/Title';
import {DownloadOutlined} from '@ant-design/icons';
import {getDownloadFileLink} from '../web/dataverse';

const colProps = {
    span: 16,
    offset: 4,
};

const FileListItem = (props: { file: DGFile }) => {
    // TODO: Consider adding names to data
    const {id, encryptedHash} = props.file;
    return (
        <List.Item>
            <List.Item.Meta
                title={`File ID: ${id}`} // <a href="https://ant.design">{item.id}</a>
                description={`File Hash: ${encryptedHash}`}
            />
        </List.Item>
    );
};

export const FilePage = () => {
    useEffect(() => {
        if (fileId == null) return;
        getFileVerificationDetails(fileId)
            .then((details) => setVerificationDetails(details))
            .catch((err) => displayError('Failed to retrieve verification details', err));
    }, []);

    const [verificationDetails, setVerificationDetails] = useState(EmptyVerificationDetails);

    const fileId = new URLSearchParams(window.location.search).get('fileId');
    if (fileId == null) {
        return <ErrorPage
            title='File Not Specified'
            message='Please navigate to this page from a valid file'/>;
    }

    return (
        <MainLayout name={'DataGovernR (File)'}>
            <Row gutter={[16, 16]}>
                <Col {...colProps}>
                    <Title level={2} style={{display: 'inline', marginRight: '16px'}}>File Details</Title>
                    {/* TODO: Proper integration with Dataverse */}
                    <Button icon={<DownloadOutlined />} href={getDownloadFileLink(fileId, '', '')}>
                        Download
                    </Button>
                </Col>
                <Col {...colProps}>
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
                <Col {...colProps}>
                    <List
                        size="large"
                        header={<Title level={5}>File Hashes Involved in Verification</Title>}
                        bordered
                        dataSource={verificationDetails.files}
                        renderItem={(item) => <FileListItem file={item}/>}
                    />
                </Col>
            </Row>
        </MainLayout>
    );
};
