import React from 'react';
import {List} from 'antd';
import {DGFile} from '../types/verificationDetails';

export const FileVerificationListItem: React.FC<{ file: DGFile, isCurrentFile: boolean }> = (props) => {
    // TODO: Consider adding names to data
    const {file, isCurrentFile} = props;
    const {id, plaintextHash, encryptedHash} = file;
    return (
        <List.Item>
            <List.Item.Meta
                title={
                    <>
                        File ID: {id}
                        <span style={{color: 'darkgray', fontStyle: 'italic'}}>
                            {isCurrentFile ? ' (Current File)' : ''}
                        </span>
                    </>
                }
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
