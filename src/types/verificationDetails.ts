export const EmptyVerificationDetails: VerificationDetails = {
    verifier: {
        link: '',
        createdDate: new Date(),
    },
    files: [],
};

export interface VerificationDetails {
    // files.length >= 1 since file itself should be involved in its verification
    // even if there's no verifier
    verifier?: Verifier
    files: DGFile[]
}

export interface Verifier {
    link: string
    createdDate: Date
}

export interface DGFile {
    id: number
    plaintextHash: string
    encryptedHash: string
    salt: string
}

export const isNotSentForVerification = (details: VerificationDetails) => {
    return details.verifier == null || details.verifier.link === '';
};

export const getConcatenatedHashes = (details: VerificationDetails) => {
    return details.files.map((f) => `${f.plaintextHash},${f.encryptedHash}`).join('\n');
};
