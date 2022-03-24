import {DGFile, VerificationDetails} from '../types/verificationDetails';

const apiUrl = process.env.REACT_APP_API_URL;

export const getDGFileVerificationDetails = async (fileId: number): Promise<VerificationDetails> => {
    const url = `${apiUrl}/file/verifier?fileId=${fileId}`;
    const resp = await fetch(url);
    const jsonData = await resp.json();
    const data: VerificationDetails = jsonData.data;
    if (data.verifier) data.verifier.createdDate = new Date(data.verifier.createdDate);
    return data;
};

export const checkFilesExistenceOnDG = async (fileIds: number[]): Promise<boolean[]> => {
    const url = `${apiUrl}/file/exists`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({fileIds}),
    });
    const jsonData = await resp.json();
    return jsonData.data;
};

export const saveFilesToDG = async (dgFiles: DGFile[]): Promise<void> => {
    const start = Date.now();
    const url = `${apiUrl}/file`;
    await fetch(url, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({files: dgFiles}),
    });
    console.log(`Saving to DataGovernR completed in: ${(Date.now() - start) / 1000}s`);
};
