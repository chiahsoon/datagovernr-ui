import streamSaver from 'streamsaver';

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

export const downloadViaStreamSaver = async (fileName: string, readableStream: ReadableStream<Uint8Array>) => {
    const start = Date.now();
    const reader = readableStream.getReader();
    const fileStream = streamSaver.createWriteStream(fileName);
    const writer = fileStream.getWriter();
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        const data: Uint8Array = chunk.value;
        writer.write(data);
    }
    writer.close();
    console.log(`User download completed in ${(Date.now() - start) / 1000}s`);
};
