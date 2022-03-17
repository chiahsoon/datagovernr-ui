import React, {useState} from 'react';
import {Col, Form, Input, message, Modal, Row, Tabs, Typography} from 'antd';
import {EyeInvisibleOutlined, EyeTwoTone} from '@ant-design/icons';
import {DataverseParams} from '../types/dataverseParams';
import {displayError} from '../utils/error';
import {decryptWithPasswordToStream, decryptWithSharesToStream} from '../services/password';
import {downloadViaStreamSaver} from '../utils/download';
import {UploadFormItem} from './UploadFormItem';
import {UploadFile} from 'antd/lib/upload/interface';
import {downloadFile} from '../web/dataverse';
import {createStream} from '../utils/stream';

const {TabPane} = Tabs;
const {Text} = Typography;

interface DownloadFileModalProps {
    dvParams: DataverseParams
    fileId: number
    fileName: string
    salt: string
    visible: boolean
    setVisible: (isVisible: boolean) => void
}

interface DownloadFormValues {
    password: string
    keyShareFiles: UploadFile[]
}

enum DecryptionType {
    Password = 'password',
    KeyShareFiles = 'keyShareFiles',
}

export const DownloadFileModal = (props: DownloadFileModalProps) => {
    const [form] = Form.useForm();
    const {dvParams, fileId, fileName, salt, visible, setVisible} = props;
    const [isDownloading, setIsDownloading] = useState(false);
    const [decryptionType, setDecryptionType] = useState(DecryptionType.Password);
    const [uploadErrorMsg, setUploadErrorMsg] = useState('');

    const onModalOk = () => {
        setIsDownloading(true);
        form.validateFields()
            .then((v: DownloadFormValues) => decryptionType === DecryptionType.Password ?
                passwordDecryptDownload(dvParams, fileId, fileName, salt, v.password) :
                keyShareFilesDecryptDownload(dvParams, fileId, fileName, v.keyShareFiles))
            .then(() => message.success('Successfully downloaded file.'))
            .then(() => form.resetFields())
            .then(() => setVisible(false))
            .catch((err: Error) => displayError('Failed to download file: ' + err.message, err))
            .finally(() => setIsDownloading(false));
    };

    const onModalCancel = () => {
        setVisible(false);
        form.resetFields();
    };

    return (
        <Modal
            title={
                <span>
                    Decrypt and download files
                </span>
            }
            visible={visible}
            onOk={onModalOk}
            onCancel={onModalCancel}
            okText={isDownloading ? 'Downloading ...' : 'Download'}
            okButtonProps={{loading: isDownloading}}>
            <Form
                form={form}
                layout='vertical'
                name='download_files_form'>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Tabs
                            defaultActiveKey={DecryptionType.Password}
                            onChange={(activeKey) => setDecryptionType(activeKey as DecryptionType)}>
                            <TabPane tab='Password' key={DecryptionType.Password}>
                                <Form.Item
                                    name='password'
                                    label='Password'
                                    rules={[
                                        {
                                            required: decryptionType === DecryptionType.Password,
                                            message: 'Please enter your password.',
                                        },
                                    ]}>
                                    <Input.Password
                                        required
                                        placeholder='Password'
                                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                    />
                                </Form.Item>
                            </TabPane>
                            <TabPane tab='Key Share Files' key={DecryptionType.KeyShareFiles}>
                                <Text strong>Upload your key share text files</Text>
                                <br/><br/>
                                <UploadFormItem
                                    validateErrors={decryptionType === DecryptionType.KeyShareFiles}
                                    formKey={DecryptionType.KeyShareFiles}
                                    errorMsg={uploadErrorMsg}
                                    setErrorMsg={setUploadErrorMsg}/>
                            </TabPane>
                        </Tabs>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

const passwordDecryptDownload = async (
    dvParams: DataverseParams,
    fileId: number,
    fileName: string,
    saltBase64: string,
    password: string): Promise<void> => {
    const ciphertextBinaryBlob = await downloadFile(dvParams, fileId);
    const decryptedStream = createStream();
    decryptWithPasswordToStream(ciphertextBinaryBlob, password, saltBase64, decryptedStream.writable);
    downloadViaStreamSaver(fileName, decryptedStream.readable);
};

const keyShareFilesDecryptDownload = async (
    dvParams: DataverseParams,
    fileId: number,
    fileName: string,
    keyShareFiles: UploadFile[]): Promise<void> => {
    const fileToStringPromises: Promise<string>[] = [];
    keyShareFiles.forEach((f) => {
        if (f.originFileObj != null ) fileToStringPromises.push(f.originFileObj.text());
    });
    const keyShareStrings = await Promise.all(fileToStringPromises);

    const ciphertextBinaryBlob = await downloadFile(dvParams, fileId);
    const decryptedStream = createStream();
    decryptWithSharesToStream(ciphertextBinaryBlob, keyShareStrings, decryptedStream.writable);
    await downloadViaStreamSaver(fileName, decryptedStream.readable.pipeThrough(new TextDecoderStream()));
};
