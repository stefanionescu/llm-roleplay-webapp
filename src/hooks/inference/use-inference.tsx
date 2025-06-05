import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { Editor } from '@tiptap/react';
import { useTranslations } from 'next-intl';
import { useShallow } from 'zustand/react/shallow';

import { useStore } from '@/lib/zustand/store';
import { TCharacter } from '@/types/character';
import { TStopReason, TChatMessage } from '@/types/message';
import { useSaveMessage } from '@/hooks/inference/use-save-message';
import { useMessageGeneration } from '@/hooks/inference/use-message-generation';
import {
    processCompletedMessage,
    handleMessageInterrupt,
    calculateMessageTokens,
    prepareMessageGeneration,
} from '@/lib/utils/inference/inference';

/**
 * Main hook for message inference functionality
 */
export const useInference = () => {
    const t = useTranslations();
    const { saveMessage } = useSaveMessage();
    const { generateMessageStream } =
        useMessageGeneration();

    // Get store actions for state management
    const {
        updateMessage,
        deleteLatestMessage,
        deleteOldestFromContext,
        getContextsWithDeletableEntries,
        deleteManyOldestFromContext,
        cleanAppState,
        setAbortController,
        setIsPreparingToGenerate,
        setIsDoingRAG,
        setIsGenerating,
        getMessage,
        getMessageId,
        addContext,
        setIsCheckingRAGUsage,
        getLatestContextRole,
        getContextCount,
        deleteLatestContext,
    } = useStore(
        useShallow((state) => ({
            updateMessage: state.updateMessage,
            deleteLatestMessage: state.deleteLatestMessage,
            deleteOldestFromContext:
                state.deleteOldestFromContext,
            getContextsWithDeletableEntries:
                state.getContextsWithDeletableEntries,
            deleteManyOldestFromContext:
                state.deleteManyOldestFromContext,
            cleanAppState: state.cleanAppState,
            setAbortController: state.setAbortController,
            setIsPreparingToGenerate:
                state.setIsPreparingToGenerate,
            setIsDoingRAG: state.setIsDoingRAG,
            setIsGenerating: state.setIsGenerating,
            getMessage: state.getMessage,
            getMessageId: state.getMessageId,
            addContext: state.addContext,
            setIsCheckingRAGUsage:
                state.setIsCheckingRAGUsage,
            getLatestContextRole:
                state.getLatestContextRole,
            getContextCount: state.getContextCount,
            deleteLatestContext: state.deleteLatestContext,
        })),
    );

    /**
     * Creates a promise that resolves when the abort controller signals abort
     */
    const createAbortPromise = (
        currentAbortController: AbortController,
        characterId: string,
        messageIndex: number,
        messageId: string,
    ): Promise<void> => {
        return new Promise<void>((resolve) => {
            currentAbortController.signal.addEventListener(
                'abort',
                () => {
                    // Handle the message cancellation
                    const currentMessage = getMessage(
                        characterId,
                        messageIndex,
                    );
                    if (currentMessage && messageId) {
                        markMessageAsCanceled(
                            characterId,
                            messageId,
                            currentMessage,
                        );
                    }
                    // Resolve the promise to prevent unhandled rejections
                    resolve();
                },
                { once: true },
            );
        });
    };

    /**
     * Directly mark a message as cancelled without clearing content
     */
    const markMessageAsCanceled = (
        characterId: string,
        messageId: string,
        message: TChatMessage,
    ) => {
        // Calculate token count for any existing content
        const currentContent = message.rawAI?.trim() || '';
        const tokenCount =
            calculateMessageTokens(currentContent);

        // Preserve the existing rawAI content
        const updatedMessage = {
            ...message,
            stopReason: 'cancel' as TStopReason,
            aiTokenCount: tokenCount, // Set token count for the partial content
        };
        updateMessage(
            characterId,
            messageId,
            updatedMessage,
        );

        // Add the existing content to context if present
        if (currentContent) {
            addContext(characterId, uuidv4(), {
                content: currentContent,
                role: 'assistant',
                tokenCount: tokenCount,
            });
        }

        // Save the cancelled message if it has content, but don't show error toast
        if (currentContent || message.rawHuman) {
            saveMessage(characterId, updatedMessage, () => {
                // Silently handle save errors during cancellation
            }).catch(() => {
                // Error is already handled by the callback
            });
        }

        cleanAppState();
    };

    /**
     * Handle message generation start
     */
    const handleMessageGenerationStart = (
        editor?: Editor | null,
    ) => {
        // Clear the editor content while preserving scroll position
        if (editor) {
            // Get the current scroll position of the editor container
            const editorElement = editor.view.dom.closest(
                '.overflow-y-auto',
            );
            const scrollTop = editorElement?.scrollTop || 0;

            // Clear the content
            editor.commands.clearContent();

            // Manually trigger the update event to ensure character count resets
            editor.emit('update', {
                editor,
                transaction: editor.state.tr,
            });

            // Restore scroll position after a brief delay to ensure DOM update
            setTimeout(() => {
                if (editorElement) {
                    editorElement.scrollTop = scrollTop;
                }
            }, 0);
        }

        setIsGenerating(true);
        setIsPreparingToGenerate(false);
    };

    /**
     * Handle message chunk updates
     */
    const handleMessageChunk = (
        characterId: string,
        messageId: string,
        message: TChatMessage,
        content: string,
        abortController: AbortController,
    ) => {
        if (!abortController.signal.aborted) {
            updateMessage(characterId, messageId, {
                ...message,
                rawAI: content,
            });
        }
    };

    /**
     * Handle message generation error
     */
    const handleMessageGenerationError = (
        characterId: string,
        messageIndex: number,
        messageId: string,
    ) => {
        const currentMessage = getMessage(
            characterId,
            messageIndex,
        );
        if (currentMessage) {
            updateMessage(characterId, messageId, {
                ...currentMessage,
                stopReason: 'error' as TStopReason,
            });
        }
        cleanAppState();
    };

    /**
     * Handle message generation completion
     */
    const handleMessageGenerationComplete = (
        characterId: string,
        messageIndex: number,
        relevantContent: string[],
        contentUrls: string[],
        fullContentIds: string[],
    ) => {
        if (relevantContent.length > 0) {
            setIsCheckingRAGUsage(true);
        }

        setIsGenerating(false);
        setAbortController(undefined);

        // Only process if not already cancelled
        const currentMessage = getMessage(
            characterId,
            messageIndex,
        );
        const messageId = getMessageId(
            characterId,
            messageIndex,
        );

        if (
            currentMessage &&
            messageId &&
            currentMessage.stopReason !== 'cancel'
        ) {
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            processCompletedMessage(
                characterId,
                messageIndex,
                getMessage,
                getMessageId,
                updateMessage,
                addContext,
                cleanAppState,
                saveMessage,
                (message: string) => toast.error(message),
                t('error.cannotSaveMessage'),
                relevantContent,
                contentUrls,
                fullContentIds,
            );
        }
    };

    /**
     * Handle errors during message generation
     */
    const handleGenerationError = (
        error: unknown,
        characterId: string,
        messageIndex: number,
        messageId: string | null,
        errorMessage: string,
        toast: (message: string) => void,
    ) => {
        // Ignore AbortError completely - it's already handled by the abort event listener
        if (
            error instanceof Error &&
            error.name === 'AbortError'
        ) {
            // Do nothing - the abort handler already marked the message as cancelled
            return;
        }

        // For regular errors (not cancellations), we want to handle properly
        if (
            !(
                error instanceof Error &&
                error.name === 'AbortError'
            )
        ) {
            // Get the latest message state
            const currentMessage = getMessage(
                characterId,
                messageIndex,
            );
            if (currentMessage && messageId) {
                // Check if this is a cancellation error
                const isCancelled =
                    errorMessage ===
                    t('error.aiMessageCancelled');

                // Handle message interruption
                handleMessageInterrupt(
                    characterId,
                    messageId,
                    currentMessage,
                    isCancelled,
                    updateMessage,
                    addContext,
                    cleanAppState,
                    saveMessage,
                    toast,
                    t('error.cannotSaveMessage'),
                    getLatestContextRole,
                    getContextCount,
                    deleteLatestContext,
                );

                // Only show the cancellation message if it's a cancellation
                if (isCancelled) {
                    toast(errorMessage);
                }
                // For other errors that aren't session creation errors, show the error
                else if (
                    !errorMessage.includes('startChatError')
                ) {
                    toast(errorMessage);
                }
            }
        }
    };

    /**
     * Main function to generate a message response
     */
    const generateMessage = async (
        editor: Editor | null,
        input: string,
        characterId: string,
        language: string,
        character: TCharacter,
        isNewSession: boolean,
        messageIndex: number,
        toast: (message: string) => void,
    ) => {
        // Set up error message based on session state
        const errorMessage = isNewSession
            ? t('error.startChatError')
            : t('error.aiMessageCancelled');

        // Get message ID and data from stable index
        const messageId = getMessageId(
            characterId,
            messageIndex,
        );
        const message = getMessage(
            characterId,
            messageIndex,
        );

        if (!messageId || !message) {
            // Message not found, handle error
            toast(errorMessage);
            return;
        }

        // Create and set abort controller
        const currentAbortController =
            new AbortController();
        setAbortController(currentAbortController);

        // Create a promise that resolves when aborted to catch any unhandled rejections
        const abortPromise = createAbortPromise(
            currentAbortController,
            characterId,
            messageIndex,
            messageId,
        );

        // Prepare for message generation
        try {
            // Get previous AI message text (rawAI) if available
            let previousAiText: string | null = null;
            if (messageIndex > 0) {
                const prevMsg = getMessage(
                    characterId,
                    messageIndex - 1,
                );
                if (prevMsg?.rawAI?.trim()) {
                    previousAiText = prevMsg.rawAI.trim();
                }
            }
            const preparationResult = await Promise.race([
                prepareMessageGeneration(
                    editor,
                    input,
                    characterId,
                    language,
                    character,
                    isNewSession,
                    getContextsWithDeletableEntries,
                    deleteLatestMessage,
                    deleteOldestFromContext,
                    cleanAppState,
                    toast,
                    errorMessage,
                    currentAbortController.signal,
                    setIsDoingRAG,
                    deleteManyOldestFromContext,
                    previousAiText,
                ),
                abortPromise.then(() => ({
                    success: false,
                    relevantContent: [] as string[],
                    contentUrls: [] as string[],
                    fullContentIds: [] as string[],
                    contextData: undefined,
                })),
            ]);

            if (
                !preparationResult.success ||
                !preparationResult.contextData ||
                currentAbortController.signal.aborted
            ) {
                return;
            }

            // Generate message with race condition to handle aborts
            await Promise.race([
                generateMessageStream(
                    input,
                    preparationResult.contextData,
                    language,
                    character,
                    preparationResult.relevantContent,
                    currentAbortController.signal,
                    {
                        onStart: () =>
                            handleMessageGenerationStart(
                                editor,
                            ),
                        onChunk: (content: string) =>
                            handleMessageChunk(
                                characterId,
                                messageId,
                                message,
                                content,
                                currentAbortController,
                            ),
                        onError: () =>
                            handleMessageGenerationError(
                                characterId,
                                messageIndex,
                                messageId,
                            ),
                        onComplete: () =>
                            handleMessageGenerationComplete(
                                characterId,
                                messageIndex,
                                preparationResult.relevantContent,
                                preparationResult.contentUrls,
                                preparationResult.fullContentIds,
                            ),
                    },
                ),
                abortPromise,
            ]);
        } catch (error: unknown) {
            handleGenerationError(
                error,
                characterId,
                messageIndex,
                messageId,
                errorMessage,
                toast,
            );
        } finally {
            // Don't set isGenerating to false here - it should only be set to false
            // when the animation completes in handleMessageGenerationComplete
            setAbortController(undefined);
        }
    };

    return {
        generateMessage,
    };
};
