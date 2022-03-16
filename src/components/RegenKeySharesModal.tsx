import React from 'react';
import {EyeTwoTone, EyeInvisibleOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import {Form, Input, message, Modal, Tooltip} from 'antd';
import {genKeySharesFromPassword} from '../services/password';
import {displayError} from '../utils/error';
import {stringsToFiles} from '../utils/file';
import forge from 'node-forge';
import {filenameToKeyShareName} from '../utils/common';
import {downloadViaATag} from '../utils/download';
import {zipFiles} from '../utils/zip';

interface RegenKeySharesFormValues {
    password: string,
}

interface RegenKeySharesModalProps {
    fileName: string
    salt: string
    visible: boolean
    setVisible: (isVisible: boolean) => void
}

export const RegenKeySharesModal = (props: RegenKeySharesModalProps) => {
    const [form] = Form.useForm();
    const {fileName, salt, visible, setVisible} = props;

    const onModalOk = () => {
        form.validateFields()
            .then((v: RegenKeySharesFormValues) => genKeySharesToDownload(v.password, salt, fileName))
            .then(() => message.success('Successfully generated key share files.'))
            .then(() => form.resetFields())
            .then(() => setVisible(false))
            .catch((err: Error) => displayError('Failed to generate key share files: ' + err.message, err));
    };

    const onModalCancel = () => {
        setVisible(false);
        form.resetFields();
    };


    return (
        <Modal
            title={
                <span>
                    Regenerate Key Share Files
                    <Tooltip
                        title={`Note: If an invalid password is provided, key shares will be generated, 
                        but they will not be able to decrypt the file.`}>
                        <QuestionCircleOutlined style={{marginLeft: '8px'}}/>
                    </Tooltip>
                </span>
            }
            okText='Generate'
            visible={visible}
            onOk={onModalOk}
            onCancel={onModalCancel}>
            <Form
                form={form}
                layout='vertical'
                name='regen_key_shares_form'>
                <Form.Item
                    name='password'
                    label='Password'
                    rules={[
                        {
                            required: true,
                            message: 'Please enter your password.',
                        },
                    ]}>
                    <Input.Password
                        required
                        placeholder='Password'
                        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

const genKeySharesToDownload = async (
    password: string,
    salt: string,
    fileName: string) => {
    const keyShares = genKeySharesFromPassword(password, salt);
    const data: [string, string, string][] = keyShares.map((ks, idx) => {
        const keyFileName = filenameToKeyShareName(fileName, idx);
        const ksBase64 = forge.util.encode64(ks);
        return [keyFileName, 'text/plain', ksBase64];
    });
    const files = stringsToFiles(data);
    const keysFilename = 'keys.zip';
    const zipFile = await zipFiles(files, keysFilename);
    downloadViaATag(keysFilename, zipFile);
};
