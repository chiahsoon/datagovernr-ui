import {CopyOutlined} from '@ant-design/icons';
import {Button, message} from 'antd';
import React from 'react';

export const LabelWithCopyBtn: React.FC<{label?: string, data: string}> = (props) => {
    const {label, data} = props;
    return (
        <>
            {label}
            <Button
                style={{border: '0px', background: 'transparent', boxShadow: 'none'}}
                icon={
                    <CopyOutlined
                        onClick={() => {
                            navigator.clipboard.writeText(data);
                            message.success('Copied to clipboard!');
                        }}/>
                }>
            </Button>
        </>
    );
};
