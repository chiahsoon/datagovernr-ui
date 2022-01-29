import React, {useState} from 'react';
import {Col, Form, Input, message, Modal, Row, Tooltip, Upload} from 'antd';
import {EyeInvisibleOutlined, EyeTwoTone, InboxOutlined, InfoCircleOutlined} from '@ant-design/icons';
import {UploadFile} from 'antd/es/upload/interface';
import {addFilesToDataset} from '../web/dataverse';
import {DataverseSourceParams} from '../types/dataverseSourceParams';
import {displayError} from '../utils/error';
import forge from 'node-forge';
import {DGFile} from '../types/verificationDetails';
import {saveFilesToDG} from '../web/api';
import {FileEncryptionScheme, FileEncryptionService} from '../services/encryption';
import {getUploadedFilesData} from '../utils/fileHelper';
import {SimpleError} from './SimpleError';
import {fieldsErrorRedBorder, fieldsGreyBorder} from '../styles/common';

const {Dragger} = Upload;

interface UploadFileModalProps {
    sourceParams: DataverseSourceParams
    visible: boolean
    setVisible: (isVisible: boolean) => void
    callbackFn: () => void
}

interface UploadForm {
    password: string,
    fileList: UploadFile[]
}

export const UploadFileModal = (props: UploadFileModalProps) => {
    const [form] = Form.useForm();
    const {sourceParams, visible, setVisible, callbackFn} = props;
    const [isUploading, setIsUploading] = useState(false);
    const [uploadErrorMessage, setUploadErrorMessage] = useState('');

    const onModalOk = () => {
        setIsUploading(true);
        form.validateFields()
            .then((v: UploadForm) => saveFiles(getUploadedFilesData(v.fileList), v.password, sourceParams))
            .then(() => message.success('Successfully uploaded all files.'))
            .then(() => form.resetFields())
            .then(() => setVisible(false))
            .then(() => callbackFn())
            .catch((err) => displayError('Failed to upload files!', err))
            .finally(() => setIsUploading(false));
    };

    const onModalCancel = () => {
        Modal.confirm({
            title: 'Cancel Upload',
            content: 'Are you sure you want to cancel? Your data will be lost.',
            onOk: () => {
                setVisible(false);
                setUploadErrorMessage('');
                form.resetFields();
            },
        });
    };

    const handleFileEvent = (e: any): File[] => {
        // Handles both upload and removal
        if (Array.isArray(e)) return e;
        return e && e.fileList;
    };

    return (
        <Modal
            title={
                <span>
                    Upload files to dataset
                    <Tooltip title="Files will only be uploaded to the draft version.">
                        <InfoCircleOutlined style={{marginLeft: '8px'}}/>
                    </Tooltip>
                </span>
            }
            visible={visible}
            onOk={onModalOk}
            onCancel={onModalCancel}
            okText={isUploading ? 'Uploading ...' : 'Upload'}
            okButtonProps={{loading: isUploading}}>
            <Form
                form={form}
                layout="vertical"
                name="upload_files_form">
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <div> {/* div required to prevent list of uploaded files from eating into elements below */}
                            <Form.Item
                                noStyle
                                name="fileList"
                                valuePropName="fileList" // key in form.values
                                getValueFromEvent={handleFileEvent}
                                rules={[
                                    // Ref: https://ant.design/components/form/#Rule
                                    {
                                        validator(_, value) {
                                            if (value != null && value.length >= 1) {
                                                setUploadErrorMessage('');
                                                return Promise.resolve();
                                            }
                                            const msg = 'Please upload at least one file.';
                                            setUploadErrorMessage(msg);
                                            return Promise.reject(new Error(msg));
                                        },
                                    },
                                ]}>
                                <Dragger
                                    multiple
                                    style={{borderColor: uploadErrorMessage ? fieldsErrorRedBorder : fieldsGreyBorder}}
                                    beforeUpload={() => false}> {/* Stops from uploading immediately) */}
                                    <p className="ant-upload-drag-icon">
                                        <InboxOutlined style={{color: fieldsGreyBorder}}/>
                                    </p>
                                    <p className="ant-upload-text" style={{color: 'grey'}}>
                                        Click/Drag files here
                                    </p>
                                </Dragger>
                            </Form.Item>
                            <SimpleError errorMessage={uploadErrorMessage}/>
                        </div>
                    </Col>
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

const saveFiles = async (files: File[], password: string, sourceParams: DataverseSourceParams): Promise<void> => {
    const salts: string[] = [];
    const plaintextStrs: string[] = []; // To hash
    const encryptedStrs: string[] = []; // To hash
    const encryptedFiles: File[] = []; // To send to dataverse
    for (const file of files) {
        const fileBuf = await file.arrayBuffer();
        const [encryptedStr, salt] = encryptWithPassword(fileBuf, password);
        const encryptedBlob = new Blob([encryptedStr]);
        const encryptedFile = new File([encryptedBlob], file.name, {
            type: file.type,
        });

        salts.push(salt);
        plaintextStrs.push(new TextDecoder().decode(fileBuf));
        encryptedStrs.push(encryptedStr);
        encryptedFiles.push(encryptedFile);
    }

    // Add to Dataverse
    const datasetFiles = await addFilesToDataset(sourceParams, encryptedFiles);

    // Add to DG
    const hashFn = (value: string) => forge.md.sha512.create().update(value).digest().getBytes();
    const encryptedFileHashes = encryptedStrs.map((encryptedStr) => hashFn(encryptedStr));
    const plaintextHashes = plaintextStrs.map((plaintextStr) => hashFn(plaintextStr));
    const dgFiles: DGFile[] = datasetFiles.map((datasetFile, idx) => {
        return {
            id: datasetFile.dataFile.id,
            plaintextHash: plaintextHashes[idx],
            encryptedHash: encryptedFileHashes[idx],
            salt: salts[idx],
        };
    });

    await saveFilesToDG(dgFiles);
};

// TODO: Refactor cryptography operations into another module
const encryptWithPassword = (plaintext: ArrayBuffer, password: string): [string, string] => {
    // 20-byte salt to match output length of PBKDF2 hash function (default SHA-1)
    const salt = forge.random.getBytesSync(20);
    const key = generateKey(password, salt);
    const cipher = FileEncryptionService.createEncryptionInstance(FileEncryptionScheme.AES256GCM, key);
    const cipherText = cipher.encryptFile(plaintext);
    return [cipherText, salt];
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const decryptWithPassword = (encrypted: ArrayBuffer, password: string, salt: string): string => {
    const key = generateKey(password, salt);
    const decipher = FileEncryptionService.createEncryptionInstance(
        FileEncryptionScheme.AES256GCM,
        key);
    return decipher.decryptFile(encrypted);
};

const generateKey = (password: string, salt: string): string => {
    // Extract password derivation into new module
    const keySizeBytes = FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM);
    const numIterations = 1000;
    return forge.pkcs5.pbkdf2(password, salt, numIterations, keySizeBytes);
};
