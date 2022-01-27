import {DGFile, VerificationDetails} from '../types/verificationDetails';

const apiUrl = process.env.REACT_APP_API_URL;

export const getFileVerificationDetails = async (fileId: number): Promise<VerificationDetails> => {
    const url = `${apiUrl}/file/verify?fileId=${fileId}`;
    const resp = await fetch(url);
    const jsonData = await resp.json();
    const data: VerificationDetails = jsonData.data;
    if (data.verifier) data.verifier.createdDate = new Date(data.verifier.createdDate);
    return data;
};

export const addFiles = async (dgFiles: DGFile[]): Promise<void> => {
    const url = `${apiUrl}/file`;
    await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({files: dgFiles}),
    });
};
