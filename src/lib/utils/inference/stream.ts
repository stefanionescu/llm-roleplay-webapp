import { TContext } from '@/types/context';
import { handleInferenceError } from '@/lib/utils/inference/error';

export type MessageCallbacks = {
    onStart?: () => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
    onChunk?: (
        content: string,
        fullContent: string,
    ) => void;
};

type ParsedResponse = {
    choices?: {
        delta?: {
            content?: string;
        };
        message?: {
            content?: string;
        };
    }[];
};

/**
 * Sets up abort handling for the inference stream
 */
export const setupAbortHandling = (
    signal: AbortSignal,
): {
    isAborted: boolean;
    abortHandler: () => void;
} => {
    let isAborted = signal.aborted;

    const abortHandler = () => {
        isAborted = true;
    };

    signal.addEventListener('abort', abortHandler);

    return { isAborted, abortHandler };
};

/**
 * Prepares the request body for the inference API
 */
export const prepareInferenceRequestBody = (
    systemPrompt: string,
    contexts: TContext[],
    userInput: string,
    maxTokens: number,
) => {
    return {
        systemPrompt: systemPrompt,
        messages: JSON.stringify(
            contexts.concat({
                content: userInput,
                role: 'user',
                tokenCount: 0, // Token count is not relevant for the API call
            }),
        ),
        maxTokens: maxTokens.toString(),
    };
};

/**
 * Makes the API request to the inference endpoint
 */
export const makeInferenceApiRequest = async (
    requestBody: unknown,
    signal: AbortSignal,
    isAborted: boolean,
    callbacks: MessageCallbacks,
): Promise<Response> => {
    const response = await fetch(`/api/inference`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal,
    });

    if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`,
        );
        if (callbacks.onError && !isAborted) {
            callbacks.onError(error);
        }
        throw error;
    }

    if (!response.body) {
        const error = new Error(
            'No response body received',
        );
        if (callbacks.onError && !isAborted) {
            callbacks.onError(error);
        }
        throw error;
    }

    return response;
};

/**
 * Processes a single line from the stream
 */
export const processStreamLine = (
    line: string,
    streamedMessage: string,
    firstChunk: boolean,
    isAborted: boolean,
    callbacks: MessageCallbacks,
): { firstChunk: boolean; streamedMessage: string } => {
    if (!line?.startsWith('data: ')) {
        return { streamedMessage, firstChunk };
    }

    const data = line.slice(6).trim();
    if (data === '[DONE]') {
        return { streamedMessage, firstChunk };
    }

    try {
        const parsed = JSON.parse(data) as ParsedResponse;
        const content =
            parsed.choices?.[0]?.delta?.content ||
            parsed.choices?.[0]?.message?.content ||
            '';

        if (content) {
            // Fire onStart callback on first content
            let updatedFirstChunk = firstChunk;
            if (
                firstChunk &&
                callbacks.onStart &&
                !isAborted
            ) {
                callbacks.onStart();
                updatedFirstChunk = false;
            }

            // Pass only the new chunk of content, plus the full accumulated content
            const newChunk = content;
            const updatedStreamedMessage =
                streamedMessage + newChunk;

            if (callbacks.onChunk && !isAborted) {
                callbacks.onChunk(
                    newChunk,
                    updatedStreamedMessage,
                );
            }

            return {
                streamedMessage: updatedStreamedMessage,
                firstChunk: updatedFirstChunk,
            };
        }
        // eslint-disable-next-line unused-imports/no-unused-vars
    } catch (e) {
        // Ignore parse errors for incomplete chunks
    }

    return { streamedMessage, firstChunk };
};

/**
 * Processes the response stream from the inference API
 */
export const processInferenceStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    signal: AbortSignal,
    isAbortedRef: { isAborted: boolean },
    callbacks: MessageCallbacks,
): Promise<void> => {
    const decoder = new TextDecoder();
    let buffer = '';
    let streamedMessage = '';
    let firstChunk = true;

    while (!isAbortedRef.isAborted) {
        // Check if aborted before each iteration
        if (signal.aborted) {
            break;
        }

        const { value, done } = await reader.read();

        if (done) {
            if (
                callbacks.onComplete &&
                !isAbortedRef.isAborted
            ) {
                callbacks.onComplete();
            }
            break;
        }

        buffer += decoder.decode(value, {
            stream: true,
        });

        let newlineIndex;
        while (
            (newlineIndex = buffer.indexOf('\n')) !== -1
        ) {
            const line = buffer
                .slice(0, newlineIndex)
                .trim();
            buffer = buffer.slice(newlineIndex + 1);

            const result = processStreamLine(
                line,
                streamedMessage,
                firstChunk,
                isAbortedRef.isAborted,
                callbacks,
            );

            streamedMessage = result.streamedMessage;
            firstChunk = result.firstChunk;
        }
    }
};

/**
 * Core utility function to stream text from the inference API
 */
export const streamInferenceAPI = async (
    systemPrompt: string,
    contexts: TContext[],
    userInput: string,
    maxTokens: number,
    signal: AbortSignal,
    callbacks: MessageCallbacks = {},
): Promise<void> => {
    // Setup abort handling
    const { isAborted, abortHandler } =
        setupAbortHandling(signal);

    // Create an isAborted reference object that can be mutated
    const isAbortedRef = { isAborted };

    // Don't even start if we're already aborted
    if (isAborted) {
        return;
    }

    let reader: ReadableStreamDefaultReader<Uint8Array> | null =
        null;

    try {
        // Prepare request body
        const requestBody = prepareInferenceRequestBody(
            systemPrompt,
            contexts,
            userInput,
            maxTokens,
        );

        // Make the API request
        const response = await makeInferenceApiRequest(
            requestBody,
            signal,
            isAbortedRef.isAborted,
            callbacks,
        );

        // Using non-null assertion as we've already checked for null body in makeInferenceApiRequest
        reader = response.body!.getReader();

        // Process the stream
        await processInferenceStream(
            reader,
            signal,
            isAbortedRef,
            callbacks,
        );
    } catch (error) {
        handleInferenceError(
            error as Error,
            isAbortedRef.isAborted,
            callbacks,
        );
    } finally {
        // Clean up abort listener
        signal.removeEventListener('abort', abortHandler);

        // Make sure reader is closed
        if (reader) {
            reader.cancel().catch(() => {
                // Ignore errors from cancellation
            });
        }
    }
};
