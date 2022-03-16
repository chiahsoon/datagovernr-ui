export const CHUNK_SIZE = 64 * 1024;

export const createStream = (): TransformStream => {
    return new TransformStream({
        transform(chunk, controller) {
            controller.enqueue(chunk);
        },
        flush(controller) {
            controller.terminate();
        },
    });
};

export const streamToArr = async (stream: ReadableStream): Promise<any[]> => {
    const res = [];
    const reader = stream.getReader();
    for (let chunk = await reader.read(); !chunk.done; chunk = await reader.read()) {
        res.push(chunk.value);
    }
    return res;
};

export const blobToDecodedStream = async (blob: Blob): Promise<ReadableStream<string>> => {
    const stream = createStream();
    const tempWriter = stream.writable.getWriter();
    for (let idx = 0; idx < blob.size; idx += CHUNK_SIZE) {
        const chunk = await blob.slice(idx, idx + CHUNK_SIZE).arrayBuffer();
        tempWriter.write(chunk);
    }
    tempWriter.close();

    return stream.readable.pipeThrough(new TextDecoderStream());
};
