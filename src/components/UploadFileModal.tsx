import React, {useState} from 'react';
import {Col, Form, Input, message, Modal, Row, Switch, Tooltip} from 'antd';
import {EyeInvisibleOutlined, EyeTwoTone, InfoCircleOutlined} from '@ant-design/icons';
import {UploadFile} from 'antd/es/upload/interface';
import {addStreamsToDvDataset} from '../web/dataverse';
import {DataverseParams} from '../types/dataverseParams';
import {displayError} from '../utils/error';
import {encryptWithPasswordToStream, genKeyWithSalts} from '../services/password';
import {DGFile} from '../types/verificationDetails';
import {saveFilesToDG} from '../web/api';
import {getUploadedFilesData, stringsToFiles} from '../utils/file';
import {UploadFormItem} from './UploadFormItem';
import {filenameToKeyShareName} from '../utils/common';
import {zipFiles} from '../utils/zip';
import {downloadViaATag} from '../utils/download';
import {hashFilesWithWorkers, hashStreamsWithWorkers} from '../utils/worker';
import {createStream} from '../utils/stream';
import {splitKey} from '../services/keysplit';
import {util} from 'node-forge';

interface UploadFileModalProps {
    dvParams: DataverseParams
    visible: boolean
    setVisible: (isVisible: boolean) => void
    callbackFn: () => void
}

interface UploadFormValues {
    genSplitKeys: boolean
    password: string,
    fileList: UploadFile[],
}

export const UploadFileModal: React.FC<UploadFileModalProps> = (props) => {
    const [form] = Form.useForm();
    const {dvParams, visible, setVisible, callbackFn} = props;
    const [isUploading, setIsUploading] = useState(false);
    const [uploadErrorMsg, setUploadErrorMsg] = useState('');

    const onModalOk = () => {
        const start = Date.now();
        setIsUploading(true);
        form.validateFields()
            .then((v: UploadFormValues) => upload(dvParams,
                getUploadedFilesData(v.fileList), v.password, v.genSplitKeys))
            .then(() => console.log(`Upload process completed in ${(Date.now() - start) / 1000}`))
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
                    <Tooltip title='Files will only be uploaded to the draft version.'>
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
                layout='horizontal'
                labelCol={{span: 8}}
                labelAlign={'left'}
                wrapperCol={{span: 16}}
                name='upload_files_form'>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <UploadFormItem
                            formKey='fileList'
                            errorMsg={uploadErrorMsg}
                            setErrorMsg={setUploadErrorMsg}/>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name='password'
                            label='Password'
                            rules={[
                                {required: true, message: 'Please enter your password.'},
                                {min: 8, message: 'Password must be at least 8 characters'},
                            ]}>
                            <Input.Password
                                required
                                placeholder='Password'
                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}/>
                        </Form.Item>
                        <Form.Item
                            name='genSplitKeys'
                            label='Generate Split Keys?'
                            labelCol={{span: 8}}
                            valuePropName='checked'
                            initialValue={true}>
                            <Switch defaultChecked/>
                        </Form.Item>
                    </Col>
                </Row>

            </Form>
        </Modal>
    );
};

const upload = async (
    dvParams: DataverseParams,
    files: File[],
    password: string,
    toGenSplitKeys: boolean): Promise<void> => {
    const allKeyShareFiles: File[] = []; // To download
    const encryptedToHashStreams: ReadableStream<Uint8Array>[] = []; // Hash & encode64 send to api
    const encryptedToStoreStreams: ReadableStream<Uint8Array>[] = []; // Send to dataverse

    const [keyBinStrArr, saltsB64s] = await genKeyWithSalts(password, files.length);
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const keyBinStr = keyBinStrArr[i];
        const encryptedStream = createStream();
        encryptWithPasswordToStream(file, keyBinStr, encryptedStream.writable);

        const [encryptedToHashStream, encryptedToStoreStream] = encryptedStream.readable.tee();
        encryptedToHashStreams.push(encryptedToHashStream);
        encryptedToStoreStreams.push(encryptedToStoreStream);

        // Convert split keys into appropriately named files
        if (!toGenSplitKeys) continue;
        const keyShareB64Arr = splitKey(keyBinStr).map((ks) => util.encode64(ks));
        allKeyShareFiles.push(...genKeyShareFiles(keyShareB64Arr, file.name));
    }

    const [datasetFiles, plaintextHashes, encryptedHashes] = await Promise.all([
        addStreamsToDvDataset(dvParams, encryptedToStoreStreams, files.map((f) => f.name)),
        hashFilesWithWorkers(files),
        hashStreamsWithWorkers(encryptedToHashStreams),
    ]);

    const dgFiles: DGFile[] = datasetFiles.map((datasetFile, idx) => {
        return {
            id: datasetFile.dataFile.id,
            plaintextHash: plaintextHashes[idx],
            encryptedHash: encryptedHashes[idx],
            salt: saltsB64s[idx],
        };
    });
    await saveFilesToDG(dgFiles);

    // Let user download split keys as a zip
    if (!toGenSplitKeys) return;
    const keysFilename = 'keys.zip';
    const zipFile = await zipFiles(allKeyShareFiles, keysFilename);
    downloadViaATag(keysFilename, zipFile);
};

const genKeyShareFiles = (keyShares: string[], filename: string): File[] => {
    const data: [string, string, string][] = keyShares.map((ks, idx) => {
        const keyFileName = filenameToKeyShareName(filename, idx);
        return [keyFileName, 'text/plain', ks];
    });
    return stringsToFiles(data);
};
