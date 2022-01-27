export const EmptyVerificationDetails: VerificationDetails = {
    verifier: {
        link: '',
        createdDate: new Date(),
    },
    files: [],
};

export interface VerificationDetails {
    verifier: Verifier
    files: DGFile[]
}

export interface Verifier {
    link: string
    createdDate: Date
}

export interface DGFile {
    id: number
    encryptedHash: string
}

export const isNotVerified = (details: VerificationDetails) => {
    return details.verifier == null || details.verifier.link === '';
};
