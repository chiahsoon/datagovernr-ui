import {VerificationDetails} from '../types/verificationDetails';

const apiUrl = process.env.REACT_APP_API_URL;

export const getFileVerificationDetails = async (fileId: string): Promise<VerificationDetails> => {
    const url = `${apiUrl}/file/verify?fileId=${fileId}`;
    const resp = await fetch(url);
    const jsonData = await resp.json();
    const data: VerificationDetails = jsonData.data;
    data.verifier.createdDate = new Date(data.verifier.createdDate);
    return data;
};
