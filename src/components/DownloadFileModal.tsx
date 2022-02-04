import React, {useState} from 'react';
import {Col, Form, Input, message, Modal, Row} from 'antd';
import {EyeInvisibleOutlined, EyeTwoTone} from '@ant-design/icons';
import {downloadFile} from '../web/dataverse';
import {DataverseSourceParams} from '../types/dataverseSourceParams';
import {displayError} from '../utils/error';
import {decryptWithPassword} from '../services/keygen';
import {byteStringToBytes as binaryToByteArray, downloadViaATag} from '../utils/fileHelper';

interface DownloadFileModalProps {
    sourceParams: DataverseSourceParams
    fileId: number
    fileName: string
    salt: string
    visible: boolean
    setVisible: (isVisible: boolean) => void
}

interface DownloadForm {
    password: string
}

export const DownloadFileModal = (props: DownloadFileModalProps) => {
    const [form] = Form.useForm();
    const {sourceParams, fileId, fileName, salt, visible, setVisible} = props;
    const [isDownloading, setIsDownloading] = useState(false);

    const onModalOk = () => {
        setIsDownloading(true);
        form.validateFields()
            .then((v: DownloadForm) => decryptAndDownload(sourceParams, fileId, fileName, salt, v.password))
            .then(() => message.success('Successfully downloaded file.'))
            .then(() => form.resetFields())
            .then(() => setVisible(false))
            .catch((err) => displayError('Failed to download file!', err))
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
                layout="vertical"
                name="download_files_form">
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[{required: true, message: 'Please enter your password.'}]}>
                            <Input.Password
                                required
                                placeholder="Password"
                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
};

const decryptAndDownload = async (
    sourceParams: DataverseSourceParams,
    fileId: number,
    fileName: string,
    salt: string,
    password: string): Promise<void> => {
    const ciphertextBinaryBuf = await downloadFile(sourceParams, fileId);
    const plaintextBinary = decryptWithPassword(ciphertextBinaryBuf, password, salt);
    const bytes = binaryToByteArray(plaintextBinary);
    const blob = new Blob([bytes]);
    downloadViaATag(fileName, blob);
};
