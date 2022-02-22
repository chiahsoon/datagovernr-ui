export const ATTRIBUTES_KEY = '@';

export interface XMLNode {
    '@': MerkleNodeAttributes,
    left?: XMLNode[],
    right?: XMLNode[],
}

export interface XMLRootNode {
    node: XMLNode
}

export interface MerkleNodeAttributes {
    type: string,
    value: string
}

export interface MerkleNode {
    attrs: MerkleNodeAttributes,
    left?: MerkleNode,
    right?: MerkleNode,
}

export function getMerkleRoot(node: MerkleNode, hashFn: (val: string) => string): string {
    if (node.left == null && node.right == null) {
        return node.attrs.value;
    }

    const left = node.left == null ? '' : getMerkleRoot(node.left, hashFn);
    const right = node.right == null ? '' : getMerkleRoot(node.right, hashFn);
    return hashFn(left + right);
}

export function inTree(node: MerkleNode, target: string): boolean {
    if (node.left == null && node.right == null) {
        return node.attrs.value === target;
    }

    const left = node.left == null ? false : inTree(node.left, target);
    const right = node.right == null ? false : inTree(node.right, target);
    return left || right;
}

export function xmlToNode(xmlNode: XMLNode): MerkleNode {
    return {
        attrs: xmlNode[ATTRIBUTES_KEY],
        left: xmlNode.left == null ? undefined : xmlToNode(xmlNode.left[0]),
        right: xmlNode.right == null ? undefined : xmlToNode(xmlNode.right[0]),
    };
}
