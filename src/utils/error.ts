import {message} from 'antd';

export const displayError = (msg: string, err: Error) => {
    console.log(`${msg}: ${err}`);
    message.error(msg).then();
};
