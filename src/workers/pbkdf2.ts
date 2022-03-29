import {generateKey} from '../services/keygen/pbkdf2';

self.onmessage = (e: MessageEvent<[string, string, number][]>) => {
    const body: [string, string, number][] = e.data;
    const res = body.map(([password, saltBinStr, keyLen]) => generateKey(password, saltBinStr, keyLen));
    self.postMessage(res);
};
