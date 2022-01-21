import React from 'react';
import {Card, Col, Row} from 'antd';
import Title from 'antd/es/typography/Title';
import {ExclamationCircleOutlined} from '@ant-design/icons';

interface ErrorPageProps {
    title: string
    message: string
}

export const ErrorPage = (props: ErrorPageProps) => {
    const {title, message} = props;
    return (
        <>
            <Row align={'middle'} style={{textAlign: 'center', minHeight: '80vh'}}>
                <Col span={8} offset={8}>
                    <Card title={<Title level={3}><ExclamationCircleOutlined />{title}</Title>}>
                        <Title level={5}>{message}</Title>
                    </Card>
                </Col>
            </Row>
        </>
    );
};
