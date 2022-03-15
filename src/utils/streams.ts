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
