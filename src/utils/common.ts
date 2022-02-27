export const filenameToKeyShareName = (filename:string, idx: number): string => {
    return `${filename.replace('.', '_')}_key-${idx+1}.txt`;
};
