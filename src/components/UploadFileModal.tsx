import React, {useState} from 'react';
import {Col, message, Modal, Row, Switch, Tooltip, Upload} from 'antd';
import {InboxOutlined, InfoCircleOutlined} from '@ant-design/icons';
import {UploadFile} from 'antd/es/upload/interface';
import {RcFile} from 'antd/lib/upload';
import {addFilesToDataset} from '../web/dataverse';
import {DataverseSourceParams} from '../types/dataverseSourceParams';
import {displayError} from '../utils/error';
import forge from 'node-forge';
import {ab2str} from '../utils/fileHelper';
import {DGFile} from '../types/verificationDetails';
import {addFiles} from '../web/api';
import {DatasetFile} from '../types/datasetFile';
import {FileEncryptionScheme, FileEncryptionService} from '../services/encryption';

const {Dragger} = Upload;

interface UploadFileModalProps {
    sourceParams: DataverseSourceParams
    visible: boolean
    setVisible: (isVisible: boolean) => void
    callbackFn: () => void
}

export const UploadFileModal = (props: UploadFileModalProps) => {
    const {sourceParams, visible, setVisible, callbackFn} = props;
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [shouldEncryptFiles, setShouldEncryptFiles] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [encryptedData, setEncryptedData] = useState('');
    const [decryptedData, setDecryptedData] = useState('');

    const onModalOk = () => {
        const files = fileList
            .filter((file: UploadFile): file is RcFile => file !== undefined); // Type Guard

        // TODO: Encrypt data first when necessary
        const constructFileHashes = Promise
            .all(files.map((f) => f.arrayBuffer()))
            .then((fileBufs) => fileBufs.map((fileBuf) => ab2str(fileBuf)))
            .then((fileStrs) => fileStrs.map((fileStr) => forge.md.sha512.create().update(fileStr).digest().toHex()));

        setIsUploading(true);
        Promise.all([addFilesToDataset(sourceParams, files), constructFileHashes])
            .then(([datasetFiles, hashes]: [DatasetFile[], string[]]) => buildDGFile(datasetFiles, hashes))
            .then((dgFiles: DGFile[]) => addFiles(dgFiles))
            .then(() => message.success('Successfully uploaded all files.'))
            .catch((err) => displayError('Failed to upload some files!', err))
            .finally(() => setIsUploading(false))
            .finally(() => setVisible(false))
            .finally(() => setFileList([]))
            .finally(() => callbackFn());
    };

    const onModalCancel = () => {
        Modal.confirm({
            title: 'Cancel Upload',
            content: 'Are you sure you want to cancel? Your files will not be uploaded.',
            onOk: () => setVisible(false),
        });
    };

    const onFileRemove = (file: UploadFile) => {
        const index = fileList.indexOf(file);
        const newFileList = fileList.slice();
        newFileList.splice(index, 1);
        setFileList([...newFileList]);
    };

    const onFileAdd = (file: RcFile) => {
        setFileList([file, ...fileList]);
        file.arrayBuffer().then((arrBuf) => {
            const keySizeBytes = FileEncryptionService.getKeyLength(FileEncryptionScheme.AES256GCM);

            // Use master password to generate encryption key
            // Extract password derivation into new module
            const numIterations = 1000;
            const password = 'password';
            // 20-byte salt to match output length of PBKDF2 hash function (default SHA-1)
            const salt = forge.random.getBytesSync(20);
            const key = forge.pkcs5.pbkdf2(password, salt, numIterations, keySizeBytes);

            // Carry out encryption
            const cipher = FileEncryptionService.createEncryptionInstance(FileEncryptionScheme.AES256GCM, key);
            const encrypted = cipher.encryptFile(arrBuf);
            const encoded = forge.util.encode64(encrypted);
            setEncryptedData(encoded);

            // Carry out decryption
            const decipher = FileEncryptionService.createEncryptionInstance(
                FileEncryptionScheme.AES256GCM,
                cipher.getKey());
            const encoder = new TextEncoder();
            setDecryptedData(decipher.decryptFile(encoder.encode(encrypted).buffer));
        });
        return true;
    };

    return (
        <Modal
            title={<UploadFileModalTitle/>}
            visible={visible}
            onOk={onModalOk}
            onCancel={onModalCancel}
            okText={isUploading ? 'Uploading ...' : 'Upload'}
            okButtonProps={{
                disabled: fileList.length === 0,
                loading: isUploading,
            }}>

            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <div>
                        <Dragger
                            multiple
                            customRequest={() => {}} // Override default action (that uploads immediately)
                            onRemove={onFileRemove}
                            fileList={fileList}
                            beforeUpload={onFileAdd}>
                            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                            <p className="ant-upload-text">Click or drag file to this area to upload</p>
                        </Dragger>
                    </div>
                </Col>
                <Col span={16}>Encrypt all files?</Col>
                <Col span={8}>
                    <Switch checked={shouldEncryptFiles} onChange={setShouldEncryptFiles} style={{float: 'right'}}/>
                </Col>
                <Col span={24}>Encrypted Data Here (Base64 encoded): {encryptedData}</Col>
                <Col span={24}>Decrypted Data Here: {decryptedData}</Col>
            </Row>
        </Modal>
    );
};

const UploadFileModalTitle = () => {
    return (
        <span>
            Upload files to dataset
            <Tooltip title="Files will only be uploaded to the draft version.">
                <InfoCircleOutlined style={{marginLeft: '8px'}}/>
            </Tooltip>
        </span>
    );
};

const buildDGFile = (datasetFiles: DatasetFile[], hashes: string[]): DGFile[] => {
    // Assumes dataFiles and hashes are index-aligned (zippable)
    return datasetFiles.map((datasetFile, idx) => {
        return {
            id: datasetFile.dataFile.id,
            encryptedHash: hashes[idx],
        };
    });
};
