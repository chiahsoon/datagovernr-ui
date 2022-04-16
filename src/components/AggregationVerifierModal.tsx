import React from 'react';
import {Modal, Form} from 'antd';
import {AggregationVerifier} from './AggregationVerifier';

interface AggregationVerifierModalProps {
    visible: boolean;
    onCancel: () => void;
}

export const AggregationVerifierModal: React.FC<AggregationVerifierModalProps> = (props) => {
    const [form] = Form.useForm();
    const {visible, onCancel} = props;

    const cancel = () => {
        form.resetFields();
        onCancel();
    };

    return (
        <Modal
            visible={visible}
            title='Verify Hash'
            okText='Verify'
            cancelText='Cancel'
            onCancel={cancel}
            okButtonProps={{style: {display: 'none'}}}
            cancelButtonProps={{style: {display: 'none'}}}
        >
            <AggregationVerifier/>
        </Modal>
    );
};
