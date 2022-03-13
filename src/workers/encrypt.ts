import {encryptWithPassword} from '../services/keygen';

self.onmessage = (e: MessageEvent<[ArrayBuffer, string, string[]?]>) => {
    const [dataBinaryBuf, password, keyShares] = e.data;
    const [encryptedBinaryString, saltBase64] = encryptWithPassword(dataBinaryBuf, password, keyShares);
    self.postMessage([encryptedBinaryString, saltBase64]);
};
