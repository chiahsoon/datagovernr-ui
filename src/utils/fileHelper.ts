
import {UploadFile} from 'antd/es/upload/interface';
import {RcFile} from 'antd/lib/upload';

export const getUploadedFilesData = (fileList: UploadFile[]): RcFile[] => {
    return fileList
        .map((file) => file.originFileObj)
        .filter((file): file is RcFile => file !== undefined); // Type Guard
};
