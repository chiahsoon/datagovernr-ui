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
    id: string
    encryptedHash: string
}
