import { v4 as uuidv4 } from 'uuid';

import { TContext } from '@/types/context';
import { getTokenCount } from '@/lib/utils/tokens';
import { TChatMessage, TStopReason } from '@/types/message';
import { deleteLatestUserContext } from '@/lib/utils/inference/context';

/**
 * Calculate the token count for a message with a default fallback value
 */
export const calculateMessageTokens = (
    content: string,
    defaultValue = 1,
): number => {
    if (!content?.trim()) {
        return defaultValue;
    }

    return getTokenCount(content.trim()) || defaultValue;
};

/**
 * Prepares a new user message
 */
export const prepareUserMessage = (
    input: string,
    lastMessagePosition: number,
    getTokenCount: (text: string) => number,
    languageModel: string,
): {
    messageId: string;
    message: TChatMessage;
} => {
    const newMessage: TChatMessage = {
        position: lastMessagePosition + 1,
        rawHuman: input,
        rawAI: '',
        createdAt: new Date(),
        humanTokenCount: getTokenCount(input),
        aiTokenCount: 0,
        llmModelUsed: languageModel,
    };

    return {
        messageId: uuidv4(),
        message: newMessage,
    };
};

/**
 * Updates a message with empty content
 */
export const handleEmptyMessage = (
    characterId: string,
    messageId: string,
    message: TChatMessage,
    updateMessage: (
        characterId: string,
        messageId: string,
        message: TChatMessage,
    ) => void,
    cleanAppState: () => void,
): void => {
    // Only set rawAI to empty string if it's actually empty
    const existingContent = message.rawAI || '';

    updateMessage(characterId, messageId, {
        ...message,
        // Preserve any existing content
        rawAI: existingContent,
        stopReason: 'stream_empty' as TStopReason,
        aiTokenCount: 0,
    });
    cleanAppState();
};

/**
 * Updates a message with completed content and token counts
 */
export const finalizeMessage = (
    characterId: string,
    messageId: string,
    message: TChatMessage,
    responseTokenCount: number,
    relevantContentUrls: string[],
    updateMessage: (
        characterId: string,
        messageId: string,
        message: TChatMessage,
    ) => void,
): void => {
    const updatedMessage = {
        ...message,
        stopReason: 'finish' as TStopReason,
        aiTokenCount: responseTokenCount,
    };

    // Only add relevantContent if we have URLs
    if (relevantContentUrls.length > 0) {
        Object.assign(updatedMessage, {
            relevantContent: relevantContentUrls,
        });
    }

    updateMessage(characterId, messageId, updatedMessage);
};

/**
 * Processes a completed message after inference
 */
export const processCompletedMessage = async (
    characterId: string,
    messageIndex: number,
    getMessage: (
        characterId: string,
        messageIndex: number,
    ) => TChatMessage | undefined,
    getMessageId: (
        characterId: string,
        messageIndex: number,
    ) => string | undefined,
    updateMessage: (
        characterId: string,
        messageId: string,
        message: TChatMessage,
    ) => void,
    addContext: (
        characterId: string,
        contextId: string,
        context: TContext,
    ) => void,
    cleanAppState: () => void,
    saveMessage: (
        characterId: string,
        message: TChatMessage,
        onError: (error: Error) => void,
    ) => Promise<void>,
    showError: (message: string) => void,
    errorMessage: string,
    relevantContent: string[] = [],
    contentUrls: string[] = [],
    fullContentIds: string[] = [],
) => {
    // Get message using stable index
    const messageId = getMessageId(
        characterId,
        messageIndex,
    );
    const message = getMessage(characterId, messageIndex);

    if (!messageId || !message) {
        cleanAppState();
        return;
    }

    // Get the original and trimmed content
    const rawContent = message.rawAI || '';
    const messageContent = rawContent.trim();

    // Calculate token count for any content we have
    const responseTokenCount = calculateMessageTokens(
        messageContent,
        0,
    );

    // Don't handle as empty if we have a stopReason of cancel already
    if (
        !messageContent &&
        message.stopReason !== 'cancel'
    ) {
        handleEmptyMessage(
            characterId,
            messageId,
            message,
            updateMessage,
            cleanAppState,
        );
        return;
    }

    // Add context entry for the assistant's response
    if (messageContent) {
        addContext(characterId, uuidv4(), {
            content: messageContent,
            role: 'assistant',
            tokenCount: responseTokenCount,
        });
    }

    // Skip verification and finalization for cancellation
    if (message.stopReason === 'cancel') {
        // Even for cancelled messages, set the token count if we have content
        updateMessage(characterId, messageId, {
            ...message,
            aiTokenCount: responseTokenCount,
        });
        cleanAppState();
        return;
    }

    // Verify which RAG content was used (if any)
    let relevantContentUrls: string[] = [];
    let relevantFullContentIds: string[] = [];

    if (relevantContent.length > 0 && messageContent) {
        try {
            const result = await import(
                '@/lib/utils/rag'
            ).then((module) =>
                module.verifyRagUsage(
                    messageContent,
                    relevantContent,
                    contentUrls,
                    fullContentIds,
                ),
            );

            relevantContentUrls = result.relevantUrls;
            relevantFullContentIds =
                result.relevantContentIds;

            // TODO: must map all video variants on backend and when we decide to show them in memories, THEN we use the correct URL
            // Transform URLs to use watermarked content
            const { ragConstants } = await import(
                '@/config'
            );
            relevantContentUrls = relevantContentUrls.map(
                (url) =>
                    url.replace(
                        ragConstants.contentUrls
                            .initialContentSubpath,
                        ragConstants.contentUrls
                            .desiredContentSubpath,
                    ),
            );
        } catch {}
    }

    // Finalize the message with all updates
    const updatedMessage = {
        ...message,
        stopReason: 'finish' as TStopReason,
        aiTokenCount: responseTokenCount,
        relevantContent:
            relevantContentUrls.length > 0
                ? relevantContentUrls
                : undefined,
    };

    updateMessage(characterId, messageId, updatedMessage);

    // Save message and apply penalties in parallel
    await Promise.all([
        // Save message to DB
        saveMessage(characterId, updatedMessage, () => {
            showError(errorMessage);
        }),
        // Apply penalties if needed
        relevantFullContentIds.length > 0
            ? import('@/lib/utils/rag').then((module) =>
                  module.applyContentPenalties(
                      relevantFullContentIds,
                  ),
              )
            : Promise.resolve(),
    ]);

    cleanAppState();
};

