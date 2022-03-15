import streamSaver from 'streamsaver';
import {binStrToBytes} from './file';

// Different download methods
export const downloadViaATag = (fileName: string, data: Blob) => {
    const dataLink = URL.createObjectURL(data);
    const element = document.createElement('a');
    element.setAttribute('href', dataLink);
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};

export const downloadViaStreamSaver = async (fileName: string, readableStream: ReadableStream) => {
    // Stream should already a decoded string
    const reader = readableStream.getReader();
    const fileStream = streamSaver.createWriteStream(fileName);
    const writer = fileStream.getWriter();
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        const data: string = chunk.value;
        writer.write(binStrToBytes(data));
    }
    writer.close();
};
