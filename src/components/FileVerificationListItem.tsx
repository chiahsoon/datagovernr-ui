import React from 'react';
import {List} from 'antd';
import {DGFile} from '../types/verificationDetails';

export const FileVerificationListItem = (props: { file: DGFile }) => {
    // TODO: Consider adding names to data
    const {id, plaintextHash, encryptedHash} = props.file;
    return (
        <List.Item>
            <List.Item.Meta
                title={`File ID: ${id}`}
                description={
                    <>
                    Plaintext Hash: {plaintextHash}
                        <br/>
                    Encrypted Hash: {encryptedHash}
                    </>
                }
                style={{overflowWrap: 'anywhere'}}
            />
        </List.Item>
    );
};
