import React, {useState} from 'react';
import {Button, Modal, Form, Input, Space, Tabs, Popover, Typography, Descriptions, Divider} from 'antd';
import {MinusCircleOutlined, PlusOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import {atomOneLight, CodeBlock} from 'react-code-blocks';
import forge from 'node-forge';
import xml2js from 'xml2js';
import {displayError} from '../utils/error';
import {ATTRIBUTES_KEY, getMerkleRoot, inTree, XMLRootNode, xmlToNode} from '../types/merkleTree';

const {TextArea} = Input;
const {Text, Title} = Typography;
const {TabPane} = Tabs;

interface FileHash {
    encryptedHash: string;
    plaintextHash: string;
}

interface Values {
    merkleTree: string;
    defaultHashes: FileHash[];
    rawHashes: string;
}

interface HashVerifierFormProps {
    visible: boolean;
    onCancel: () => void;
}

export const HashVerifierForm = (props: HashVerifierFormProps) => {
    const [form] = Form.useForm();
    const {visible, onCancel} = props;
    const [finalFilesHash, setFinalFilesHash] = useState('');
    const [finalFilesHashPresent, setFinalFilesHashPresent] = useState(false);
    const [actualMerkleRootHash, setActualMerkleRootHash] = useState('');
    const [providedMerkleRootHash, setProvidedMerkleRootHash] = useState('');
    const [verificationLink, setVerificationLink] = useState('');

    const cancel = () => {
        form.resetFields();
        setFinalFilesHash('');
        setFinalFilesHashPresent(false);
        setActualMerkleRootHash('');
        setProvidedMerkleRootHash('');
        setVerificationLink('');
        onCancel();
    };

    const setOutput = async (value: Values) => {
        const hashFn = (value: string) => forge.md.sha256.create().update(value).digest().toHex();

        // Aggregate file hashes ()
        let hashes = '';
        if (value.defaultHashes != null && value.defaultHashes.length > 0) {
            hashes += value.defaultHashes
                .map((fh) => fh.plaintextHash + ',' + fh.encryptedHash)
                .join('|');
        } else {
            const lines = value.rawHashes.split('\n');
            hashes += lines.join('|');
        }
        const finalFilesHash = hashFn(hashes);

        // Parse Merkle Tree XML
        const parser = new xml2js.Parser({attrkey: ATTRIBUTES_KEY});
        const mkString = value.merkleTree.replace('</no d e>', '</node>'); // OriginStamp proof copy/paste issue
        const xmlRoot: XMLRootNode = await parser.parseStringPromise(mkString);
        const rootNode = xmlToNode(xmlRoot.node);

        const actualMerkleRootHash = getMerkleRoot(rootNode, hashFn);
        const providedMerkleRootHash = rootNode.attrs.value;

        setFinalFilesHash(finalFilesHash);
        setFinalFilesHashPresent(inTree(rootNode, finalFilesHash));
        setActualMerkleRootHash(actualMerkleRootHash);
        setProvidedMerkleRootHash(providedMerkleRootHash);
    };

    return (
        <Modal
            visible={visible}
            title="Verify Hash"
            okText="Verify"
            cancelText="Cancel"
            onCancel={cancel}
            onOk={() => {
                form.validateFields()
                    .then((values: Values) => setOutput(values))
                    .catch((err: Error) => displayError(err.message, err));
            }}
        >
            <Form
                form={form}
                layout="vertical"
                name="form_in_modal"
                initialValues={{ }}>
                <Text strong>Hashes</Text>
                <Tabs
                    defaultActiveKey="1"
                    onChange={(activeKey) => {
                        activeKey === 'default' ? form.resetFields(['defaultHashes']) : form.resetFields(['rawHashes']);
                    }}>
                    <TabPane tab="Default" key="default">
                        <Form.List name="defaultHashes">
                            {(fields, {add, remove}) => (
                                <>
                                    {fields.map(({key, name, ...restField}) => (
                                        <Space
                                            key={key}
                                            style={{display: 'flex', marginBottom: 8}}
                                            align="baseline">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'plaintextHash']}
                                                rules={[{required: true, message: 'Missing plaintext hash'}]}>
                                                <Input placeholder="Plaintext Hash" />
                                            </Form.Item>
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'encryptedHash']}
                                                rules={[{required: true, message: 'Missing encrypted hash'}]}>
                                                <Input placeholder="Encrypted Hash" />
                                            </Form.Item>
                                            <MinusCircleOutlined onClick={() => remove(name)} />
                                        </Space>
                                    ))}
                                    <Form.Item>
                                        <Button
                                            type="dashed"
                                            onClick={() => add()} block icon={<PlusOutlined />}>
                                        Add Hash
                                        </Button>
                                    </Form.Item>
                                </>
                            )}
                        </Form.List>
                    </TabPane>
                    <TabPane tab="Raw" key="raw">
                        <Popover
                            content={fileHashesHelpContent}
                            overlayStyle={{whiteSpace: 'pre-line'}}
                            title="What is this?">
                            <Text type="secondary">(What is this?)</Text>
                        </Popover>
                        <br/>
                        <Form.Item name="rawHashes">
                            <TextArea
                                placeholder="List of file hashes"
                                rows={4}/>
                        </Form.Item>
                    </TabPane>
                </Tabs>
                <Form.Item
                    name="merkleTree"
                    label={
                        <span>
                            <Text strong>Merkle Tree</Text>
                            <Popover
                                content={merkleTreeHelpContent}
                                title="Merkle Tree Format">
                                <QuestionCircleOutlined style={{marginLeft: '8px'}}/>
                            </Popover>
                        </span>
                    }>
                    <TextArea
                        placeholder="Merkle Tree in XML"
                        autoSize={{minRows: 4, maxRows: 8}}/>
                </Form.Item>
            </Form>
            <Divider orientation='center' plain><Title level={5}>Output</Title></Divider>
            <Descriptions
                bordered
                column={1}
                size='small'
                className='hash-verifier-output-desc' // Override CSS
                labelStyle={{whiteSpace: 'nowrap'}}>
                <Descriptions.Item label="Verification Link">{verificationLink}</Descriptions.Item>
            </Descriptions>
            <br/>
            <Descriptions
                bordered
                column={1}
                size='small'
                className='hash-verifier-output-desc' // Override CSS
                labelStyle={{whiteSpace: 'nowrap'}}>
                <Descriptions.Item label="Final Files Hash">{finalFilesHash}</Descriptions.Item>
                <Descriptions.Item label="Actual Merkle Root Hash">{actualMerkleRootHash}</Descriptions.Item>
                <Descriptions.Item label="Provided Merkle Root Hash">{providedMerkleRootHash}</Descriptions.Item>
                <Descriptions.Item label="Files Hash Present?">
                    {finalFilesHash === '' ? '' : finalFilesHashPresent ? 'Yes' : 'No'}
                </Descriptions.Item>
                <Descriptions.Item label="Merkle Root Hashes Match?">
                    {
                        actualMerkleRootHash === '' || providedMerkleRootHash === '' ?
                            '' :
                            actualMerkleRootHash != '' &&
                            providedMerkleRootHash != '' &&
                            actualMerkleRootHash === providedMerkleRootHash ?
                                'Yes' :
                                'No'
                    }
                </Descriptions.Item>
            </Descriptions>
        </Modal>
    );
};