/**
 * Handle message interruption (cancellation or error)
 */
export const handleMessageInterrupt = (
    characterId: string,
    messageId: string,
    message: TChatMessage,
    isCancelled: boolean,
    updateMessage: (
        characterId: string,
        messageId: string,
        message: TChatMessage,
    ) => void,
    addContext: (
        characterId: string,
        contextId: string,
        context: TContext,
    ) => void,
    cleanAppState: () => void,
    saveMessage: (
        characterId: string,
        message: TChatMessage,
        onError: () => void,
    ) => Promise<void>,
    toast: (message: string) => void,
    errorMessage: string,
    getLatestContextRole: (
        characterId: string,
    ) => string | undefined,
    getContextCount: (characterId: string) => number,
    deleteLatestContext: (characterId: string) => void,
) => {
    // Calculate token count for any existing content
    const currentContent = message.rawAI?.trim() || '';
    const tokenCount =
        calculateMessageTokens(currentContent);

    // Update the message with appropriate stop reason
    const updatedMessage = {
        ...message,
        stopReason: isCancelled
            ? ('cancel' as TStopReason)
            : ('error' as TStopReason),
        aiTokenCount: tokenCount,
    };
    updateMessage(characterId, messageId, updatedMessage);

    // Add the existing content to context if present
    if (currentContent) {
        // Check if the latest context is already from the assistant
        const latestRole =
            getLatestContextRole(characterId);
        const contextCount = getContextCount(characterId);

        // If the latest context is from the assistant and we have context, remove it
        if (
            latestRole === 'assistant' &&
            contextCount > 0
        ) {
            deleteLatestContext(characterId);
        }

        // Add the new context
        addContext(characterId, uuidv4(), {
            content: currentContent,
            role: 'assistant',
            tokenCount: tokenCount,
        });
    }

    // Save the message if it has content
    if (currentContent || message.rawHuman) {
        saveMessage(characterId, updatedMessage, () => {
            // Only show save error toast if this wasn't a cancellation
            if (!isCancelled) {
                toast(errorMessage);
            }
        }).catch(() => {
            // Error is already handled by the callback
        });
    }

    cleanAppState();
};

/**
 * Stops ongoing message generation and properly handles the interrupted message
 */
export const stopGenerationProcess = (
    characterId: string,
    getMessageCount: (characterId: string) => number,
    getMessage: (
        characterId: string,
        messageIndex: number,
    ) => TChatMessage | undefined,
    getMessageId: (
        characterId: string,
        messageIndex: number,
    ) => string | undefined,
    updateMessage: (
        characterId: string,
        messageId: string,
        message: TChatMessage,
    ) => void,
    addContext: (
        characterId: string,
        contextId: string,
        context: TContext,
    ) => void,
    cancelAbortController: () => void,
    cleanAppState: () => void,
    getLatestContextRole?: (
        id: string,
    ) => 'user' | 'assistant' | undefined,
    getContextCount?: (id: string) => number,
    deleteLatestContext?: (id: string) => void,
): void => {
    // Get the current message to update its stopReason
    const messageCount = getMessageCount(characterId);
    if (messageCount > 0) {
        // Use a stable index reference to the last message
        const lastMessageIndex = messageCount - 1;
        const lastMessage = getMessage(
            characterId,
            lastMessageIndex,
        );
        const messageId = getMessageId(
            characterId,
            lastMessageIndex,
        );

        if (lastMessage && messageId) {
            // Get any content that was already streamed
            const currentContent =
                lastMessage.rawAI?.trim() || '';
            const tokenCount =
                calculateMessageTokens(currentContent);

            // Update the message with 'cancel' as the stopReason using stable references
            updateMessage(characterId, messageId, {
                ...lastMessage,
                stopReason: 'cancel',
                aiTokenCount: tokenCount, // Set token count for the partial content
            });

            // If we have all necessary functions for cleanup
            if (
                getLatestContextRole &&
                getContextCount &&
                deleteLatestContext
            ) {
                // Use centralized cleanup function
                deleteLatestUserContext(
                    characterId,
                    currentContent,
                    getLatestContextRole,
                    getContextCount,
                    deleteLatestContext,
                );
            }

            // Add context for partial content if it exists
            if (currentContent) {
                addContext(characterId, uuidv4(), {
                    content: currentContent,
                    role: 'assistant',
                    tokenCount: tokenCount,
                });
            }
        }
    }

    // Cancel any ongoing requests via the abort controller
    cancelAbortController();

    // Clean up the app state to reset flags
    cleanAppState();
};
