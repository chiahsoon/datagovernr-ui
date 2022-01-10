import React from 'react';
import {Card, Col, Row} from 'antd';
import Title from 'antd/es/typography/Title';
import {ExclamationCircleOutlined} from '@ant-design/icons';

export const EntryErrorPage = () => {
    return (
        <>
            <Row align={'middle'} style={{textAlign: 'center', minHeight: '100vh'}}>
                <Col span={8} offset={8}>
                    <Card title={<Title level={3}><ExclamationCircleOutlined /> Invalid entry method </Title>}>
                        <Title level={5}>Please access DataGovernR via your Dataverse Dashboard.</Title>
                    </Card>
                </Col>
            </Row>
        </>
    );
};
