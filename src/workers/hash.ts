import * as forge from 'node-forge';

self.onmessage = (e: MessageEvent<[string[], string[]]>) => {
    const hashFn = (value: string) => forge.util.encode64(forge.md.sha512.create().update(value).digest().getBytes());
    const [plaintextStrs, encryptedStrs] = e.data;
    const plaintextHashes = plaintextStrs.map((plaintextStr) => hashFn(plaintextStr));
    const encryptedFileHashes = encryptedStrs.map((encryptedStr) => hashFn(encryptedStr));
    self.postMessage([plaintextHashes, encryptedFileHashes]);
};

self.onmessage = (e: MessageEvent<string[]>) => {
    const hashFn = (value: string) => forge.util.encode64(forge.md.sha512.create().update(value).digest().getBytes());
    const strs = e.data;
    self.postMessage(strs.map((str) => hashFn(str)));
};
