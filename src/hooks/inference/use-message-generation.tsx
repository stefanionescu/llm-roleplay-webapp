import { useTranslations } from 'next-intl';

import { llmConstants } from '@/config';
import { TContext } from '@/types/context';
import { TCharacter } from '@/types/character';
import {
    streamInferenceAPI,
    buildEnhancedSystemPrompt,
    getLanguageWordLimit,
    getLanguageTokenLimit,
    getCharacterSystemPrompt,
} from '@/lib/utils/inference/inference';

type MessageCallbacks = {
    onStart: () => void;
    onError: () => void;
    onComplete: () => void;
    onChunk: (content: string) => void;
};

export const useMessageGeneration = () => {
    const t = useTranslations();

    const generateMessageStream = async (
        input: string,
        contextData: {
            contexts: TContext[];
            leftoverCount: number;
        },
        language: string,
        character: TCharacter,
        relevantContent: string[],
        signal: AbortSignal,
        callbacks: MessageCallbacks,
    ) => {
        // Get system prompt
        const systemPrompt = getCharacterSystemPrompt(
            character,
            language,
        );

        // Get words and token limit based on language
        const maxWords = getLanguageWordLimit(language);
        const maxTokens = getLanguageTokenLimit(language);
        // Build the full system prompt with all instructions
        const finalSystemPrompt = buildEnhancedSystemPrompt(
            systemPrompt,
            relevantContent,
            maxWords,
            t,
        );

        // Animation state - using objects for reference stability
        const animationState = {
            queue: [] as string[],
            isAnimating: false,
            displayedMessage: '',
            fullStreamedMessage: '',
            aborted: false,
            streamCompleted: false,
        };

        // Animation function that processes the queue
        const processAnimationQueue = () => {
            if (animationState.queue.length === 0) {
                animationState.isAnimating = false;

                // If stream is completed and no more characters to animate, call onComplete
                if (
                    animationState.streamCompleted &&
                    !animationState.aborted
                ) {
                    callbacks.onComplete();
                }
                return;
            }

            if (animationState.aborted) {
                animationState.isAnimating = false;
                return;
            }

            animationState.isAnimating = true;

            // Take characters from queue in batches
            const batchSize =
                llmConstants.charAnimationBatchSize;
            const nextChars = animationState.queue
                .splice(0, batchSize)
                .join('');

            animationState.displayedMessage += nextChars;
            callbacks.onChunk(
                animationState.displayedMessage,
            );

            // Continue animation
            setTimeout(
                processAnimationQueue,
                llmConstants.charAnimationInterval,
            );
        };

        // Function to add content to animation queue
        const queueContent = (newContent: string) => {
            if (animationState.aborted || !newContent)
                return;

            // Add each character to queue
            animationState.queue.push(
                ...newContent.split(''),
            );

            // Start animation if not already running
            if (!animationState.isAnimating) {
                processAnimationQueue();
            }
        };

        // Handle abort - complete any remaining animation immediately
        const handleAbort = () => {
            animationState.aborted = true;

            // Show all remaining content immediately
            if (animationState.queue.length > 0) {
                const remainingContent =
                    animationState.queue.join('');
                animationState.displayedMessage +=
                    remainingContent;
                animationState.queue = [];
                callbacks.onChunk(
                    animationState.displayedMessage,
                );
            }

            animationState.isAnimating = false;
        };

        // Set up abort handler
        if (!signal.aborted) {
            signal.addEventListener('abort', handleAbort, {
                once: true,
            });
        }

        try {
            await streamInferenceAPI(
                finalSystemPrompt,
                contextData.contexts,
                input,
                maxTokens,
                signal,
                {
                    onStart: () => {
                        if (!animationState.aborted) {
                            callbacks.onStart();
                        }
                    },
                    onChunk: (newContent, fullContent) => {
                        if (animationState.aborted) return;

                        // Update full streamed message
                        animationState.fullStreamedMessage =
                            fullContent;

                        // Queue only the new content for animation
                        queueContent(newContent);
                    },
                    onError: (_error) => {
                        if (
                            !signal.aborted &&
                            !animationState.aborted
                        ) {
                            callbacks.onError();
                        }
                    },
                    onComplete: () => {
                        if (animationState.aborted) return;

                        // Mark stream as completed, but don't call onComplete yet
                        // The animation queue processor will call onComplete when animation finishes
                        animationState.streamCompleted =
                            true;

                        // If there's nothing in the queue and not animating, call onComplete immediately
                        if (
                            animationState.queue.length ===
                                0 &&
                            !animationState.isAnimating
                        ) {
                            callbacks.onComplete();
                        }
                    },
                },
            );
        } catch (error) {
            // Handle errors appropriately
            if (
                error instanceof Error &&
                error.name === 'AbortError'
            ) {
                return; // Abort is handled by the event listener
            }

            if (
                !signal.aborted &&
                !animationState.aborted
            ) {
                callbacks.onError();
            }
        }
    };

    return {
        generateMessageStream,
    };
};