const fileHashesHelpContent = (
    <div>
        <p>
            {
                `Copy and paste in the hashes of the involved files in the following format:`
            }
        </p>
        <p>
            <CodeBlock
                text={
                    // eslint-disable-next-line max-len
                    `<File 1's Plaintext Hash>,<File 1's Encrypted Hash>\n<File 2's Plaintext Hash>,<File 2's Encrypted Hash>\n...`
                }
                language={'text'}
                showLineNumbers={false}
                theme={atomOneLight}/>
        </p>
        <p>
            {
                `Note that the values within '<>' should be replaced with the actual values, 
                and a single ',' should separate the plaintext and encrypted hash.`
            }
        </p>
    </div>
);

const merkleTreeHelpContent = (
    <div>
        <p>Paste in the Merkle Tree (in XML) from your proof file, which you can get from the verification link.</p>
        <p>It should look something like this: </p>
        <p>
            <CodeBlock
                text={`<?xml version="1.0" encoding="UTF-8"?>
<node type="key" value="d097f11dcb58db864c8f687ac56e98b8bcd6e2e05e2c584f0d218a98fc07e130">
    <left type="mesh" value="90b75050b30be61e765f470d8eaad0f972ce687e561030e63087c67aa019d879">
        <left type="mesh" value="f98bf911fdbb58fe79d9fed3dd19227f789a305bbdee486753589c6421079352"/>
        <right type="mesh" value="20895ba955fac2f2d40c1c94f2ffa9a24132c3cb9738c573b0339bc5b782d464"/>
    </left>
    <right type="mesh" value="465b5e78ffa06e3680d6b0f6645600b98bcc962988fe786f7310a2fded96ae4a"/>
</node>`}
                language={'xml'}
                showLineNumbers={false}
                theme={atomOneLight}/>
        </p>
        <p>Do ensure that the XML format is valid!</p>
    </div>
);
