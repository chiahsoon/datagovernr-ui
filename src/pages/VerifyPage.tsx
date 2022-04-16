import React, {useState} from 'react';
import {Row, Col, Card, Typography, Form, Descriptions, Button} from 'antd';
import MainLayout from './MainLayout';
import {UploadFormItem} from '../components/UploadFormItem';
import {UploadFile} from 'antd/es/upload/interface';
import {hashFilesWithWorkers} from '../utils/worker';
import {AggregationVerifier} from '../components/AggregationVerifier';
import {LabelWithCopyBtn} from '../components/LabelWithCopyBtn';

const {Title} = Typography;

interface CalculateFileHashFormValues {
    fileList: UploadFile[],
}

export const VerifyPage: React.FC = () => {
    const [uploadErrorMsg, setUploadErrorMsg] = useState('');
    const [isCalculatingFileHash, setIsCalculatingFileHash] = useState(false);
    const [fileHash, setFileHash] = useState('-');

    const [fileHashForm] = Form.useForm();

    const calculateFileHash = async (values: CalculateFileHashFormValues) => {
        setIsCalculatingFileHash(true);
        const file = values.fileList[0];
        if (file.originFileObj == null) throw new Error('Invalid file provided.');
        const hashes = await hashFilesWithWorkers([file.originFileObj]);
        setFileHash(hashes[0]);
        setIsCalculatingFileHash(false);
    };

    const onCalculateFileHashFailed = () => setIsCalculatingFileHash(false);

    return (
        <MainLayout name={'DataGovernR'}>
            <Row gutter={[16, 16]}>
                <Col span={8} offset={4}>
                    <Card title={<Title level={3}>File Hash</Title>}>
                        <Form
                            form={fileHashForm}
                            onFinish={calculateFileHash}
                            onFinishFailed={onCalculateFileHashFailed}
                            name='calculate_file_hash_form'>
                            <Row gutter={[16, 16]}>
                                <Col span={24}>
                                    <UploadFormItem
                                        multiple={false}
                                        formKey='fileList'
                                        errorMsg={uploadErrorMsg}
                                        setErrorMsg={setUploadErrorMsg}/>
                                </Col>
                                <Col span={24}>
                                    <Descriptions
                                        layout={'vertical'}
                                        bordered
                                        size='small'
                                        className='hash-verifier-output-desc' // Override CSS
                                        labelStyle={{whiteSpace: 'nowrap'}}>
                                        <Descriptions.Item
                                            label={<LabelWithCopyBtn label='File Hash' data={fileHash}/>}>
                                            {fileHash}
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Col>
                                <Col span={24}>
                                    <Form.Item>
                                        <Button
                                            type='primary'
                                            htmlType='submit'
                                            loading={isCalculatingFileHash}
                                            style={{float: 'right'}}>
                                            Calculate
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Card>
                </Col>
                <Col span={8}>
                    <Card title={<Title level={3}>Aggregation</Title>}>
                        <AggregationVerifier />
                    </Card>
                </Col>
            </Row>
        </MainLayout>
    );
};
