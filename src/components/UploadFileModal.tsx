import React, {useState} from 'react';
import {Upload, Col, Modal, Row, Switch, message, Tooltip} from 'antd';
import {InboxOutlined, InfoCircleOutlined} from '@ant-design/icons';
import {UploadFile} from 'antd/es/upload/interface';
import {RcFile} from 'antd/lib/upload';
import {addFilesToDataset} from '../web/dataverse';
import {DataverseSourceParams} from '../types/dataverseSourceParams';
import {displayError} from '../utils/error';

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

    const onModalOk = () => {
        // TODO: Encrypt data if needed
        const files = fileList
            .filter((file: UploadFile): file is RcFile => file !== undefined); // Type Guard

        setIsUploading(true);
        addFilesToDataset(sourceParams, files)
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
