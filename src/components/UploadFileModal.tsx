import React, {useState} from 'react';
import {Col, Form, Input, message, Modal, Row, Switch, Tooltip} from 'antd';
import {EyeInvisibleOutlined, EyeTwoTone, InfoCircleOutlined} from '@ant-design/icons';
import {UploadFile} from 'antd/es/upload/interface';
import {addFilesToDataset} from '../web/dataverse';
import {DataverseSourceParams} from '../types/dataverseSourceParams';
import {displayError} from '../utils/error';
import forge from 'node-forge';
import {DGFile} from '../types/verificationDetails';
import {saveFilesToDG} from '../web/api';
import {downloadViaATag, getUploadedFilesData} from '../utils/fileHelper';
import {encryptWithPassword} from '../services/keygen';
import JSZip from 'jszip';
import {UploadFormItem} from './UploadFormItem';

interface UploadFileModalProps {
    sourceParams: DataverseSourceParams
    visible: boolean
    setVisible: (isVisible: boolean) => void
    callbackFn: () => void
}

interface UploadFormValues {
    genSplitKeys: boolean
    password: string,
    fileList: UploadFile[],
}

export const UploadFileModal = (props: UploadFileModalProps) => {
    const [form] = Form.useForm();
    const {sourceParams, visible, setVisible, callbackFn} = props;
    const [isUploading, setIsUploading] = useState(false);
    const [uploadErrorMsg, setUploadErrorMsg] = useState('');

    const onModalOk = () => {
        setIsUploading(true);
        form.validateFields()
            .then((v: UploadFormValues) => saveFiles(sourceParams, getUploadedFilesData(v.fileList),
                v.password, v.genSplitKeys))
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
                setUploadErrorMsg('');
                form.resetFields();
            },
        });
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
                layout="horizontal"
                labelCol={{span: 8}}
                labelAlign={'left'}
                wrapperCol={{span: 16}}
                name="upload_files_form">
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <UploadFormItem
                            formKey='fileList'
                            errorMsg={uploadErrorMsg}
                            setErrorMsg={setUploadErrorMsg}/>
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
                        <Form.Item
                            name="genSplitKeys"
                            label="Generate Split Keys?"
                            labelCol={{span: 8}}
                            valuePropName="checked"
                            initialValue={true}>
                            <Switch defaultChecked/>
                        </Form.Item>
                    </Col>
                </Row>

            </Form>
        </Modal>
    );
};

const saveFiles = async (sourceParams: DataverseSourceParams, files: File[],
    password: string, splitKeys: boolean): Promise<void> => {
    const saltsBase64: string[] = [];
    const plaintextStrs: string[] = []; // To hash
    const encryptedStrs: string[] = []; // To hash
    const encryptedFiles: File[] = []; // To send to dataverse
    const allKeyShareFiles: File[] = [];

    for (const file of files) {
        const keyShareStrs: string[] = []; // To write split keys into
        const fileBuf = await file.arrayBuffer();
        const [encryptedBinaryStr, saltBase64] = encryptWithPassword(fileBuf, password,
            splitKeys? keyShareStrs: undefined);

        // Convert split keys into appropriately named files
        if (splitKeys && keyShareStrs.length > 0) {
            for (let idx = 0; idx < keyShareStrs.length; idx++) {
                const filename = `${file.name.replace('.', '_')}_key-${idx+1}.txt`;
                const keyShareStr = keyShareStrs[idx];
                const keyShareBuf = new TextEncoder().encode(keyShareStr);
                const keyShareBlob = new Blob([keyShareBuf]);
                const keyShareFile = new File([keyShareBlob], filename, {
                    type: 'text/plain', // Mime-type
                });
                allKeyShareFiles.push(keyShareFile);
            };
        }
        const encryptedBuf = new TextEncoder().encode(encryptedBinaryStr);
        const encryptedBlob = new Blob([encryptedBuf]);
        const encryptedFile = new File([encryptedBlob], file.name, {
            type: file.type,
        });

        saltsBase64.push(saltBase64);
        plaintextStrs.push(new TextDecoder().decode(fileBuf));
        encryptedStrs.push(encryptedBinaryStr);
        encryptedFiles.push(encryptedFile);
    }

    // Add to Dataverse
    const datasetFiles = await addFilesToDataset(sourceParams, encryptedFiles);

    // Hash and save base64 form (avoid database encoding issues) to DG
    const hashFn = (value: string) => forge.util.encode64(forge.md.sha512.create().update(value).digest().getBytes());
    const encryptedFileHashes = encryptedStrs.map((encryptedStr) => hashFn(encryptedStr));
    const plaintextHashes = plaintextStrs.map((plaintextStr) => hashFn(plaintextStr));
    const dgFiles: DGFile[] = datasetFiles.map((datasetFile, idx) => {
        return {
            id: datasetFile.dataFile.id,
            plaintextHash: plaintextHashes[idx],
            encryptedHash: encryptedFileHashes[idx],
            salt: saltsBase64[idx],
        };
    });
    await saveFilesToDG(dgFiles);

    // Let user download split keys
    if (!splitKeys) return;

    const keysFilename = 'keys.zip';
    const zip = new JSZip();
    allKeyShareFiles.forEach((file) => zip.file(file.name, file));
    const zipFile = await zip.generateAsync({type: 'blob'}).then((content) => {
        return new File([content], keysFilename);
    });
    downloadViaATag(keysFilename, zipFile);
};
