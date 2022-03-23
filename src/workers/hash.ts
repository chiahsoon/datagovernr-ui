import {md, util} from 'node-forge';

let state: md.MessageDigest[] = [];

self.onmessage = (e: MessageEvent<any[]>) => {
    const body = e.data;
    if (body[0] === 'START') {
        state = []; // Clear state in case of faults
        const length = body[1];
        for (let i = 0; i < length; i++) {
            state.push(md.sha512.create());
        }
    } if (body[0] === 'CHUNK') {
        const itemIdx: number = body[1];
        const data: string = body[2];
        state[itemIdx].update(data);
    } else if (body[0] === 'END') {
        const hashes: string[] = [];
        for (let i = 0; i < state.length; i++) {
            hashes.push(util.encode64(state[i].digest().getBytes()));
        };
        self.postMessage(hashes);
        state = []; // Clear state
    }
};

