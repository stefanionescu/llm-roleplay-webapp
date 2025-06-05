import { useTranslations } from 'next-intl';

import { llmConstants } from '@/config';
import { TContext } from '@/types/context';
import { TCharacter } from '@/types/character';
import { streamInferenceAPI } from '@/lib/utils/inference/stream';
import {
    buildEnhancedSystemPrompt,
    getCharacterSystemPrompt,
} from '@/lib/utils/inference/language';

/**
 * Type for message generation callbacks
 */
type MessageGenerationCallbacks = {
    onStart?: () => void;
    onError?: () => void;
    onComplete?: () => void;
    onChunk?: (content: string) => void;
};

/**
 * Handles the entire message generation process
 */
export const generateMessageStream = async (
    input: string,
    contextData: {
        contexts: TContext[];
        leftoverCount: number;
    },
    language: string,
    character: TCharacter,
    relevantContent: string[] = [],
    signal: AbortSignal,
    translations: ReturnType<typeof useTranslations>,
    callbacks: MessageGenerationCallbacks = {},
): Promise<void> => {
    // Prepare system prompt based on character, language and RAG content
    const characterSystemPrompt = getCharacterSystemPrompt(
        character,
        language,
    );
    const maxTokens =
        llmConstants.maxInferenceResponseTokensBase;

    // Build the complete system prompt including RAG integration if needed
    const systemPrompt = buildEnhancedSystemPrompt(
        characterSystemPrompt,
        relevantContent,
        maxTokens,
        translations,
    );

    // Stream the message using the inference API
    await streamInferenceAPI(
        systemPrompt,
        contextData.contexts,
        input,
        maxTokens,
        signal,
        {
            onStart: callbacks.onStart,
            onComplete: callbacks.onComplete,
            onError: callbacks.onError,
            onChunk: (chunk, fullContent) => {
                if (callbacks.onChunk) {
                    callbacks.onChunk(fullContent);
                }
            },
        },
    );
};
