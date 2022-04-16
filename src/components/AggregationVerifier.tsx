import React, {useState} from 'react';
import {Form, Row, Col, Tabs, Space, Input, Button, Popover, Descriptions, Typography} from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import {MinusCircleOutlined, PlusOutlined, QuestionCircleOutlined} from '@ant-design/icons';
import {CodeBlock, atomOneLight} from 'react-code-blocks';
import forge from 'node-forge';
import xml2js from 'xml2js';
import {ATTRIBUTES_KEY, getMerkleRoot, inTree, XMLRootNode, xmlToNode} from '../types/merkleTree';
import {LabelWithCopyBtn} from './LabelWithCopyBtn';

const {Text} = Typography;
const {TabPane} = Tabs;

enum FileHashInputType {
    Default = 'default',
    Raw = 'raw',
};

interface FileHash {
    encryptedHash: string;
    plaintextHash: string;
}

interface AggregationVerifierFormValues {
    merkleTree: string;
    defaultHashes: FileHash[];
    rawHashes: string;
};

export const AggregationVerifier: React.FC = () => {
    const [internalAggregatedHash, setInternalAggregatedHash] = useState('');
    const [internalAggregatedHashPresent, setInternalAggregatedHashPresent] = useState(false);
    const [claimedMerkleRootHash, setClaimedMerkleRootHash] = useState(''); // Provided in MK input
    const [verifiedMerkleRootHash, setVerifiedMerkleRootHash] = useState(''); // Evaluated
    const [fileHashInputType, setFileHashInputType] = useState(FileHashInputType.Default);
    const [isAggregating, setAggregating] = useState(false);

    const [form] = Form.useForm();

    const onAggregateFinish = async (value: AggregationVerifierFormValues) => {
        setAggregating(true);
        const hashFn = (value: string) => forge.md.sha256.create().update(value).digest().toHex();

        // Verify Merkle Tree construction
        const parser = new xml2js.Parser({attrkey: ATTRIBUTES_KEY});
        const mkString = value.merkleTree.replace('</no d e>', '</node>'); // OriginStamp proof copy/paste issue
        const xmlRoot: XMLRootNode = await parser.parseStringPromise(mkString);
        const mkRoot = xmlToNode(xmlRoot.node);
        const claimedRootHash = mkRoot.attrs.value;
        const verifiedRootHash = getMerkleRoot(mkRoot, hashFn);

        setClaimedMerkleRootHash(claimedRootHash);
        setVerifiedMerkleRootHash(verifiedRootHash);

        // Verify internal aggregation of file hashes
        let hashes = '';
        if (fileHashInputType === FileHashInputType.Default) {
            hashes += value.defaultHashes
                .map((fh) => fh.plaintextHash + ',' + fh.encryptedHash)
                .join('|');
        } else {
            const lines = value.rawHashes.split('\n');
            hashes += lines.join('|');
        }
        const internalHash = hashFn(hashes);
        setInternalAggregatedHash(internalHash);
        setInternalAggregatedHashPresent(inTree(mkRoot, internalHash));
        setAggregating(false);
    };

    const onAggregateFailed = () => {
        form.resetFields();
        setAggregating(false);
    };

    return (
        <>
            <Form
                form={form}
                onFinish={onAggregateFinish}
                onFinishFailed={onAggregateFailed}
                layout='vertical'
                name='verify_aggregation_form'
                // onValuesChange={(v) => console.log(v)}
                initialValues={{ }}>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Text strong>File Hashes</Text>
                        <Tabs
                            defaultActiveKey='1'
                            onChange={(activeKey) => setFileHashInputType(activeKey as FileHashInputType)}>
                            <TabPane tab='Default' key={FileHashInputType.Default}>
                                <Form.List name='defaultHashes'>
                                    {(fields, {add, remove}) => (
                                        <>
                                            {fields.map(({key, name, ...restField}) => (
                                                <Space
                                                    key={key}
                                                    style={{display: 'flex', marginBottom: 8}}
                                                    align='baseline'>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'plaintextHash']}
                                                        rules={[{required: true, message: 'Missing plaintext hash'}]}>
                                                        <Input placeholder='Plaintext Hash' />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'encryptedHash']}
                                                        rules={[{required: true, message: 'Missing encrypted hash'}]}>
                                                        <Input placeholder='Encrypted Hash' />
                                                    </Form.Item>
                                                    <MinusCircleOutlined onClick={() => remove(name)} />
                                                </Space>
                                            ))}
                                            <Form.Item>
                                                <Button
                                                    block
                                                    type='dashed'
                                                    onClick={() => add()}
                                                    icon={<PlusOutlined />}>
                                                Add File Hash
                                                </Button>
                                            </Form.Item>
                                        </>
                                    )}
                                </Form.List>
                            </TabPane>
                            <TabPane tab='Raw' key={FileHashInputType.Raw}>
                                <Popover
                                    content={internalAggregationHelpContent}
                                    overlayStyle={{whiteSpace: 'pre-line'}}
                                    title='What is this?'>
                                    <Text type='secondary'>(What is this?)</Text>
                                </Popover>
                                <br/>
                                <Form.Item name='rawHashes'>
                                    <TextArea
                                        placeholder='List of file hashes'
                                        rows={4}/>
                                </Form.Item>
                            </TabPane>
                        </Tabs>
                    </Col>
                    <Col span={24}>
                        <Form.Item
                            name='merkleTree'
                            rules={[
                                {
                                    required: true,
                                    message: 'Please fill in the merkle tree data.',
                                },
                            ]}
                            label={
                                <span>
                                    <Text strong>Merkle Tree</Text>
                                    <Popover
                                        content={originStampAggregationHelpContent}
                                        title='Merkle Tree Format'>
                                        <QuestionCircleOutlined style={{marginLeft: '8px'}}/>
                                    </Popover>
                                </span>
                            }>
                            <TextArea
                                placeholder='Merkle Tree in XML'
                                autoSize={{minRows: 4, maxRows: 8}}/>
                        </Form.Item>
                    </Col>
                    <Col span={24}>
                        <Descriptions
                            bordered
                            column={1}
                            layout='horizontal'
                            size='small'
                            className='aggregation-verifier-output-desc' // Override CSS
                            labelStyle={{whiteSpace: 'nowrap'}}>
                            <Descriptions.Item
                                label={
                                    <LabelWithCopyBtn label='Internally Aggregated Hash' data={internalAggregatedHash}/>
                                }>
                                {internalAggregatedHash || '-'}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={
                                    <LabelWithCopyBtn label='Claimed Merkle Root Hash' data={claimedMerkleRootHash}/>
                                }>
                                {claimedMerkleRootHash === '' ? '-' : claimedMerkleRootHash}
                            </Descriptions.Item>
                            <Descriptions.Item
                                label={
                                    <LabelWithCopyBtn label='Verified Merkle Root Hash' data={verifiedMerkleRootHash}/>
                                }>
                                {verifiedMerkleRootHash === '' ? '-' : verifiedMerkleRootHash}
                            </Descriptions.Item>
                            <Descriptions.Item label='Internally Aggregated Hash Present in Merkle Tree'>
                                {internalAggregatedHash === '' ? '-' : internalAggregatedHashPresent ? 'Yes' : 'No'}
                            </Descriptions.Item>
                            <Descriptions.Item label='Merkle Root Hashes Match'>
                                {
                                    verifiedMerkleRootHash === '' || claimedMerkleRootHash === '' ?
                                        '-' :
                                        verifiedMerkleRootHash != '' &&
                                        claimedMerkleRootHash != '' &&
                                        verifiedMerkleRootHash === claimedMerkleRootHash ?
                                            'Yes' :
                                            'No'
                                }
                            </Descriptions.Item>
                        </Descriptions>
                    </Col>
                    <Col span={24}>
                        <Form.Item>
                            <Button
                                type='primary'
                                htmlType='submit'
                                loading={isAggregating}
                                style={{float: 'right'}}>
                                Aggregate
                            </Button>
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </>
    );
};

const internalAggregationHelpContent = (
    <div>
        <p>
            {
                'Copy and paste in the hashes of the involved files in the following format:'
            }
        </p>
        <p>
            <CodeBlock
                text={
                    // eslint-disable-next-line max-len
                    '<File 1\'s Plaintext Hash>,<File 1\'s Encrypted Hash>\n<File 2\'s Plaintext Hash>,<File 2\'s Encrypted Hash>\n...'
                }
                language={'text'}
                showLineNumbers={false}
                theme={atomOneLight}/>
        </p>
        <p>
            {
                `Note that the values within '<>' should be replaced with the actual values, 
                and a single ',' should separate the plaintext and encrypted hash.
                
                You can also obtain the raw hashes by clicking the copy button in the file page.`
            }
        </p>
    </div>
);

const originStampAggregationHelpContent = (
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
