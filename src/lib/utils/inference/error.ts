import { MessageCallbacks } from '@/lib/utils/inference/stream';

/**
 * Handles errors during inference, with special handling for abort errors
 */
export const handleInferenceError = (
    error: Error,
    isAborted: boolean,
    callbacks: MessageCallbacks,
): void => {
    // Special handling for AbortError - don't propagate it
    if (
        error instanceof Error &&
        error.name === 'AbortError'
    ) {
        // Do nothing for AbortError - it's expected
        return;
    }

    // Only call onError if not aborted
    if (!isAborted && callbacks.onError) {
        callbacks.onError(error);
    }

    // Re-throw non-abort errors
    if (
        !(
            error instanceof Error &&
            error.name === 'AbortError'
        )
    ) {
        throw error;
    }
};
