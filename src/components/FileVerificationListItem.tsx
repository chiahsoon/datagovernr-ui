import React from 'react';
import {List} from 'antd';
import {DGFile} from '../types/verificationDetails';

export const FileVerificationListItem = (props: { file: DGFile }) => {
    // TODO: Consider adding names to data
    const {id, encryptedHash} = props.file;
    return (
        <List.Item>
            <List.Item.Meta
                title={`File ID: ${id}`}
                description={`File Hash: ${encryptedHash}`}
            />
        </List.Item>
    );
};
