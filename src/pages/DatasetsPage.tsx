import React, {useEffect, useState} from 'react';
import {Col, Row, message} from 'antd';
import Title from 'antd/es/typography/Title';
import {getDatasetTitle, getDatasetInfo} from '../api/dataverse';
import {EmptyFiles} from '../types/datasetFile';
import {FilesTable} from '../components/FilesTable';

export const DatasetsPage = () => {
    useEffect(() => {
        if (!sourceParams.siteUrl || !sourceParams.datasetId || !sourceParams.datasetPid ||
            !sourceParams.datasetVersion || sourceParams.apiToken) {
            window.location.pathname = '/entryError'; // not sure why navigate('/entryError') doesn't work
            return;
        }

        getDatasetInfo(sourceParams.siteUrl, sourceParams.datasetId, sourceParams.datasetVersion, sourceParams.apiToken)
            .then((datasetInfo) => {
                setDatasetTile(getDatasetTitle(datasetInfo));
                setFiles(datasetInfo.files);
            })
            .catch((err) => {
                message.error('Failed to fetch valid dataset information.').then();
                console.log('failed to fetch valid dataset information: ', err);
            });
    }, []);

    const sourceParams = getSourceParams();
    const [datasetTitle, setDatasetTile] = useState('Title');
    const [files, setFiles] = useState(EmptyFiles);

    return (
        <>
            <Row>
                <Col span={24}>
                    <Title>{datasetTitle}</Title>
                </Col>
            </Row>
            <Row>
                <Col span={24}>
                    <FilesTable files={files} />
                </Col>
            </Row>
        </>
    );
};

interface DataverseSourceParams {
    siteUrl: string,
    apiToken: string,
    datasetId: string,
    datasetVersion: string,
    datasetPid: string,
}

const getSourceParams = (): DataverseSourceParams => {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const params: DataverseSourceParams = {
        siteUrl: urlParams.get('siteUrl') || '',
        apiToken: urlParams.get('apiToken') || '',
        datasetId: urlParams.get('datasetId') || '',
        datasetVersion: urlParams.get('datasetVersion') || '',
        datasetPid: urlParams.get('datasetPid') || '',
    };

    // For localhost, dataverse returns e.g. http://<OS host name>:8080 instead of http://localhost:8080
    // Using http as indicator to change to localhost since it's unsafe
    if (params.siteUrl.startsWith('http')) {
        const url = new URL(params.siteUrl);
        url.host = 'localhost';
        const urlString = url.toString();
        params.siteUrl = urlString.endsWith('/') ? urlString.substring(0, urlString.length - 1) : urlString;
    }

    return params;
};
