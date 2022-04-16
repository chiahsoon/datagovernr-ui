import React from 'react';
import {InboxOutlined} from '@ant-design/icons';
import {Form} from 'antd';
import Dragger from 'antd/lib/upload/Dragger';
import {fieldsErrorRedBorder, fieldsGreyBorder} from '../styles/common';
import {SimpleError} from './SimpleError';

interface UploadFormItemProps {
    validateErrors?: boolean
    formKey: string
    errorMsg: string
    multiple?: boolean
    setErrorMsg: (msg: string) => void,
}

export const UploadFormItem = (props: UploadFormItemProps) => {
    const {formKey, errorMsg, validateErrors, multiple, setErrorMsg} = props;

    const handleFileEvent = (e: any): File[] => {
        // Handles both add and removal
        if (Array.isArray(e)) return e;
        return e && e.fileList;
    };

    return (
        <div> {/* div required to prevent list of uploaded files from eating into elements below */}
            <Form.Item
                noStyle
                name={formKey} // key in form.values
                valuePropName='fileList' // key in child
                getValueFromEvent={handleFileEvent}
                rules={[
                    // Ref: https://ant.design/components/form/#Rule
                    {
                        validator(_, value) {
                            if (validateErrors === false || (value != null && value.length >= 1)) {
                                setErrorMsg('');
                                return Promise.resolve();
                            }
                            const msg = 'Please upload at least one file.';
                            setErrorMsg(msg);
                            return Promise.reject(new Error(msg));
                        },
                    },
                ]}>
                <Dragger
                    multiple={multiple || multiple == null}
                    style={{borderColor: errorMsg ? fieldsErrorRedBorder : fieldsGreyBorder}}
                    beforeUpload={() => false}> {/* Stops from uploading immediately) */}
                    <p className='ant-upload-drag-icon'>
                        <InboxOutlined style={{color: fieldsGreyBorder}}/>
                    </p>
                    <p className='ant-upload-text' style={{color: 'grey'}}>
                        Click/Drag files here
                    </p>
                </Dragger>
            </Form.Item>
            <SimpleError errorMessage={errorMsg}/>
        </div>
    );
};
