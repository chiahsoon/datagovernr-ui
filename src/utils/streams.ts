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
