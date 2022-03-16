import React, {useState} from 'react';
import {Col, Form, Input, message, Modal, Row, Switch, Tooltip} from 'antd';
import {EyeInvisibleOutlined, EyeTwoTone, InfoCircleOutlined} from '@ant-design/icons';
import {UploadFile} from 'antd/es/upload/interface';
import {addFilesToDataset} from '../web/dataverse';
import {DataverseParams} from '../types/dataverseParams';
import {displayError} from '../utils/error';
import {encryptWithPasswordToBuf} from '../services/keygen';
import {DGFile} from '../types/verificationDetails';
import {saveFilesToDG} from '../web/api';
import {getUploadedFilesData, stringsToFiles} from '../utils/file';
import {UploadFormItem} from './UploadFormItem';
import {filenameToKeyShareName} from '../utils/common';
import {md, util} from 'node-forge';
import {zipFiles} from '../utils/zip';
import {downloadViaATag} from '../utils/download';

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

export const UploadFileModal = (props: UploadFileModalProps) => {
    const [form] = Form.useForm();
    const {dvParams, visible, setVisible, callbackFn} = props;
    const [isUploading, setIsUploading] = useState(false);
    const [uploadErrorMsg, setUploadErrorMsg] = useState('');

    const onModalOk = () => {
        setIsUploading(true);
        form.validateFields()
            .then(async (v: UploadFormValues) => saveFiles(dvParams,
                getUploadedFilesData(v.fileList), v.password, v.genSplitKeys))
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
                            rules={[{required: true, message: 'Please enter your password.'}]}>
                            <Input.Password
                                required
                                placeholder='Password'
                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            />
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

const saveFiles = async (
    dvParams: DataverseParams,
    files: File[],
    password: string,
    splitKeys: boolean): Promise<void> => {
    const beforeSaving = Date.now();

    const saltsBase64: string[] = []; // To send to api
    const plaintextHashes: string[] = []; // To send to api
    const encryptedHashes: string[] = []; // To send to api
    const encryptedFiles: File[] = []; // To send to dataverse
    const allKeyShareFiles: File[] = []; // To download

    for (const file of files) {
        const fileBuf = await file.arrayBuffer();
        plaintextHashes.push(hashDataBuf(fileBuf));

        const keyShareBase64Strs: string[] = []; // To write split keys into
        const [encryptedBuf, saltBase64] = await encryptWithPasswordToBuf(
            fileBuf, password, splitKeys ? keyShareBase64Strs : undefined);
        saltsBase64.push(saltBase64);

        encryptedHashes.push(hashDataBuf(encryptedBuf));
        encryptedFiles.push(new File([encryptedBuf], file.name));

        // Convert split keys into appropriately named files
        if (!splitKeys) continue;
        allKeyShareFiles.push(...genKeyShareFiles(keyShareBase64Strs, file.name));
    }

    const datasetFiles = await addFilesToDataset(dvParams, encryptedFiles);
    const dgFiles: DGFile[] = datasetFiles.map((datasetFile, idx) => {
        return {
            id: datasetFile.dataFile.id,
            plaintextHash: plaintextHashes[idx],
            encryptedHash: encryptedHashes[idx],
            salt: saltsBase64[idx],
        };
    });
    await saveFilesToDG(dgFiles);

    // Let user download split keys as a zip
    if (!splitKeys) return;
    const keysFilename = 'keys.zip';
    const zipFile = await zipFiles(allKeyShareFiles, keysFilename);
    downloadViaATag(keysFilename, zipFile);
    console.log('Save Files Time Taken: ', (Date.now() - beforeSaving) / 1000);
};

const genKeyShareFiles = (keyShares: string[], filename: string): File[] => {
    const data: [string, string, string][] = keyShares.map((ks, idx) => {
        const keyFileName = filenameToKeyShareName(filename, idx);
        return [keyFileName, 'text/plain', ks];
    });
    return stringsToFiles(data);
};

const hashDataBuf = (dataBinBuf: ArrayBuffer): string => {
    const chunkSize = 64 * 1024;
    const hasher = md.sha512.create();
    for (let i = 0; i < dataBinBuf.byteLength; i+=chunkSize) {
        console.log('Hashing buffer ...');
        const chunkBinBuf = dataBinBuf.slice(i, i + chunkSize);
        const chunkBinStr = new TextDecoder().decode(chunkBinBuf);
        hasher.update(chunkBinStr);
    }
    // Fixed size so safe to store as string
    return util.encode64(hasher.digest().getBytes());
};

// const hashDataBufUsingWorkers = (
//     plaintextBufs: ArrayBuffer[],
//     encryptedBufs: ArrayBuffer[]): Promise<[string[], string[]]> => {
//     const worker = new Worker(new URL('../workers/hash.ts', import.meta.url));
//     return new Promise((resolve) => {
//         worker.onmessage = (e) => {
//             const hashes: string[] = e.data;
//             const plaintextHashes = hashes.slice(0, plaintextBufs.length);
//             const encryptedHashes = hashes.slice(plaintextBufs.length);
//             resolve([plaintextHashes, encryptedHashes]);
//             worker.terminate();
//         };
//         const data = [...plaintextBufs, ...encryptedBufs];
//         worker.postMessage(data, data);
//     });
// };
